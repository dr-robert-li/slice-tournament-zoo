import { describe, it, expect } from "vitest";
import { CostTracker } from "../src/cost-tracker.js";
import { renderPressureLog, refinementContext, PDR_K } from "../src/pressure.js";
import { groupRelativeAdvantage } from "../src/grpo.js";
import type { CulledSpecimen } from "../src/pressure.js";

describe("N5/N6 cost tracker (call ledger)", () => {
  it("assigns monotonic seq and totals tokens", () => {
    const t = new CostTracker();
    t.record({ id: "1", phase: "tournament", role: "specimen", model: "m", temperature: 0, seed: 0, promptTokens: 100, completionTokens: 50 });
    t.record({ id: "2", phase: "judgment", role: "judge", model: "m", temperature: 0, seed: 0, promptTokens: 200, completionTokens: 100 });
    expect(t.all().map((r) => r.seq)).toEqual([0, 1]);
    expect(t.totalTokens()).toBe(450);
    expect(t.tokensForPhase("judgment")).toBe(300);
  });

  it("JSONL round-trips for replay (N6)", () => {
    const t = new CostTracker();
    t.record({ id: "1", phase: "planning", role: "planner", model: "m", temperature: 0, seed: 1, promptTokens: 10, completionTokens: 5 });
    const restored = CostTracker.fromJSONL(t.toJSONL());
    expect(restored.totalTokens()).toBe(15);
    expect(restored.count()).toBe(1);
    // next record continues the seq, not collide
    const rec = restored.record({ id: "2", phase: "planning", role: "planner", model: "m", temperature: 0, seed: 1, promptTokens: 1, completionTokens: 1 });
    expect(rec.seq).toBe(1);
  });
});

describe("F9 pressure log + PDR refinement context", () => {
  const culled: CulledSpecimen[] = [
    { specimen: "d", reason: "hack: test-skip", diff: "+++ x\nit.skip()", critique: "", hackFindings: [{ specimen: "d", pattern: "test-skip", location: "x:1", remediation: "do not skip tests" }] },
    { specimen: "c", reason: "gate testPassRate=0.50", diff: "+++ y\ncode", critique: "weak", hackFindings: [] },
  ];

  it("renders culled specimens with reasons and diffs", () => {
    const md = renderPressureLog({ sliceId: "slice-01", culled });
    expect(md).toMatch(/specimen-d/);
    expect(md).toMatch(/hack findings/);
    expect(md).toMatch(/```diff/);
  });

  it("refinementContext picks top-K by |advantage| and carries remediations", () => {
    const adv = groupRelativeAdvantage([
      { specimen: "d", reward: 0.1 },
      { specimen: "c", reward: 0.5 },
    ]);
    const ctx = refinementContext({ sliceId: "slice-01", culled }, adv, PDR_K);
    expect(ctx).toMatch(/negative exemplars/);
    expect(ctx).toMatch(/do not skip tests/);
  });
});
