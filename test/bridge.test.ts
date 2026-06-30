import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBridge } from "../src/bridge.js";
import { STZ_DIR } from "../src/taxonomy.js";
import { freshState, loadState, saveState, setPhaseStatus, isComplete } from "../src/state.js";
import { deriveSliceStatus } from "../src/project.js";
import { PHASES, type SliceManifest } from "../src/types.js";

let root: string;
let captured: string;
const origWrite = process.stdout.write.bind(process.stdout);

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-bridge-"));
  captured = "";
  // Capture the JSON the bridge prints to stdout (the command parses this).
  (process.stdout.write as unknown as (s: string) => boolean) = (s: string) => {
    captured += s;
    return true;
  };
});
afterEach(async () => {
  process.stdout.write = origWrite;
  await rm(root, { recursive: true, force: true });
});

function lastJSON<T>(): T {
  return JSON.parse(captured) as T;
}

const manifest: SliceManifest = {
  id: "slice-01",
  name: "demo",
  contract: "export function run(input: Request): Result",
  donePredicates: [{ id: "schema", expr: "returns_schema(Result)", kind: "schema" }],
  traceTier: "minimal",
  complexity: 2,
  dependsOn: [],
  judge: { votesPerPair: 2 },
  summary: "bridge demo",
};

async function writeSpecimen(spec: string, files: Record<string, string>): Promise<void> {
  const dir = join(root, STZ_DIR, "40-slices", "slice-01", "prototypes", `specimen-${spec}`, "src");
  await mkdir(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(dir, name), content, "utf8");
  }
}

async function metricsFile(m: object): Promise<string> {
  const p = join(root, `metrics.json`);
  await writeFile(p, JSON.stringify(m), "utf8");
  return p;
}

describe("in-session bridge — the deterministic half the /stz:run command calls", () => {
  it("drives begin → record-eval → gate → votes → select → finalize end to end", async () => {
    // begin
    const manifestPath = join(root, "m.json");
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
    await runBridge(["begin", "--root", root, "--manifest", manifestPath]);
    expect(lastJSON<{ sliceId: string }>().sliceId).toBe("slice-01");

    // two clean specimens + one with a planted hack (test-skip)
    await writeSpecimen("a", { "impl.ts": "export const run = (x:number)=>x*2;\n" });
    await writeSpecimen("b", { "impl.ts": "export const run = (x:number)=>x+x;\n" });
    await writeSpecimen("c", { "impl.ts": "export const run = (x:number)=>x*2;\n", "cheat.test.ts": "it.skip('contract',()=>{});\n" });

    // record-eval for each (eval runner supplied these metrics; hack-detector runs in-bridge)
    captured = "";
    await runBridge(["record-eval", "--root", root, "--slice", "slice-01", "--specimen", "a", "--metrics", await metricsFile({ testPassRate: 1, coverage: 0.95, mutationScore: 0.1 })]);
    expect(lastJSON<{ passedGate: boolean }>().passedGate).toBe(true);

    captured = "";
    await runBridge(["record-eval", "--root", root, "--slice", "slice-01", "--specimen", "b", "--metrics", await metricsFile({ testPassRate: 1, coverage: 0.85, mutationScore: 0.2 })]);
    expect(lastJSON<{ passedGate: boolean }>().passedGate).toBe(true);

    // c passes its tests but planted an it.skip → hack-detector disqualifies it
    captured = "";
    await runBridge(["record-eval", "--root", root, "--slice", "slice-01", "--specimen", "c", "--metrics", await metricsFile({ testPassRate: 1, coverage: 0.9, mutationScore: 0.15 })]);
    const cEval = lastJSON<{ passedGate: boolean; hackFindings: unknown[] }>();
    expect(cEval.passedGate).toBe(false);
    expect(cEval.hackFindings.length).toBeGreaterThan(0);

    // gate: a,b pass; c eliminated; pairings = [[a,b]]
    captured = "";
    await runBridge(["gate", "--root", root, "--slice", "slice-01"]);
    const g = lastJSON<{ passers: string[]; eliminated: unknown[]; pairings: string[][] }>();
    expect(g.passers.sort()).toEqual(["a", "b"]);
    expect(g.eliminated.length).toBe(1);
    expect(g.pairings).toEqual([["a", "b"]]);

    // record-votes: judge agents voted a over b twice (V=2)
    captured = "";
    const votesPath = join(root, "votes.json");
    await writeFile(votesPath, JSON.stringify([
      { a: "a", b: "b", winner: "a" },
      { a: "a", b: "b", winner: "a" },
    ]), "utf8");
    await runBridge(["record-votes", "--root", root, "--slice", "slice-01", "--votes", votesPath]);
    expect(lastJSON<{ recorded: number }>().recorded).toBe(2);

    // select: winner a; GRPO spans the whole group (a,b,c incl. eliminated c)
    captured = "";
    await runBridge(["select", "--root", root, "--slice", "slice-01"]);
    const sel = lastJSON<{ winner: string; ranking: string[]; advantages: { specimen: string }[] }>();
    expect(sel.winner).toBe("a");
    expect(sel.ranking).toEqual(["a", "b"]);
    expect(sel.advantages.map((x) => x.specimen).sort()).toEqual(["a", "b", "c"]);

    // finalize: spec-diff + pressure + audit
    captured = "";
    const intentPath = join(root, "intent.json");
    const asbuiltPath = join(root, "asbuilt.json");
    await writeFile(intentPath, JSON.stringify({ claims: ["doubles the input", "exposes run()"] }), "utf8");
    await writeFile(asbuiltPath, JSON.stringify({ claims: ["doubles the input", "exposes run()", "via multiply"] }), "utf8");
    await runBridge(["finalize", "--root", root, "--slice", "slice-01", "--intent", intentPath, "--asbuilt", asbuiltPath]);
    const fin = lastJSON<{ winner: string; faithful: boolean; culled: number }>();
    expect(fin.winner).toBe("a");
    expect(fin.faithful).toBe(true);
    expect(fin.culled).toBe(2); // b and c are non-winners

    // artifacts materialized
    const tournament = await readFile(join(root, STZ_DIR, "40-slices/slice-01/tournament.md"), "utf8");
    expect(tournament).toMatch(/winner:\*\* specimen-a/);
    const pressure = await readFile(join(root, STZ_DIR, "50-pressure/slice-01/pressure.md"), "utf8");
    expect(pressure).toMatch(/specimen-c/);
    expect(pressure).toMatch(/test-skip/);
    const specdiff = await readFile(join(root, STZ_DIR, "40-slices/slice-01/spec-diff.md"), "utf8");
    expect(specdiff).toMatch(/Planned but missing \(0\)/);

    // finalize marks the WHOLE tournament half done — not just judgment — so the
    // slice can read complete instead of "running" forever (the state.json reset
    // bug: without this the pipeline never advances and re-runs it on resume).
    const state = await loadState(root, "slice-01");
    for (const p of ["test-authoring", "planning", "tournament", "judgment"] as const) {
      expect(state.phaseStatus[p]).toBe("done");
    }
    // every phase-done is journaled (no silent state edits), test-authoring incl.
    expect(state.events.some((e) => e.kind === "phase-done" && e.detail.includes("test-authoring"))).toBe(true);

    // In the pipeline path the early phases are pre-seeded done by
    // project-seed-slices; simulate that and confirm the slice then reads
    // complete and derives "done" (so the frontier advances / resume is stable).
    let seeded = state;
    for (const p of ["elicitation", "research", "ground-truth-validation", "standards"] as const) {
      seeded = setPhaseStatus(seeded, p, "done");
    }
    await saveState(root, seeded);
    for (const p of PHASES) expect(seeded.phaseStatus[p]).toBe("done");
    expect(isComplete(seeded)).toBe(true);
    expect(await deriveSliceStatus(root, "slice-01")).toBe("done");
  });

  it("begin preserves a project-seeded state instead of clobbering it", async () => {
    // Simulate project-seed-slices: the four early phases settled at the project
    // level, persisted before /stz:run calls begin.
    let seeded = freshState("slice-01", manifest.complexity);
    for (const p of ["elicitation", "research", "ground-truth-validation", "standards"] as const) {
      seeded = setPhaseStatus(seeded, p, "done");
    }
    await saveState(root, seeded);

    const manifestPath = join(root, "m.json");
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
    await runBridge(["begin", "--root", root, "--manifest", manifestPath]);

    // begin must NOT reset the seeded early phases (the bug that made a slice
    // unable to ever read complete → the pipeline "reset").
    const state = await loadState(root, "slice-01");
    for (const p of ["elicitation", "research", "ground-truth-validation", "standards"] as const) {
      expect(state.phaseStatus[p]).toBe("done");
    }
    expect(state.phaseStatus.planning).toBe("done"); // begin still marks planning
  });

  it("a standalone begin (no seeded state) starts the early phases fresh", async () => {
    const manifestPath = join(root, "m.json");
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
    await runBridge(["begin", "--root", root, "--manifest", manifestPath]);
    const state = await loadState(root, "slice-01");
    expect(state.phaseStatus.elicitation).toBe("pending");
    expect(state.phaseStatus.planning).toBe("done");
  });
});

describe("bridge escalate — cross-round bounded escalation the command drives (F14)", () => {
  // Stand up a slice with state + a field that all fails the gate, then drive
  // the no-passers FSM the way /stz:run does: escalate once per failed round.
  async function setupFailedField(): Promise<void> {
    const manifestPath = join(root, "m.json");
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
    await runBridge(["begin", "--root", root, "--manifest", manifestPath]);
    await writeSpecimen("a", { "impl.ts": "export const run = (x:number)=>x;\n" });
    await writeSpecimen("b", { "impl.ts": "export const run = (x:number)=>x;\n" });
    for (const s of ["a", "b"]) {
      captured = "";
      await runBridge(["record-eval", "--root", root, "--slice", "slice-01", "--specimen", s,
        "--metrics", await metricsFile({ testPassRate: 0.4, coverage: 0.5, mutationScore: 0.1 })]);
      expect(lastJSON<{ passedGate: boolean }>().passedGate).toBe(false);
    }
    // gate confirms the empty field that triggers escalation.
    captured = "";
    await runBridge(["gate", "--root", root, "--slice", "slice-01"]);
    expect(lastJSON<{ passers: string[] }>().passers).toEqual([]);
  }

  it("advances retry → replan → halt across rounds and persists each step", async () => {
    await setupFailedField();

    // Round 1 → retry.
    captured = "";
    await runBridge(["escalate", "--root", root, "--slice", "slice-01"]);
    const r1 = lastJSON<{ action: string; round: number; retryCount: number; refinementPath: string }>();
    expect(r1.action).toBe("retry");
    expect(r1.round).toBe(1);
    expect(r1.retryCount).toBe(1);
    let state = await loadState(root, "slice-01");
    expect(state.escalation).toBe("grpo-retry");
    expect(state.retryCount).toBe(1);
    // PDR refinement context written for the next round's specimens (F9).
    expect(await readFile(join(root, STZ_DIR, "50-pressure/slice-01/refinement.md"), "utf8")).toMatch(/refinement/i);
    expect(await readFile(join(root, STZ_DIR, "50-pressure/slice-01/pressure.md"), "utf8")).toMatch(/specimen-/);

    // Round 2 → replan (retry budget spent). Planning re-opens.
    captured = "";
    await runBridge(["escalate", "--root", root, "--slice", "slice-01"]);
    const r2 = lastJSON<{ action: string; round: number; replanCount: number }>();
    expect(r2.action).toBe("replan");
    expect(r2.round).toBe(2);
    expect(r2.replanCount).toBe(1);
    state = await loadState(root, "slice-01");
    expect(state.escalation).toBe("replan");
    expect(state.phaseStatus.planning).toBe("running"); // command rewrites intent before re-spawn

    // Round 3 → halt (both budgets spent). Failure report + phase failed.
    captured = "";
    await runBridge(["escalate", "--root", root, "--slice", "slice-01"]);
    const r3 = lastJSON<{ action: string; round: number; failureReportPath: string }>();
    expect(r3.action).toBe("halt");
    expect(r3.round).toBe(3);
    expect(r3.failureReportPath).toMatch(/failure-report\.md$/);
    state = await loadState(root, "slice-01");
    expect(state.escalation).toBe("halted");
    expect(state.phaseStatus.judgment).toBe("failed");
    expect(state.failureReport).toMatch(/No specimen passed/);
    const report = await readFile(join(root, STZ_DIR, "40-slices/slice-01/failure-report.md"), "utf8");
    expect(report).toMatch(/3 round\(s\)/);
    expect(report).toMatch(/specimen-a/);
  });

  it("never exceeds the ceiling — a stray fourth call stays halted (fail-safe)", async () => {
    await setupFailedField();
    for (let i = 0; i < 3; i++) {
      captured = "";
      await runBridge(["escalate", "--root", root, "--slice", "slice-01"]);
    }
    // A double-call beyond the budget must not loop or reset — it halts again.
    captured = "";
    await runBridge(["escalate", "--root", root, "--slice", "slice-01"]);
    const extra = lastJSON<{ action: string; retryCount: number; replanCount: number }>();
    expect(extra.action).toBe("halt");
    expect(extra.retryCount).toBe(1);
    expect(extra.replanCount).toBe(1);
    const state = await loadState(root, "slice-01");
    expect(state.escalation).toBe("halted");
  });
});

// A tiny sealed harness: g(x) must be 0 for x<5, 1 otherwise; asserts g(5)===1.
const SEALED = `
import assert from "node:assert";
const mod = await import(process.argv[2]);
const g = mod.g;
let passed = 0, total = 0;
function check(c){ total++; try { assert.ok(c); passed++; } catch {} }
check(g(0) === 0); check(g(4) === 0); check(g(5) === 1); check(g(6) === 1);
const passRate = passed/total;
console.log(JSON.stringify({passed, total, passRate}));
process.exit(passRate === 1 ? 0 : 1);
`;

describe("seal-crosscheck — cross-family reference gate (0.5.0)", () => {
  async function setup(refBSrc: string): Promise<{ sealed: string; refA: string; refB: string }> {
    const sealed = join(root, "sealed.mjs");
    const refA = join(root, "refA.mjs");
    const refB = join(root, "refB.mjs");
    await writeFile(sealed, SEALED, "utf8");
    await writeFile(refA, "export function g(x){ return x < 5 ? 0 : 1; }\n", "utf8");
    await writeFile(refB, refBSrc, "utf8");
    return { sealed, refA, refB };
  }

  it("both-pass: passes (exit 0) and writes the audit doc", async () => {
    const { sealed, refA, refB } = await setup("export function g(x){ if (x < 5) return 0; return 1; }\n");
    const code = process.exitCode;
    captured = "";
    await runBridge(["seal-crosscheck", "--root", root, "--sealed", sealed, "--reference-a", refA, "--reference-b", refB]);
    expect(lastJSON<{ status: string; bothPass: boolean }>()).toMatchObject({ status: "both-pass", bothPass: true });
    expect(process.exitCode ?? 0).toBe(0); // green gate does not set a failure code
    const doc = await readFile(join(root, STZ_DIR, "30-tests/cross-reference.md"), "utf8");
    expect(doc).toMatch(/both-pass/);
    process.exitCode = code;
  });

  it("divergent: a reference disagreement sets exit 1 and records the signal", async () => {
    // refB keys the boundary one off (g(5) → 0) — the suite asserts g(5)===1.
    const { sealed, refA, refB } = await setup("export function g(x){ return x <= 5 ? 0 : 1; }\n");
    const code = process.exitCode;
    captured = "";
    await runBridge(["seal-crosscheck", "--root", root, "--sealed", sealed, "--reference-a", refA, "--reference-b", refB]);
    expect(lastJSON<{ status: string; divergent: boolean }>()).toMatchObject({ status: "divergent", divergent: true });
    expect(process.exitCode).toBe(1); // pauses the pipeline like seal-verify
    const doc = await readFile(join(root, STZ_DIR, "30-tests/cross-reference.md"), "utf8");
    expect(doc).toMatch(/DIVERGENT/);
    process.exitCode = code;
  });

  it("errors (exit 1) when a reference path is missing", async () => {
    const sealed = join(root, "sealed.mjs");
    await writeFile(sealed, SEALED, "utf8");
    const code = process.exitCode;
    captured = "";
    await runBridge(["seal-crosscheck", "--root", root, "--sealed", sealed, "--reference-a", join(root, "refA.mjs")]);
    expect(process.exitCode).toBe(1);
    process.exitCode = code;
  });
});

describe("bridge — calibrated-verifier gating (0.9.5)", () => {
  const relFile = () => join(root, STZ_DIR, "60-harness", "judge-reliability.json");

  it("judge-stress (consistency) and judge-calibration (bucket) merge into one entry", async () => {
    captured = "";
    await runBridge([
      "judge-stress", "--root", root, "--slice-type", "parser",
      "--pairs", JSON.stringify([{ original: "a", perturbed: "a" }, { original: "b", perturbed: "b" }]),
    ]);
    captured = "";
    await runBridge([
      "judge-calibration", "--root", root, "--slice-type", "parser",
      "--verdicts", JSON.stringify(["a", "b", "a", "b"]), "--labels", JSON.stringify(["a", "b", "a", "b"]),
    ]);
    const prof = JSON.parse(await readFile(relFile(), "utf8")) as {
      perSliceType: { sliceType: string; consistency: number; blindAccuracyBucket: string | null; n: number }[];
    };
    const e = prof.perSliceType.find((x) => x.sliceType === "parser")!;
    expect(e.consistency).toBeCloseTo(1, 9); // from judge-stress
    expect(e.blindAccuracyBucket).toBe("high"); // 100% accuracy from judge-calibration — not clobbered
  });

  it("harness-promote fails closed when the judge is uncalibrated, passes once calibrated", async () => {
    const genome = {
      heuristicId: "v", mutatorIds: [], strategySet: [], rubricId: "r",
      weights: { pass: 1, coverage: 0, kill: 0, codeHealth: 0, clean: 0 }, fanout: 4, votesPerPair: 8,
    };
    captured = "";
    await runBridge(["harness-fitness", "--root", root, "--genome", JSON.stringify(genome), "--scores", JSON.stringify({ cron: 0.9 })]);
    const variantId = lastJSON<{ variantId: string }>().variantId;

    // Uncalibrated (no profile yet) ⇒ fail-closed even with every other gate true.
    captured = "";
    await runBridge(["harness-promote", "--root", root, "--variant", variantId, "--slice-type", "parser", "--hack-clean", "true", "--seal-ok", "true", "--diversity-ok", "true"]);
    const before = lastJSON<{ promote: boolean; failed: string[] }>();
    expect(before.promote).toBe(false);
    expect(before.failed).toContain("judge-rubric-not-calibrated");

    // Calibrate the judge for this slice-type (consistency + blind accuracy).
    captured = "";
    await runBridge(["judge-stress", "--root", root, "--slice-type", "parser", "--pairs", JSON.stringify([{ original: "a", perturbed: "a" }, { original: "b", perturbed: "b" }])]);
    captured = "";
    await runBridge(["judge-calibration", "--root", root, "--slice-type", "parser", "--verdicts", JSON.stringify(["a", "b"]), "--labels", JSON.stringify(["a", "b"])]);

    // Now the same promotion call passes.
    captured = "";
    await runBridge(["harness-promote", "--root", root, "--variant", variantId, "--slice-type", "parser", "--hack-clean", "true", "--seal-ok", "true", "--diversity-ok", "true"]);
    const after = lastJSON<{ promote: boolean; failed: string[] }>();
    expect(after.promote).toBe(true);
  });
});
