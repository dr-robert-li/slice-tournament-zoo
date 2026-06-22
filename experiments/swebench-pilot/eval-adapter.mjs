#!/usr/bin/env node
/**
 * SWE-Bench eval adapter (experiments-only pilot instrument).
 *
 * WHY: STZ's deterministic bridge grades a specimen by spawning a sealed harness
 * that prints a final JSON line `{passed,total,passRate}` and exits 0 iff
 * passRate===1 (see ../../src/eval-runner.ts `runSealed`). SWE-Bench's oracle is
 * a repo-native pytest suite, not a JS sealed file — so this adapter is a SIBLING
 * PRODUCER of that SAME contract for Python tasks. A scorer can call
 * `node eval-adapter.mjs <mode> ...` exactly where it would call
 * `node <sealed.mjs> <impl>` and parse the identical final JSON line.
 *
 * It deliberately does NOT route through `fullEval`: V8 coverage and the JS
 * source mutators there are meaningless for a Python patch, and `detectHacks`
 * matches JS hack patterns only. Coverage/mutation are simply not part of the
 * SWE-Bench oracle.
 *
 * ORACLE (faithful to SWE-Bench): an instance is `resolved` iff
 *   ALL FAIL_TO_PASS tests pass  AND  ALL PASS_TO_PASS tests still pass,
 * running ONLY those named tests (the full suite drags in unrelated flakiness).
 * We map resolved -> passRate===1 so the existing gate semantics carry over;
 * partial credit (passRate<1) is reported but never counts as resolved.
 *
 * TWO MODES:
 *   report  — AUTHORITATIVE. Parse the official `swebench` harness output
 *             (report.json, Docker-per-instance). This is the field-norm path;
 *             provisioning/deps are the harness's job, not ours. Rolling our own
 *             grading is rejected — it reintroduces the spec-gap-assisted-win
 *             confound the cron/hexcolor pilots fought.
 *   pytest  — FALLBACK. Run the named tests in an ALREADY-PROVISIONED checkout
 *             (deps installed, base_commit + test_patch + candidate patch
 *             applied) and grade via JUnit XML. Use only when a faithful env is
 *             already in place; report mode is preferred whenever available.
 *
 * BLINDNESS (carried from the sealed-suite pilots): specimens must NEVER see the
 * FAIL_TO_PASS set — it is the held-out oracle. This adapter is a GRADER run by
 * the scorer, never handed to an implementer.
 *
 * Usage:
 *   node eval-adapter.mjs report  --report <report.json> [--instance <id>]
 *   node eval-adapter.mjs pytest  --cwd <repo> --f2p <json|csv> [--p2p <json|csv>]
 *                                 [--junit <path>] [--cmd "python -m pytest"]
 *                                 [--timeout <ms>]
 *
 * --f2p/--p2p accept either a JSON array string ('["a::b"]') or a comma list.
 * Exit code: 0 iff resolved===true, else 1 (mirrors the sealed-harness contract).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";

const DEFAULT_TIMEOUT_MS = 1_800_000; // 30 min — real instances can be slow.

/** Parse `--k v` / `--k=v` flags into a record. */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq !== -1) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
    } else {
      out[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
    }
  }
  return out;
}

/** A test list may arrive as a JSON array string or a comma-separated list. */
export function parseTestList(s) {
  if (!s || s === "true") return [];
  const t = s.trim();
  if (t.startsWith("[")) {
    try {
      const arr = JSON.parse(t);
      if (Array.isArray(arr)) return arr.map(String).filter(Boolean);
    } catch {
      /* fall through to csv */
    }
  }
  return t.split(",").map((x) => x.trim()).filter(Boolean);
}

/**
 * Compute the SWE-Bench verdict from per-test outcomes.
 * @param {Map<string,'pass'|'fail'>} outcomes  nodeid -> outcome (missing = fail)
 * @param {string[]} f2p  FAIL_TO_PASS node ids (must all pass)
 * @param {string[]} p2p  PASS_TO_PASS node ids (must all still pass)
 */
export function verdict(outcomes, f2p, p2p) {
  const status = (id) => (outcomes.get(id) === "pass" ? "pass" : "fail");
  const f2pResults = f2p.map((id) => ({ id, status: status(id) }));
  const p2pResults = p2p.map((id) => ({ id, status: status(id) }));
  const f2pPass = f2pResults.filter((r) => r.status === "pass").length;
  const p2pPass = p2pResults.filter((r) => r.status === "pass").length;
  const total = f2p.length + p2p.length;
  const passed = f2pPass + p2pPass;
  // resolved requires EVERY named test in both buckets to be green.
  const resolved = f2p.length > 0 && f2pPass === f2p.length && p2pPass === p2p.length;
  return {
    resolved,
    passRate: total === 0 ? 0 : passed / total,
    passed,
    total,
    fail_to_pass: { passed: f2pPass, total: f2p.length },
    pass_to_pass: { passed: p2pPass, total: p2p.length },
    failing: [...f2pResults, ...p2pResults].filter((r) => r.status !== "pass").map((r) => r.id),
  };
}

/**
 * Parse the official swebench harness report.json. The harness emits, per run,
 * an object keyed by instance_id (or a single-instance object) carrying a
 * `resolved` boolean and FAIL_TO_PASS / PASS_TO_PASS breakdowns under
 * `tests_status`. We trust `resolved` as authoritative and reconstruct the
 * scalar passRate from the success/failure lists when present.
 */
export function fromReport(report, instanceId) {
  let inst = report;
  // Harness shape A: { "<instance_id>": {...} }. Shape B: a bare instance object.
  if (instanceId && report && typeof report === "object" && report[instanceId]) {
    inst = report[instanceId];
  } else if (!("resolved" in (report ?? {})) && report && typeof report === "object") {
    const keys = Object.keys(report);
    if (keys.length === 1) inst = report[keys[0]];
  }
  if (!inst || typeof inst !== "object") {
    throw new Error("report.json: could not locate an instance object" + (instanceId ? ` for '${instanceId}'` : ""));
  }
  const ts = inst.tests_status ?? {};
  const f2p = ts.FAIL_TO_PASS ?? ts.fail_to_pass ?? { success: [], failure: [] };
  const p2p = ts.PASS_TO_PASS ?? ts.pass_to_pass ?? { success: [], failure: [] };
  const f2pPass = (f2p.success ?? []).length;
  const f2pTotal = f2pPass + (f2p.failure ?? []).length;
  const p2pPass = (p2p.success ?? []).length;
  const p2pTotal = p2pPass + (p2p.failure ?? []).length;
  const total = f2pTotal + p2pTotal;
  const passed = f2pPass + p2pPass;
  // `resolved` from the harness is authoritative; fall back to the strict rule.
  const resolved =
    typeof inst.resolved === "boolean"
      ? inst.resolved
      : f2pTotal > 0 && f2pPass === f2pTotal && p2pPass === p2pTotal;
  return {
    resolved,
    // Keep the contract consistent: resolved instances report passRate 1 even if
    // the harness omitted per-test counts.
    passRate: resolved ? 1 : total === 0 ? 0 : passed / total,
    passed,
    total,
    fail_to_pass: { passed: f2pPass, total: f2pTotal },
    pass_to_pass: { passed: p2pPass, total: p2pTotal },
    failing: [...(f2p.failure ?? []), ...(p2p.failure ?? [])],
    source: "swebench-report",
  };
}

/**
 * Parse a pytest JUnit XML string into nodeid -> outcome. pytest's junitxml
 * writes <testcase classname="pkg.mod" name="test_x"> with a child <failure>,
 * <error>, or <skipped> when not passing. SWE-Bench node ids look like
 * `path/to/test_mod.py::Class::test_x`. We reconstruct a best-effort nodeid from
 * (file?, classname, name) and ALSO index by the bare leaf name so the matcher
 * (below) can fall back when the dotted classname can't be mapped to a path.
 */
export function parseJUnit(xml) {
  const cases = [];
  const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const attrs = m[1];
    const body = m[3] ?? "";
    const get = (k) => {
      // \b so `name` does not match inside `classname`.
      const a = new RegExp(`\\b${k}="([^"]*)"`).exec(attrs);
      return a ? a[1] : "";
    };
    const classname = get("classname");
    const name = get("name");
    const file = get("file");
    const failed = /<(failure|error)\b/.test(body);
    const skipped = /<skipped\b/.test(body);
    cases.push({ classname, name, file, status: failed ? "fail" : skipped ? "skip" : "pass" });
  }
  return cases;
}

/**
 * Match requested SWE-Bench node ids against parsed JUnit cases. Strategy, most
 * to least specific:
 *   1. exact reconstructed nodeid `<file>::<class-tail>::<name>` or `<file>::<name>`
 *   2. `<class-with-/>::<name>` (classname dots -> slashes, .py appended)
 *   3. unique leaf-name match (last `::` segment == junit name)
 * Unmatched ids are treated as failures (a test that didn't run did not pass).
 * Returns Map<nodeid, 'pass'|'fail'>; 'skip' counts as fail for F2P semantics.
 */
export function matchOutcomes(cases, nodeIds) {
  const norm = (s) => s.replace(/\.py$/, "").replace(/[\\/]/g, ".");
  // Index cases several ways.
  const byLeaf = new Map(); // name -> [case]
  for (const c of cases) {
    if (!byLeaf.has(c.name)) byLeaf.set(c.name, []);
    byLeaf.get(c.name).push(c);
  }
  const out = new Map();
  for (const id of nodeIds) {
    const parts = id.split("::");
    const leaf = parts[parts.length - 1].replace(/\[.*\]$/, ""); // strip params for leaf compare
    const filePart = parts[0]; // e.g. path/to/test_mod.py
    let chosen = null;
    const candidates = byLeaf.get(parts[parts.length - 1]) ?? byLeaf.get(leaf) ?? [];
    if (candidates.length === 1) {
      chosen = candidates[0];
    } else if (candidates.length > 1) {
      // Disambiguate by file: junit `file` attr or dotted classname vs the id's path.
      const wantFile = norm(filePart);
      chosen =
        candidates.find((c) => c.file && norm(c.file) === wantFile) ??
        candidates.find((c) => c.classname && norm(c.classname).startsWith(wantFile)) ??
        candidates.find((c) => c.classname && wantFile.endsWith(norm(c.classname).split(".").slice(0, 1).join("."))) ??
        null;
    }
    out.set(id, chosen ? (chosen.status === "pass" ? "pass" : "fail") : "fail");
  }
  return out;
}

/** Run pytest over the named tests in a provisioned cwd; grade via JUnit XML. */
function runPytest(args) {
  const cwd = resolve(args.cwd ?? ".");
  if (!existsSync(cwd)) throw new Error(`--cwd does not exist: ${cwd}`);
  const f2p = parseTestList(args.f2p);
  const p2p = parseTestList(args.p2p);
  if (f2p.length === 0) throw new Error("--f2p (FAIL_TO_PASS) is required and must be non-empty");
  const timeout = Number(args.timeout ?? DEFAULT_TIMEOUT_MS);
  const tmp = mkdtempSync(join(tmpdir(), "stz-swe-"));
  const junitPath = args.junit ? resolve(args.junit) : join(tmp, "junit.xml");
  try {
    const base = (args.cmd ?? "python -m pytest").split(/\s+/);
    const tests = [...new Set([...f2p, ...p2p])];
    const argv = [...base.slice(1), "-p", "no:cacheprovider", "-rN", "--no-header", `--junitxml=${junitPath}`, ...tests];
    const r = spawnSync(base[0], argv, { cwd, encoding: "utf8", timeout, env: process.env });
    if (r.error && r.error.code === "ETIMEDOUT") {
      return { resolved: false, passRate: 0, passed: 0, total: f2p.length + p2p.length, status: "DNF", reason: `timeout after ${timeout}ms`, source: "pytest" };
    }
    if (!existsSync(junitPath)) {
      return {
        resolved: false, passRate: 0, passed: 0, total: f2p.length + p2p.length, status: "DNF",
        reason: "pytest produced no JUnit XML (collection error / missing deps?)",
        stderrTail: (r.stderr ?? "").split("\n").slice(-8).join("\n"),
        source: "pytest",
      };
    }
    const cases = parseJUnit(readFileSync(junitPath, "utf8"));
    const outcomes = matchOutcomes(cases, [...f2p, ...p2p]);
    return { ...verdict(outcomes, f2p, p2p), status: "ran", source: "pytest" };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Parse mode: read the official harness report.json. */
function runReport(args) {
  const path = resolve(args.report ?? "");
  if (!existsSync(path)) throw new Error(`--report not found: ${path}`);
  const report = JSON.parse(readFileSync(path, "utf8"));
  const instance = args.instance && args.instance !== "true" ? args.instance : undefined;
  return { ...fromReport(report, instance), status: "ran" };
}

function main() {
  const [, , mode, ...rest] = process.argv;
  const args = parseArgs(rest);
  let result;
  try {
    if (mode === "report") result = runReport(args);
    else if (mode === "pytest") result = runPytest(args);
    else {
      console.error("usage: eval-adapter.mjs <report|pytest> [flags]  (see file header)");
      process.exit(2);
    }
  } catch (e) {
    // Emit a contract-shaped failure line so the scorer never crashes on us.
    result = { resolved: false, passRate: 0, passed: 0, total: 0, status: "ERROR", reason: String(e.message ?? e) };
    console.log(JSON.stringify(result));
    process.exit(1);
  }
  // Final line = the bridge contract. Keep it LAST so a tail-parse picks it up.
  console.log(JSON.stringify(result));
  process.exit(result.resolved ? 0 : 1);
}

// Only run the CLI when invoked directly, so the test file can import the pure fns.
if (import.meta.url === `file://${process.argv[1]}`) main();
