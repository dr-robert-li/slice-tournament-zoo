/**
 * STZ 0.9.6 — reviewer outcome capture (PHASED-PLAN Phase 0).
 *
 * The exogenous SDLC signal that later phases are measured against: how a human
 * reviewer dispositioned each produced patch. Deliberately small; captured now
 * so a baseline exists before any adaptive behaviour is added.
 */
export type ReviewVerdict = "accepted" | "accepted-with-edits" | "rejected";

export interface ReviewerOutcome {
  issueId: string;
  verdict: ReviewVerdict;
  /** Present iff verdict === "rejected". */
  rejectionReason?: string;
}

export interface OutcomeRates {
  total: number;
  acceptanceRate: number; // accepted / total
  acceptedWithEditsRate: number; // accepted-with-edits / total
  rejectionRate: number; // rejected / total
}

/** Summarize a set of reviewer outcomes into rates. Pure. */
export function summarizeOutcomes(outcomes: ReviewerOutcome[]): OutcomeRates {
  const total = outcomes.length;
  if (total === 0) {
    return { total: 0, acceptanceRate: 0, acceptedWithEditsRate: 0, rejectionRate: 0 };
  }
  const count = (v: ReviewVerdict) => outcomes.filter((o) => o.verdict === v).length;
  return {
    total,
    acceptanceRate: count("accepted") / total,
    acceptedWithEditsRate: count("accepted-with-edits") / total,
    rejectionRate: count("rejected") / total,
  };
}
