import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSlice, BudgetExceededError } from "../src/mock/orchestrator.js";
import { MockModelLayer, defaultMockConfig, alwaysFailConfig } from "../src/mock/mock.js";
import { loadState } from "../src/state.js";
import { PHASES, type SliceManifest } from "../src/types.js";
import { STZ_DIR } from "../src/taxonomy.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-orch-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

const manifest: SliceManifest = {
  id: "slice-01",
  name: "demo-slice",
  contract: "export function run(input: Request): Result",
  donePredicates: [{ id: "schema", expr: "returns_schema(Result)", kind: "schema" }],
  traceTier: "minimal",
  complexity: 2,
  dependsOn: [],
  judge: { votesPerPair: 8 },
  summary: "demo",
};

const exists = (rel: string) => existsSync(join(root, STZ_DIR, rel));

describe("F1 full pipeline — success path (e2e against mock model layer)", () => {
  it("runs all 8 phases, selects a winner, materializes the audit trail", async () => {
    const model = new MockModelLayer(defaultMockConfig());
    const result = await runSlice({ root, manifest, model, n: 4 });

    expect(result.halted).toBe(false);
    expect(result.winner).toBe("a"); // highest-quality profile
    expect(result.rounds).toBe(1);
    expect(result.faithful).toBe(true);

    // F7: winner is a gate passer; ranking excludes the hacky/failed specimen d.
    expect(result.judgment!.ranking).not.toContain("d");
    // F8/F9: GRPO advantage spans the whole specimen group (4), incl. the
    // gate-eliminated hacker `d`, so losers' diffs can be weighted by |advantage|.
    expect(result.judgment!.advantages.map((a) => a.specimen).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("every phase ends 'done' and state.json is checkpointed", async () => {
    const model = new MockModelLayer(defaultMockConfig());
    await runSlice({ root, manifest, model, n: 4 });
    const state = await loadState(root, "slice-01");
    for (const p of PHASES) expect(state.phaseStatus[p]).toBe("done");
  });

  it("materializes the full audit tree (N1)", async () => {
    const model = new MockModelLayer(defaultMockConfig());
    await runSlice({ root, manifest, model, n: 4 });
    expect(exists("00-intent/questionnaire.md")).toBe(true);
    expect(exists("30-tests/held-out/contract.spec.ts")).toBe(true);
    expect(exists("40-slices/slice-01/plan.md")).toBe(true);
    expect(exists("40-slices/slice-01/tournament.md")).toBe(true);
    expect(exists("40-slices/slice-01/spec-diff.md")).toBe(true);
    expect(exists("40-slices/slice-01/prototypes/specimen-a")).toBe(true);
    expect(exists("50-pressure/slice-01/pressure.md")).toBe(true);
    expect(exists("90-audit/calls/slice-01.jsonl")).toBe(true);
    expect(exists("90-audit/cost.md")).toBe(true);
    expect(exists("90-audit/journal.md")).toBe(true);
  });

  it("N5: total spend stays within the per-slice budget cap", async () => {
    const model = new MockModelLayer(defaultMockConfig());
    await runSlice({ root, manifest, model, n: 4 });
    const state = await loadState(root, "slice-01");
    expect(state.budget.tokensSpent).toBeLessThanOrEqual(state.budget.tokenCap);
    expect(state.callCount).toBeGreaterThan(0);
  });

  it("N5/R3: a tiny token pool trips the hard cap kill-switch (enforced, not just tracked)", async () => {
    const model = new MockModelLayer(defaultMockConfig());
    // poolRemaining caps the per-slice budget below what the pipeline needs.
    await expect(
      runSlice({ root, manifest, model, n: 4, poolRemaining: 3_000 }),
    ).rejects.toBeInstanceOf(BudgetExceededError);
  });

  it("F7: V=8 votes recorded per pair in the ledger", async () => {
    const model = new MockModelLayer(defaultMockConfig());
    await runSlice({ root, manifest, model, n: 4 });
    const jsonl = await readFile(join(root, STZ_DIR, "90-audit/calls/slice-01.jsonl"), "utf8");
    const judgeCalls = jsonl.split("\n").filter((l) => l.includes('"role":"judge"'));
    // 3 passers (a,b,c) → 3 pairs × 8 votes = 24 judge calls.
    expect(judgeCalls.length).toBe(24);
  });

  it("N6 determinism: identical config → identical winner + ranking", async () => {
    const r1 = await runSlice({ root, manifest, model: new MockModelLayer(defaultMockConfig()), n: 4 });
    const root2 = await mkdtemp(join(tmpdir(), "stz-orch2-"));
    const r2 = await runSlice({ root: root2, manifest, model: new MockModelLayer(defaultMockConfig()), n: 4 });
    expect(r1.winner).toBe(r2.winner);
    expect(r1.judgment!.ranking).toEqual(r2.judgment!.ranking);
    await rm(root2, { recursive: true, force: true });
  });
});

describe("F14 failure path — bounded escalation to halt", () => {
  it("no passers → retry → replan → halt with structured failure report", async () => {
    const model = new MockModelLayer(alwaysFailConfig());
    const result = await runSlice({ root, manifest: { ...manifest, complexity: 5 }, model, n: 4 });

    expect(result.halted).toBe(true);
    expect(result.winner).toBeNull();
    // exactly 3 rounds: initial + retry + replan, then halt.
    expect(result.rounds).toBe(3);

    const state = await loadState(root, "slice-01");
    expect(state.escalation).toBe("halted");
    expect(state.retryCount).toBe(1);
    expect(state.replanCount).toBe(1);
    expect(state.failureReport).toMatch(/Halted after 3 round/);
    expect(exists("40-slices/slice-01/failure-report.md")).toBe(true);
  });

  it("escalation events appear in the replayable journal", async () => {
    const model = new MockModelLayer(alwaysFailConfig());
    await runSlice({ root, manifest, model, n: 4 });
    const journal = await readFile(join(root, STZ_DIR, "90-audit/journal.md"), "utf8");
    expect(journal).toMatch(/escalation-retry/);
    expect(journal).toMatch(/escalation-replan/);
    expect(journal).toMatch(/escalation-halt/);
  });
});

describe("F10 anti-hacking integration — a hacky specimen never wins", () => {
  it("disqualifies the test-skipping specimen via the gate", async () => {
    const model = new MockModelLayer(defaultMockConfig());
    const result = await runSlice({ root, manifest, model, n: 4 });
    // specimen d injects an it.skip → detected → eliminated → in pressure log.
    expect(result.winner).not.toBe("d");
    const pressure = await readFile(join(root, STZ_DIR, "50-pressure/slice-01/pressure.md"), "utf8");
    expect(pressure).toMatch(/specimen-d/);
    expect(pressure).toMatch(/test-skip/);
  });
});
