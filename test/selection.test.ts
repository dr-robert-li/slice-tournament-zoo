import { describe, it, expect } from "vitest";
import {
  evalGate,
  tallyVotes,
  rankByVotes,
  select,
  pairings,
  evalReward,
} from "../src/selection.js";
import type { EvalResult, PairwiseVote } from "../src/types.js";

function mk(specimen: string, over: Partial<EvalResult> = {}): EvalResult {
  return {
    specimen,
    passedGate: true,
    testPassRate: 1,
    coverage: 1,
    mutationScore: 0,
    hackFindings: [],
    ...over,
  };
}

describe("F7 stage 1 — eval gate", () => {
  it("eliminates gate failures", () => {
    const { passers, eliminated } = evalGate([
      mk("a"),
      mk("b", { passedGate: false, testPassRate: 0.3 }),
    ]);
    expect(passers).toEqual(["a"]);
    expect(eliminated[0]!.reason).toMatch(/gate-fail/);
  });

  it("disqualifies on any hack finding (F10/L3 integration)", () => {
    const { passers, eliminated } = evalGate([
      mk("a"),
      mk("b", {
        hackFindings: [
          { specimen: "b", pattern: "test-skip", location: "x:1", remediation: "" },
        ],
      }),
    ]);
    expect(passers).toEqual(["a"]);
    expect(eliminated[0]!.reason).toMatch(/hack-pattern: test-skip/);
  });
});

describe("F7 stage 2 — pairwise win-count ranking", () => {
  it("tallies votes into win counts", () => {
    const votes: PairwiseVote[] = [
      { a: "a", b: "b", winner: "a" },
      { a: "a", b: "b", winner: "a" },
      { a: "a", b: "b", winner: "b" },
    ];
    const wins = tallyVotes(votes);
    expect(wins.get("a")).toBe(2);
    expect(wins.get("b")).toBe(1);
  });

  it("ranks by win count, breaks ties by reward then id (deterministic)", () => {
    const votes: PairwiseVote[] = [
      { a: "a", b: "b", winner: "a" },
      { a: "a", b: "c", winner: "a" },
      { a: "b", b: "c", winner: "b" },
    ];
    const reward = (s: string) => ({ a: 0.9, b: 0.5, c: 0.5 })[s] ?? 0;
    expect(rankByVotes(["a", "b", "c"], votes, reward)).toEqual(["a", "b", "c"]);
  });

  it("pure tie (no votes, equal reward) falls back to lexicographic id", () => {
    expect(rankByVotes(["b", "a"], [], () => 0.5)).toEqual(["a", "b"]);
  });
});

describe("F7+F8 select() end-to-end", () => {
  it("picks the strongest passer as winner and reports GRPO advantages", () => {
    const results = [
      mk("a", { coverage: 0.95, mutationScore: 0.1 }),
      mk("b", { coverage: 0.8, mutationScore: 0.3 }),
      mk("c", { passedGate: false, testPassRate: 0.2 }),
    ];
    const votes: PairwiseVote[] = [
      { a: "a", b: "b", winner: "a" },
      { a: "a", b: "b", winner: "a" },
    ];
    const { judgment } = select(results, votes);
    expect(judgment.winner).toBe("a");
    expect(judgment.ranking).toEqual(["a", "b"]); // c eliminated from ranking
    // advantage spans the whole group (incl. eliminated c) per F8/F9
    expect(judgment.advantages.map((a) => a.specimen).sort()).toEqual(["a", "b", "c"]);
  });

  it("no passers → null winner, empty ranking", () => {
    const { judgment } = select([mk("a", { passedGate: false })], []);
    expect(judgment.winner).toBeNull();
    expect(judgment.ranking).toEqual([]);
  });
});

describe("pairings + evalReward", () => {
  it("generates round-robin pairs deterministically (i<j)", () => {
    expect(pairings(["a", "b", "c"])).toEqual([
      ["a", "b"],
      ["a", "c"],
      ["b", "c"],
    ]);
  });

  it("multi-objective reward is bounded [0,1]; perfect → 1, fully-bad → 0", () => {
    // A perfect specimen with default (absent) codeHealth(→1)/suspicion(→0) still
    // scores exactly 1.0 — the weights sum to 1.
    const r = evalReward(mk("a", { testPassRate: 1, coverage: 1, mutationScore: 0 }));
    expect(r).toBeCloseTo(1, 9);
    // Fully-bad on every axis (incl. codeHealth 0 and max suspicion) → 0.
    const low = evalReward(mk("a", { testPassRate: 0, coverage: 0, mutationScore: 1, codeHealth: 0, suspicion: 1 }));
    expect(low).toBeCloseTo(0, 9);
  });

  it("code-health and cleanliness terms move the reward (0.9.0)", () => {
    // With correctness/coverage/kill all zero, the neutral floor is the
    // codeHealth(0.10) + clean(0.05) contribution = 0.15.
    const floor = evalReward(mk("a", { testPassRate: 0, coverage: 0, mutationScore: 1 }));
    expect(floor).toBeCloseTo(0.15, 9);
    // Soft-suspicion erodes the clean term; low codeHealth erodes its term.
    const suspicious = evalReward(mk("a", { testPassRate: 1, coverage: 1, mutationScore: 0, suspicion: 1 }));
    expect(suspicious).toBeCloseTo(0.95, 9);
    const unhealthy = evalReward(mk("a", { testPassRate: 1, coverage: 1, mutationScore: 0, codeHealth: 0 }));
    expect(unhealthy).toBeCloseTo(0.9, 9);
  });
});
