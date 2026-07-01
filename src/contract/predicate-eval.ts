/**
 * STZ 0.9.6 — pure predicate evaluator (PHASED-PLAN Phase 1/3, cheap subset).
 *
 * PURE by design: given a predicate and a map of already-observed check values
 * (`observed[checkId] = actualString`), decide pass/fail. The IO shell (the
 * separation-gate experiment runner, or a bridge command) is responsible for
 * producing observations by executing the candidate impl — this keeps the core
 * deterministic and unit-testable, mirroring the repo's "deterministic core, IO
 * at the edges" philosophy (N6).
 */
import type { Predicate, PredicateCheck } from "./contract-types.js";

export interface CheckResult {
  checkId: string;
  pass: boolean;
  expected: string;
  actual: string;
  description: string;
}

export interface PredicateResult {
  predicateId: string;
  severity: Predicate["severity"];
  /** A predicate passes iff every one of its checks passes. */
  pass: boolean;
  checks: CheckResult[];
  /** True when at least one check had no observation supplied (vacuous). */
  vacuous: boolean;
}

/** Observations keyed by `checkId` → the actual string the impl produced. */
export type Observations = Record<string, string | undefined>;

function evalCheck(check: PredicateCheck, observed: Observations): CheckResult {
  const actual = observed[check.checkId];
  // A missing observation is a fail, not a silent pass — a predicate that cannot
  // be evaluated must never be counted as satisfied (spec-vacuity guard).
  const pass = actual !== undefined && actual === check.expect;
  return {
    checkId: check.checkId,
    pass,
    expected: check.expect,
    actual: actual ?? "<no-observation>",
    description: check.description,
  };
}

/** Evaluate one predicate against observations. Pure. */
export function evaluatePredicate(pred: Predicate, observed: Observations): PredicateResult {
  const checks = pred.checks.map((c) => evalCheck(c, observed));
  const vacuous = pred.checks.some((c) => observed[c.checkId] === undefined);
  return {
    predicateId: pred.id,
    severity: pred.severity,
    pass: checks.length > 0 && checks.every((c) => c.pass),
    checks,
    vacuous,
  };
}

/** Evaluate a set of predicates against one observation map. Pure. */
export function evaluatePredicates(preds: Predicate[], observed: Observations): PredicateResult[] {
  return preds.map((p) => evaluatePredicate(p, observed));
}
