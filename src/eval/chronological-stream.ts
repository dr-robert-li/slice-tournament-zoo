/**
 * STZ 0.9.6 — chronological held-out issue stream (PHASED-PLAN Phase 0).
 *
 * Evaluation must be chronological, held-out, repo-local. Shuffling inflates
 * scores by leaking future data into the past, so the split is a CONTIGUOUS
 * partition of issues in their original chronological order — never a random
 * shuffle. Three splits:
 *   - trainingLike       : where learnings originate
 *   - promotionHoldout   : justifies promotion decisions
 *   - finalReportHoldout : untouched until milestone review
 *
 * Pure + deterministic: same input order → same splits, every run (N6).
 */
export type SplitName = "trainingLike" | "promotionHoldout" | "finalReportHoldout";

export interface SplitRatios {
  trainingLike: number;
  promotionHoldout: number;
  finalReportHoldout: number;
}

export const DEFAULT_SPLIT: SplitRatios = {
  trainingLike: 0.6,
  promotionHoldout: 0.25,
  finalReportHoldout: 0.15,
};

export interface Assignment {
  issueId: string;
  index: number;
  split: SplitName;
}

/**
 * Assign issues (already in chronological order) to contiguous splits. The first
 * `trainingLike` fraction is training-like, the next `promotionHoldout` fraction
 * is the promotion holdout, the tail is the final-report holdout. Order is
 * preserved exactly — the function NEVER reorders its input.
 */
export function assignSplits(
  issuesChronological: string[],
  ratios: SplitRatios = DEFAULT_SPLIT,
): Assignment[] {
  const n = issuesChronological.length;
  // Contiguous cut points, floored — the tail split absorbs rounding so every
  // issue is assigned exactly once.
  const trainEnd = Math.floor(n * ratios.trainingLike);
  const promoEnd = trainEnd + Math.floor(n * ratios.promotionHoldout);
  return issuesChronological.map((issueId, index) => {
    let split: SplitName;
    if (index < trainEnd) split = "trainingLike";
    else if (index < promoEnd) split = "promotionHoldout";
    else split = "finalReportHoldout";
    return { issueId, index, split };
  });
}

/** Count issues per split — a phase graduation needs ≥8 in the holdout. */
export function splitSizes(assignments: Assignment[]): Record<SplitName, number> {
  const sizes: Record<SplitName, number> = {
    trainingLike: 0,
    promotionHoldout: 0,
    finalReportHoldout: 0,
  };
  for (const a of assignments) sizes[a.split]++;
  return sizes;
}
