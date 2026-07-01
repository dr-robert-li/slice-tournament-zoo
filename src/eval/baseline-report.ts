/**
 * STZ 0.9.6 — baseline metrics report (PHASED-PLAN Phase 0).
 *
 * Computes per-repo RepoMetrics for the baseline conditions (STZ stateless, STZ
 * stateful 0.9.5, human-assisted) so "better SWE outcomes" is measurable BEFORE
 * any self-improvement is claimed. Per-repo, never global (bounded persistence,
 * not assumed transfer). Pure + deterministic.
 */
import { summarizeOutcomes, type ReviewerOutcome } from "./reviewer-outcome.js";

export type BaselineCondition = "stz-stateless" | "stz-stateful" | "human-assisted";

/** One resolved-issue record feeding the metrics. */
export interface IssueRecord {
  issueId: string;
  outcome: ReviewerOutcome;
  /** Did the produced patch resolve the issue on the sealed/truth suite? */
  resolved: boolean;
  /** Did it introduce a regression on the held-out set? */
  regressed: boolean;
  /** Seconds to first correct patch (0 if unresolved). */
  timeToFirstCorrectPatchS: number;
  /** Token/tool cost for this issue. */
  cost: number;
}

export interface RepoMetrics {
  repo: string;
  condition: BaselineCondition;
  sampleSize: number;
  issueResolutionRate: number;
  regressionFreeSuccessRate: number;
  humanAcceptanceRate: number;
  acceptedWithEditsRate: number;
  meanTimeToFirstCorrectPatchS: number;
  costPerResolvedIssue: number;
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Compute RepoMetrics for one condition. Pure. */
export function computeRepoMetrics(
  repo: string,
  condition: BaselineCondition,
  records: IssueRecord[],
): RepoMetrics {
  const n = records.length;
  const resolved = records.filter((r) => r.resolved);
  const regressionFree = records.filter((r) => r.resolved && !r.regressed);
  const rates = summarizeOutcomes(records.map((r) => r.outcome));
  const totalCost = records.reduce((a, r) => a + r.cost, 0);

  return {
    repo,
    condition,
    sampleSize: n,
    issueResolutionRate: n === 0 ? 0 : resolved.length / n,
    regressionFreeSuccessRate: n === 0 ? 0 : regressionFree.length / n,
    humanAcceptanceRate: rates.acceptanceRate,
    acceptedWithEditsRate: rates.acceptedWithEditsRate,
    meanTimeToFirstCorrectPatchS: mean(resolved.map((r) => r.timeToFirstCorrectPatchS)),
    // Cost is amortised over RESOLVED issues — the denominator that matters.
    costPerResolvedIssue: resolved.length === 0 ? 0 : totalCost / resolved.length,
  };
}

/** Build the full baseline report across all three conditions. */
export function baselineReport(
  repo: string,
  byCondition: Record<BaselineCondition, IssueRecord[]>,
): RepoMetrics[] {
  return (Object.keys(byCondition) as BaselineCondition[]).map((c) =>
    computeRepoMetrics(repo, c, byCondition[c]),
  );
}
