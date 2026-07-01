/**
 * STZ 0.9.6 — the separation gate (PHASED-PLAN §1 & Phase 1 go/no-go).
 *
 * The load-bearing safeguard. Before the contract layer is built out, confirm a
 * naive-but-plausible implementation PASSES the functional sealed suite but
 * FAILS ≥1 contract predicate. If no such separation exists on the substrate,
 * the contract signal is redundant with the suite and the whole line stops —
 * the cheapest possible insurance against reproducing STZ's earned negative at
 * 10× cost (docs/PAPER.md symmetric-error rule).
 *
 * Pure: consumes a suite verdict + predicate results, decides separation.
 */
import type { PredicateResult } from "./predicate-eval.js";

export interface SeparationInput {
  /** Did the naive impl pass the functional sealed suite? (Must be true to separate.) */
  sealedSuitePassed: boolean;
  /** Predicate results for the SAME naive impl. */
  predicateResults: PredicateResult[];
}

export interface SeparationVerdict {
  /** True iff suite passes AND at least one predicate fails. */
  separated: boolean;
  /** Ids of predicates the naive impl failed (the separating signal). */
  failingPredicates: string[];
  /** High-severity failures carry the strongest separation evidence. */
  highSeverityFailures: string[];
  reason: string;
}

/**
 * Decide whether the contract layer carries a signal the sealed suite does not.
 * PASS (separated=true) → build the kernel. FAIL → freeze at Phase 0, report.
 */
export function separationGate(input: SeparationInput): SeparationVerdict {
  const failing = input.predicateResults.filter((r) => !r.pass);
  const failingPredicates = failing.map((r) => r.predicateId);
  const highSeverityFailures = failing.filter((r) => r.severity === "high").map((r) => r.predicateId);

  if (!input.sealedSuitePassed) {
    return {
      separated: false,
      failingPredicates,
      highSeverityFailures,
      reason:
        "Naive impl did NOT pass the sealed suite — the functional suite already " +
        "rejects it, so no separation is demonstrated (the suite carries the signal).",
    };
  }
  if (failing.length === 0) {
    return {
      separated: false,
      failingPredicates: [],
      highSeverityFailures: [],
      reason:
        "Naive impl passed the sealed suite AND every predicate — the contract " +
        "adds no selection signal beyond the suite on this substrate. STOP: freeze " +
        "at Phase 0 and report the negative (symmetric-error rule).",
    };
  }
  return {
    separated: true,
    failingPredicates,
    highSeverityFailures,
    reason:
      `Separation CONFIRMED: naive impl passed the sealed suite but failed ` +
      `${failing.length} predicate(s) [${failingPredicates.join(", ")}]. The contract ` +
      `carries a signal the suite does not — Phase 1 kernel build is earned.`,
  };
}
