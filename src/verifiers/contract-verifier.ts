/**
 * STZ 0.9.6 — Contract verifier + contract-aware selection (PHASED-PLAN Phase 3).
 *
 * The funded delta made operational: the contract is the DEFINITION of winner,
 * not a post-hoc oracle. A candidate that passes the functional suite but fails a
 * high-severity predicate is hard-failed BEFORE test-weight tie-breaking — so an
 * accepted predicate can change which candidate wins. This is the exact signal
 * class STZ's proven negatives could not reach: it is not a reweighting of
 * sealed-derived proxies, it is a different object (typed-predicate satisfaction).
 *
 * Pure + deterministic — no LLM. Consumes predicate results (produced by the
 * pure evaluator) and execution-verifier pass rates (existing eval-runner).
 */
import type { PredicateResult } from "../contract/predicate-eval.js";

export interface ContractScore {
  candidateId: string;
  /** Fraction of predicates passed (0..1). */
  contractScore: number;
  /** True iff any HIGH-severity predicate failed → immediate elimination. */
  hardFail: boolean;
  hardFailReasons: string[];
  passedPredicates: number;
  totalPredicates: number;
}

/** Score one candidate against its predicate results. Pure. */
export function scoreContract(candidateId: string, results: PredicateResult[]): ContractScore {
  const highFails = results.filter((r) => !r.pass && r.severity === "high");
  const passed = results.filter((r) => r.pass).length;
  return {
    candidateId,
    contractScore: results.length === 0 ? 1 : passed / results.length,
    hardFail: highFails.length > 0,
    hardFailReasons: highFails.map((r) => r.predicateId),
    passedPredicates: passed,
    totalPredicates: results.length,
  };
}

/**
 * Build a `ContractGate` (selection.ts) from per-specimen predicate results. A
 * specimen with any high-severity predicate failure hard-fails the gate. Used to
 * wire the contract plane into the live `select()` flow behind the feature flag.
 */
export function contractGateFromResults(
  bySpecimen: Record<string, PredicateResult[]>,
): (specimen: string) => { hardFail: boolean; reasons: string[] } | null {
  return (specimen: string) => {
    const results = bySpecimen[specimen];
    if (!results) return null;
    const score = scoreContract(specimen, results);
    return { hardFail: score.hardFail, reasons: score.hardFailReasons };
  };
}

export interface RankableCandidate {
  candidateId: string;
  /** Execution verifier signal (existing eval-runner). */
  testPassRate: number;
  contract: ContractScore;
}

export interface RankOutcome {
  ranked: string[];
  eliminated: string[];
  winner: string | null;
}

/** Tests-only ranking (the STZ-proven baseline): by testPassRate, ties keep input order. */
export function testsOnlyRank(cands: RankableCandidate[]): RankOutcome {
  const ranked = cands
    .map((c, i) => ({ c, i }))
    .sort((a, b) => b.c.testPassRate - a.c.testPassRate || a.i - b.i)
    .map((x) => x.c.candidateId);
  return { ranked, eliminated: [], winner: ranked[0] ?? null };
}

/**
 * Contract-aware ranking (the funded delta): high-severity predicate failure
 * ELIMINATES a candidate first; survivors rank by (testPassRate, contractScore),
 * ties keep input order. The contract gates before test-weight tie-breaking.
 */
export function contractAwareRank(cands: RankableCandidate[]): RankOutcome {
  const survivors = cands.filter((c) => !c.contract.hardFail);
  const eliminated = cands.filter((c) => c.contract.hardFail).map((c) => c.candidateId);
  const ranked = survivors
    .map((c, i) => ({ c, i }))
    .sort(
      (a, b) =>
        b.c.testPassRate - a.c.testPassRate ||
        b.c.contract.contractScore - a.c.contract.contractScore ||
        a.i - b.i,
    )
    .map((x) => x.c.candidateId);
  return { ranked, eliminated, winner: ranked[0] ?? null };
}

/**
 * The Phase-3 earn measurement: does the contract CHANGE selection vs tests-only?
 * Returns whether the winner differs, which is the exit-gate evidence that an
 * accepted predicate catches a passing-but-non-conforming candidate (one that
 * satisfies the functional suite but violates an architectural/contract predicate).
 */
export function contractChangesSelection(cands: RankableCandidate[]): {
  changed: boolean;
  testsOnlyWinner: string | null;
  contractAwareWinner: string | null;
  reason: string;
} {
  const testsOnly = testsOnlyRank(cands);
  const contractAware = contractAwareRank(cands);
  const changed = testsOnly.winner !== contractAware.winner;
  return {
    changed,
    testsOnlyWinner: testsOnly.winner,
    contractAwareWinner: contractAware.winner,
    reason: changed
      ? `Contract changed the winner: tests-only picked '${testsOnly.winner}' (passes the suite) ` +
        `but it hard-failed a high-severity predicate; contract-aware picked '${contractAware.winner}'.`
      : `Contract did not change the winner ('${testsOnly.winner}') — no separation at selection on this set.`,
  };
}
