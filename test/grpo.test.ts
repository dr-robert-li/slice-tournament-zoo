import { describe, it, expect } from "vitest";
import { groupRelativeAdvantage, mean, stddev, mostInformative, GRPO_EPSILON } from "../src/grpo.js";

describe("F8 GRPO group-relative advantage", () => {
  it("computes (reward - mean) / (std + eps)", () => {
    const adv = groupRelativeAdvantage([
      { specimen: "a", reward: 1 },
      { specimen: "b", reward: 2 },
      { specimen: "c", reward: 3 },
    ]);
    const mu = 2;
    const sigma = Math.sqrt((1 + 0 + 1) / 3);
    expect(adv[0]!.advantage).toBeCloseTo((1 - mu) / (sigma + GRPO_EPSILON), 9);
    expect(adv[2]!.advantage).toBeCloseTo((3 - mu) / (sigma + GRPO_EPSILON), 9);
  });

  it("sums advantages to ~0 (mean-centered)", () => {
    const adv = groupRelativeAdvantage([
      { specimen: "a", reward: 0.4 },
      { specimen: "b", reward: 0.9 },
      { specimen: "c", reward: 0.2 },
      { specimen: "d", reward: 0.7 },
    ]);
    const total = adv.reduce((s, a) => s + a.advantage, 0);
    expect(total).toBeCloseTo(0, 9);
  });

  it("all-equal rewards → std=0 → all-zero advantages (eps guard, no NaN)", () => {
    const adv = groupRelativeAdvantage([
      { specimen: "a", reward: 0.5 },
      { specimen: "b", reward: 0.5 },
    ]);
    for (const a of adv) {
      expect(a.advantage).toBe(0);
      expect(Number.isNaN(a.advantage)).toBe(false);
    }
  });

  it("ranks most-informative by |advantage|", () => {
    const adv = groupRelativeAdvantage([
      { specimen: "a", reward: 0 },
      { specimen: "b", reward: 1 },
      { specimen: "c", reward: 0.5 },
    ]);
    const order = mostInformative(adv);
    // extremes (a,b) before the middle (c)
    expect(order[2]).toBe("c");
  });

  it("mean/stddev helpers handle empty input", () => {
    expect(mean([])).toBe(0);
    expect(stddev([])).toBe(0);
  });
});
