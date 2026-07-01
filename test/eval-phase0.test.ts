/**
 * Tests for the STZ 0.9.6 Phase-0 measurement plane: chronological splits (no
 * shuffle), reviewer-outcome rates, and baseline RepoMetrics.
 */
import { describe, it, expect } from "vitest";
import {
  assignSplits,
  splitSizes,
  DEFAULT_SPLIT,
} from "../src/eval/chronological-stream.js";
import { summarizeOutcomes, type ReviewerOutcome } from "../src/eval/reviewer-outcome.js";
import { computeRepoMetrics, type IssueRecord } from "../src/eval/baseline-report.js";

describe("chronological-stream — contiguous, order-preserving, deterministic", () => {
  const issues = Array.from({ length: 20 }, (_, i) => `issue-${String(i).padStart(2, "0")}`);

  it("assigns contiguous splits in chronological order (never shuffles)", () => {
    const a = assignSplits(issues, DEFAULT_SPLIT);
    // input order preserved exactly: index i maps to issues[i]
    a.forEach((x, i) => expect(x.issueId).toBe(issues[i]));
    // contiguous: trainingLike is a prefix, finalReportHoldout is a suffix
    const splits = a.map((x) => x.split);
    const firstPromo = splits.indexOf("promotionHoldout");
    const firstFinal = splits.indexOf("finalReportHoldout");
    expect(firstPromo).toBeGreaterThan(0);
    expect(firstFinal).toBeGreaterThan(firstPromo);
    // no trainingLike appears after a holdout began (no interleaving)
    expect(splits.slice(firstPromo).includes("trainingLike")).toBe(false);
  });

  it("is deterministic — same input yields identical splits", () => {
    expect(assignSplits(issues)).toEqual(assignSplits(issues));
  });

  it("partitions every issue exactly once", () => {
    const sizes = splitSizes(assignSplits(issues));
    expect(sizes.trainingLike + sizes.promotionHoldout + sizes.finalReportHoldout).toBe(20);
    expect(sizes.trainingLike).toBe(12); // floor(20*0.6)
    expect(sizes.promotionHoldout).toBe(5); // floor(20*0.25)
    expect(sizes.finalReportHoldout).toBe(3); // remainder
  });
});

describe("reviewer-outcome rates", () => {
  it("computes acceptance / edits / rejection rates", () => {
    const outcomes: ReviewerOutcome[] = [
      { issueId: "a", verdict: "accepted" },
      { issueId: "b", verdict: "accepted" },
      { issueId: "c", verdict: "accepted-with-edits" },
      { issueId: "d", verdict: "rejected", rejectionReason: "wrong problem" },
    ];
    const r = summarizeOutcomes(outcomes);
    expect(r.acceptanceRate).toBe(0.5);
    expect(r.acceptedWithEditsRate).toBe(0.25);
    expect(r.rejectionRate).toBe(0.25);
  });

  it("is zero-safe on an empty set", () => {
    expect(summarizeOutcomes([]).acceptanceRate).toBe(0);
  });
});

describe("baseline RepoMetrics", () => {
  const records: IssueRecord[] = [
    { issueId: "a", outcome: { issueId: "a", verdict: "accepted" }, resolved: true, regressed: false, timeToFirstCorrectPatchS: 100, cost: 10 },
    { issueId: "b", outcome: { issueId: "b", verdict: "accepted-with-edits" }, resolved: true, regressed: true, timeToFirstCorrectPatchS: 200, cost: 20 },
    { issueId: "c", outcome: { issueId: "c", verdict: "rejected", rejectionReason: "x" }, resolved: false, regressed: false, timeToFirstCorrectPatchS: 0, cost: 30 },
  ];

  it("amortises cost over resolved issues and computes rates", () => {
    const m = computeRepoMetrics("repo-x", "stz-stateful", records);
    expect(m.issueResolutionRate).toBeCloseTo(2 / 3);
    expect(m.regressionFreeSuccessRate).toBeCloseTo(1 / 3); // only 'a' resolved & clean
    expect(m.costPerResolvedIssue).toBe((10 + 20 + 30) / 2); // total cost / resolved count
    expect(m.meanTimeToFirstCorrectPatchS).toBe(150); // mean over resolved (100,200)
    expect(m.humanAcceptanceRate).toBeCloseTo(1 / 3);
  });

  it("is zero-safe with no records", () => {
    const m = computeRepoMetrics("repo-x", "stz-stateless", []);
    expect(m.issueResolutionRate).toBe(0);
    expect(m.costPerResolvedIssue).toBe(0);
  });
});
