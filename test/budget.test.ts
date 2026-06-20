import { describe, it, expect } from "vitest";
import {
  allocateBudget,
  clampComplexity,
  calibrate,
  wouldExceed,
  DEFAULT_BUDGET_CONFIG,
} from "../src/budget.js";

describe("F15 adaptive complexity-based budgeting", () => {
  it("clamps complexity to [1,5]", () => {
    expect(clampComplexity(0)).toBe(1);
    expect(clampComplexity(9)).toBe(5);
    expect(clampComplexity(3.4)).toBe(3);
    expect(clampComplexity(NaN)).toBe(1);
  });

  it("token cap grows monotonically with complexity", () => {
    const caps = [1, 2, 3, 4, 5].map((c) => allocateBudget(c, 1e9).tokenCap);
    for (let i = 1; i < caps.length; i++) {
      expect(caps[i]!).toBeGreaterThan(caps[i - 1]!);
    }
  });

  it("never allocates more than the remaining pool (N5 hard cap)", () => {
    const b = allocateBudget(5, 50_000);
    expect(b.tokenCap).toBeLessThanOrEqual(50_000);
  });

  it("wall-clock scales with complexity, base 30 min at c=1", () => {
    expect(allocateBudget(1, 1e9).wallClockMs).toBe(30 * 60_000);
    expect(allocateBudget(5, 1e9).wallClockMs).toBeGreaterThan(30 * 60_000);
  });

  it("calibrate nudges baseTokens toward observed actuals", () => {
    const cfg = calibrate(
      [
        { complexity: 1, estimated: 100, actual: 200 },
        { complexity: 1, estimated: 100, actual: 200 },
      ],
      DEFAULT_BUDGET_CONFIG,
    );
    expect(cfg.baseTokens).toBe(DEFAULT_BUDGET_CONFIG.baseTokens * 2);
  });

  it("wouldExceed detects breach of the cap", () => {
    const b = allocateBudget(1, 1e9); // cap = 200_000
    expect(wouldExceed({ ...b, tokensSpent: 199_000 }, 2_000)).toBe(true);
    expect(wouldExceed({ ...b, tokensSpent: 100_000 }, 2_000)).toBe(false);
  });
});
