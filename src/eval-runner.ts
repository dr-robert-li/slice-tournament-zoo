/**
 * Real eval runner (F7/F11) — un-stubs the metrics the bridge used to take on
 * trust. Everything here is genuinely executed, with no test/coverage/mutation
 * library dependency (N10 minimal toolchain):
 *
 *   testPassRate  — run the sealed harness against the specimen, parse its
 *                   final JSON line {passed,total,passRate}.
 *   coverage      — run under NODE_V8_COVERAGE and measure the fraction of the
 *                   specimen file's bytes that V8 marked executed.
 *   mutationScore — apply a small set of source mutators to the specimen,
 *                   re-run the sealed harness against each mutant, and report
 *                   the SURVIVAL rate (mutants the suite failed to kill). Lower
 *                   is better; this is the eval signal that separates a thorough
 *                   suite from a shallow one.
 *
 * The sealed harness contract: `node <sealed.mjs> <absolute-impl-path>` prints a
 * final line `{"passed":n,"total":m,"passRate":r}` and exits 0 iff r===1. The
 * runner resolves impl paths to absolute itself (the relative-path bug that bit
 * the first live run must never reach a user).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

export interface SealedResult {
  passed: number;
  total: number;
  passRate: number;
}

const RUN_TIMEOUT_MS = 20_000;

/** Run the sealed harness against one implementation file. */
export function runSealed(sealedPath: string, implPath: string, covDir?: string): SealedResult {
  const abs = resolve(implPath);
  const env = covDir ? { ...process.env, NODE_V8_COVERAGE: covDir } : process.env;
  const r = spawnSync("node", [resolve(sealedPath), abs], {
    encoding: "utf8",
    timeout: RUN_TIMEOUT_MS,
    env,
  });
  const out = (r.stdout ?? "").trim().split("\n").filter(Boolean);
  const last = out[out.length - 1] ?? "";
  try {
    const parsed = JSON.parse(last) as SealedResult;
    if (typeof parsed.passRate === "number") return parsed;
  } catch {
    /* fall through to a zeroed result */
  }
  return { passed: 0, total: 1, passRate: 0 };
}

export type CrossStatus = "both-pass" | "divergent" | "both-fail";

export interface CrossReferenceResult {
  /** Sealed-suite result for the primary (test-author's) reference. */
  a: SealedResult;
  /** Sealed-suite result for the independently-authored cross-family reference. */
  b: SealedResult;
  /** Both independent references satisfy the suite — the wanted green state. */
  bothPass: boolean;
  /** Exactly one passes — the suite encodes a reference-specific assumption. */
  divergent: boolean;
  /** Neither passes — the suite is unsatisfiable for both (a gate failure). */
  bothFail: boolean;
  status: CrossStatus;
}

/**
 * Cross-family reference check (F10-adjacent / R2 "cross-family quorum"). The
 * single smoke-gate reference is authored by the same agent as the suite, so it
 * shares the author's blind spots: a fragile invariant (e.g. identity keyed on
 * mutable position) goes green against it and still ships. A SECOND,
 * independently-authored reference — different model family or a human — that is
 * run against the SAME sealed suite catches exactly that class: if the two
 * references disagree, the suite encodes an assumption one author didn't share.
 *
 * This primitive only REPORTS the divergence; it deliberately does not verdict.
 * A B-fails-A-passes split is ambiguous — either the suite over-fits A (the
 * blind spot we want to surface) OR reference B is simply wrong — and aggregate
 * pass counts cannot tell them apart. Classification is the orchestrator's job,
 * consistent with the guide/sensor split in `sealed-suite.md`: divergence is a
 * GUIDE-class signal for human adjudication (amend + strengthen authoring
 * guidance, or discard a buggy B), not a sensor-style auto-rewrite trigger.
 */
export function crossReference(sealedPath: string, refAPath: string, refBPath: string): CrossReferenceResult {
  const a = runSealed(sealedPath, refAPath);
  const b = runSealed(sealedPath, refBPath);
  const aPass = a.passRate === 1;
  const bPass = b.passRate === 1;
  const bothPass = aPass && bPass;
  const bothFail = !aPass && !bPass;
  const divergent = aPass !== bPass;
  const status: CrossStatus = bothPass ? "both-pass" : divergent ? "divergent" : "both-fail";
  return { a, b, bothPass, divergent, bothFail, status };
}

/** Real coverage: fraction of the impl file's bytes V8 recorded as executed. */
export function measureCoverage(sealedPath: string, implPath: string): number {
  const abs = resolve(implPath);
  const covDir = mkdtempSync(join(tmpdir(), "stz-cov-"));
  try {
    runSealed(sealedPath, abs, covDir);
    const fileLen = readFileSync(abs, "utf8").length;
    if (fileLen === 0) return 0;
    let covered = 0;
    for (const f of readdirSync(covDir)) {
      const data = JSON.parse(readFileSync(join(covDir, f), "utf8")) as {
        result: { url: string; functions: { ranges: { startOffset: number; endOffset: number; count: number }[] }[] }[];
      };
      const entry = data.result.find((e) => e.url.includes(abs) || abs.includes(e.url.replace("file://", "")));
      if (!entry) continue;
      // Union of executed character ranges across all functions.
      const marks = new Uint8Array(fileLen);
      for (const fn of entry.functions) {
        for (const rng of fn.ranges) {
          if (rng.count > 0) {
            for (let i = rng.startOffset; i < Math.min(rng.endOffset, fileLen); i++) marks[i] = 1;
          }
        }
      }
      covered = marks.reduce((a, b) => a + b, 0);
      break;
    }
    return Math.min(1, covered / fileLen);
  } finally {
    rmSync(covDir, { recursive: true, force: true });
  }
}

/** Source-level mutators. Each returns a mutated copy or null if inapplicable. */
const MUTATORS: { name: string; apply: (s: string) => string | null }[] = [
  { name: "lt→lte", apply: (s) => mutateFirst(s, /([^<>=])<([^<=])/, "$1<=$2") },
  { name: "gt→gte", apply: (s) => mutateFirst(s, /([^<>=])>([^>=])/, "$1>=$2") },
  { name: "lte→lt", apply: (s) => mutateFirst(s, /<=/, "<") },
  { name: "gte→gt", apply: (s) => mutateFirst(s, />=/, ">") },
  { name: "plus→minus", apply: (s) => mutateFirst(s, /([\w)])\s\+\s([\w(])/, "$1 - $2") },
  { name: "min→max", apply: (s) => mutateFirst(s, /Math\.min/, "Math.max") },
  { name: "max→min", apply: (s) => mutateFirst(s, /Math\.max/, "Math.min") },
  { name: "swap-cmp-lo-hi", apply: (s) => mutateFirst(s, /\blo\b/, "hi") },
];

function mutateFirst(src: string, re: RegExp, repl: string): string | null {
  const out = src.replace(re, repl);
  return out === src ? null : out;
}

export interface Mutator {
  name: string;
  apply: (s: string) => string | null;
}

/**
 * A serializable, promoted bug-class mutator (0.9.0, gene G2). The harness
 * meta-loop mines a discovered blind-spot (e.g. the `5abc` `parseInt` silent
 * truncation the JUDGE pilot found past a green suite) into one of these and
 * appends it to the expanding battery under `60-harness/battery`. Regex-driven
 * so it stays deterministic and tool-free (N10).
 */
export interface MutatorSpec {
  name: string;
  /** Regex source applied via `String.replace` (first match only). */
  find: string;
  flags?: string;
  replace: string;
}

function specToMutator(spec: MutatorSpec): Mutator {
  const re = new RegExp(spec.find, spec.flags ?? "");
  return { name: spec.name, apply: (s) => mutateFirst(s, re, spec.replace) };
}

/**
 * The active mutation battery = built-in deterministic mutators UNION any
 * promoted bug-class mutators loaded from `batteryDir` (JSON arrays of
 * `MutatorSpec`). Built-ins always come first so ordering — and therefore
 * mutant ids — stay stable (N6). A malformed/duplicate-name spec is skipped,
 * never throws, so a corrupt battery file can't break a tournament.
 */
export function loadBattery(batteryDir?: string): Mutator[] {
  const battery: Mutator[] = [...MUTATORS];
  if (!batteryDir || !existsSync(batteryDir)) return battery;
  const seen = new Set(battery.map((m) => m.name));
  for (const f of readdirSync(batteryDir).sort()) {
    if (!f.endsWith(".json")) continue;
    try {
      const specs = JSON.parse(readFileSync(join(batteryDir, f), "utf8")) as MutatorSpec[];
      for (const spec of specs) {
        if (!spec?.name || seen.has(spec.name)) continue;
        battery.push(specToMutator(spec));
        seen.add(spec.name);
      }
    } catch {
      /* a corrupt battery file is skipped, not fatal */
    }
  }
  return battery;
}

/** Remove block and line comments so mutators only touch executable code. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * Real mutation testing: produce mutants, re-run the sealed suite on each, and
 * report SURVIVAL rate (1 = nothing killed, 0 = every mutant killed). Mutants
 * that don't change the source or fail to load count as not-applicable and are
 * skipped. Returns 1 (worst) when no mutant could be applied so a degenerate
 * file is never rewarded.
 */
export function measureMutation(
  sealedPath: string,
  implPath: string,
  battery: Mutator[] = MUTATORS,
): { mutationScore: number; mutants: number; survivors: number } {
  const abs = resolve(implPath);
  // Mutate executable code, not comments. A `Math.min` inside a doc comment
  // would otherwise yield a behaviour-identical mutant that always "survives"
  // and silently inflates the survival rate.
  const src = stripComments(readFileSync(abs, "utf8"));
  const dir = mkdtempSync(join(tmpdir(), "stz-mut-"));
  let mutants = 0;
  let survivors = 0;
  try {
    for (const m of battery) {
      const mutated = m.apply(src);
      if (mutated === null) continue;
      mutants++;
      const mutPath = join(dir, `mutant-${m.name}.mjs`);
      writeFileSync(mutPath, mutated, "utf8");
      const res = runSealed(sealedPath, mutPath);
      // A surviving mutant still passes the suite (suite failed to catch it).
      if (res.passRate === 1) survivors++;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const mutationScore = mutants === 0 ? 1 : survivors / mutants;
  return { mutationScore, mutants, survivors };
}

export interface SurvivingMutant {
  name: string;
  /** The mutated source the sealed suite FAILED to distinguish from the impl. */
  mutantSource: string;
  sealedResult: SealedResult;
}

/**
 * Adversarial suite-hardening primitive (0.9.0, SSR-style). Runs the SAME loop
 * as `measureMutation` but RETURNS the surviving mutant *sources* — each a
 * candidate suite blind spot (the sealed suite + judge could not tell it from
 * the winner). A survivor is only a real defect if it violates a named contract
 * clause; that adjudication + general-case authoring + reference re-verify is
 * the bridge `inject` command's job (the mutant-promotion oracle gate), never
 * automatic. Blind by construction: derives mutants from the impl + battery,
 * never from the truth oracle.
 */
export function injectMutants(
  sealedPath: string,
  implPath: string,
  battery: Mutator[] = MUTATORS,
): SurvivingMutant[] {
  const abs = resolve(implPath);
  const src = stripComments(readFileSync(abs, "utf8"));
  const dir = mkdtempSync(join(tmpdir(), "stz-inject-"));
  const survivors: SurvivingMutant[] = [];
  try {
    for (const m of battery) {
      const mutated = m.apply(src);
      if (mutated === null) continue;
      const mutPath = join(dir, `mutant-${m.name}.mjs`);
      writeFileSync(mutPath, mutated, "utf8");
      const res = runSealed(sealedPath, mutPath);
      if (res.passRate === 1) survivors.push({ name: m.name, mutantSource: mutated, sealedResult: res });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return survivors;
}

/**
 * Code-health score in [0,1] (0.9.0, CodeClash-informed: iterative agents
 * degrade codebases while winning rounds). Self-contained per-file proxies —
 * deterministic, source-only, no group context needed:
 *   - duplicated non-trivial-line ratio (textual redundancy), and
 *   - branch-density excess (cyclomatic proxy) above a parsimony threshold.
 * 1 = healthy/parsimonious, lower = bloated/redundant. Scoped honestly to what
 * computes on a single file; multi-file slices add file-count terms later.
 */
export function measureCodeHealth(implPath: string): number {
  const src = stripComments(readFileSync(resolve(implPath), "utf8"));
  const lines = src.split("\n").map((l) => l.trim()).filter((l) => l.length > 2);
  if (lines.length === 0) return 1;
  const counts = new Map<string, number>();
  for (const l of lines) counts.set(l, (counts.get(l) ?? 0) + 1);
  let dup = 0;
  for (const n of counts.values()) if (n > 1) dup += n - 1;
  const dupRatio = dup / lines.length;
  const branchTokens = (src.match(/\b(if|for|while|case|catch)\b|&&|\|\||\?[^.]/g) ?? []).length;
  const branchDensity = branchTokens / lines.length;
  // A modest branch density is normal; only the excess above ~0.35/line is penalized.
  const branchExcess = Math.max(0, branchDensity - 0.35);
  const score = 1 - 0.6 * Math.min(1, dupRatio) - 0.4 * Math.min(1, branchExcess);
  return Math.max(0, Math.min(1, score));
}

export interface FullEval {
  testPassRate: number;
  coverage: number;
  mutationScore: number;
  /** 0..1 code-health (0.9.0). */
  codeHealth: number;
  passed: number;
  total: number;
  mutants: number;
  survivors: number;
}

/**
 * Run all real measurements for one specimen implementation. `batteryDir` (the
 * promoted bug-class mutators under `60-harness/battery`) is unioned with the
 * built-ins so a sharpened battery participates; omit it for legacy behaviour.
 */
export function fullEval(sealedPath: string, implPath: string, batteryDir?: string): FullEval {
  const sealed = runSealed(sealedPath, implPath);
  const coverage = measureCoverage(sealedPath, implPath);
  const mutation = measureMutation(sealedPath, implPath, loadBattery(batteryDir));
  const codeHealth = measureCodeHealth(implPath);
  return {
    testPassRate: sealed.passRate,
    coverage,
    mutationScore: mutation.mutationScore,
    codeHealth,
    passed: sealed.passed,
    total: sealed.total,
    mutants: mutation.mutants,
    survivors: mutation.survivors,
  };
}

/** Write a metrics.json the bridge `record-eval` consumes. */
export function writeMetrics(path: string, e: FullEval): void {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify(
      { testPassRate: e.testPassRate, coverage: e.coverage, mutationScore: e.mutationScore, codeHealth: e.codeHealth },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}
