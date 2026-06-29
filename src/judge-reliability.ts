/**
 * Judge/selection reliability layer (0.9.0).
 *
 * The literature is blunt: LLM judges miss ~1 in 5 failures (arXiv:2606.10315),
 * reliability varies by task-type (IRT, arXiv:2602.00521), and — critically —
 * adding more judges AMPLIFIES bias rather than reducing it (arXiv:2505.19477).
 * This repo's own cron pilot saw a real order-effect (CONTROLS-2: the c-vs-g
 * pair split by presentation order). So the sanctioned design is NOT an
 * ensemble: it is ONE robust judge, stress-tested for consistency, with the
 * sealed/truth divergence (`eval-runner.ts crossReference`) as the independent
 * backstop.
 *
 * This module is the deterministic measurement spine. Re-running the judge under
 * perturbation is the agent layer's job; here we score the paired verdicts and
 * gate trust per slice-type. Pure (N6).
 */

/**
 * EXPLICIT STANDING RULE (encoded so it cannot be quietly forgotten): do NOT add
 * a naive multi-judge majority vote. More judges amplify shared bias
 * (arXiv:2505.19477). The only sanctioned redundancy is one judge run both
 * orders (the consistency check below) + the cross-family reference backstop.
 */
export const NAIVE_ENSEMBLE_FORBIDDEN = true;

/** One pairwise judgment run twice under a perturbation (order/verbosity swap). */
export interface PerturbedJudgment {
  /** Winner the judge picked on the original presentation. */
  original: string;
  /** Winner the judge picked after the perturbation (same semantic pair). */
  perturbed: string;
}

export interface ConsistencyResult {
  total: number;
  invariant: number;
  /** Fraction of judgments whose winner is unchanged under perturbation. */
  score: number;
}

/**
 * Consistency = fraction of judgments whose verdict is invariant under the
 * perturbation. A reliable judge returns the same winner when A/B order or
 * non-semantic verbosity is swapped. Needs NO ground-truth labels — it is a pure
 * self-consistency CI check, grounded in the real cron order-effect.
 */
export function consistencyScore(pairs: PerturbedJudgment[]): ConsistencyResult {
  const total = pairs.length;
  if (total === 0) return { total: 0, invariant: 0, score: 1 };
  const invariant = pairs.filter((p) => p.original === p.perturbed).length;
  return { total, invariant, score: invariant / total };
}

export type ReliabilityBucket = "high" | "medium" | "low";

export function bucketOf(score: number): ReliabilityBucket {
  if (score >= 0.9) return "high";
  if (score >= 0.7) return "medium";
  return "low";
}

/** Per-slice-type reliability profile (IRT-style: reliability is task-dependent). */
export interface SliceTypeReliability {
  sliceType: string;
  consistency: number;
  /** Accuracy bucket from a BLIND, pre-registered conformance battery (not the
   *  judge's own cited bugs — that would be circular; left null until authored). */
  blindAccuracyBucket: ReliabilityBucket | null;
  n: number;
}

export interface JudgeReliabilityProfile {
  schemaVersion: 1;
  perSliceType: SliceTypeReliability[];
}

export const TRUST_THRESHOLD = 0.7;

/**
 * Whether the judge is trusted for a given slice-type. If consistency is below
 * threshold OR the blind-battery accuracy bucket is "low", the orchestrator must
 * down-weight the judge for that slice-type and lean on the sealed/truth
 * divergence backstop. A slice-type with no profile defaults to trusted (the
 * judge is the current selector) but flags that a profile is missing.
 */
export function trustGate(
  profile: JudgeReliabilityProfile,
  sliceType: string,
  threshold = TRUST_THRESHOLD,
): { trust: boolean; reason: string } {
  const entry = profile.perSliceType.find((e) => e.sliceType === sliceType);
  if (!entry) return { trust: true, reason: "no-profile-yet (default trust; profile pending)" };
  if (entry.consistency < threshold) {
    return { trust: false, reason: `consistency ${entry.consistency.toFixed(2)} < ${threshold} — lean on sealed/truth backstop` };
  }
  if (entry.blindAccuracyBucket === "low") {
    return { trust: false, reason: "blind-battery accuracy low — lean on sealed/truth backstop" };
  }
  return { trust: true, reason: `consistency ${entry.consistency.toFixed(2)} ≥ ${threshold}` };
}

/**
 * Promotion-gate calibration check (FAIL-CLOSED). This is the 0.9.5 calibrated-
 * verifier gate: a judge/verifier may steer harness PROMOTION only after its
 * target-task accuracy has been measured on a blind, pre-registered ground-truth
 * battery. It is deliberately stricter than `trustGate`:
 *
 *   - `trustGate` is the per-slice RUNTIME gate. It default-*trusts* a missing
 *     profile so the live pipeline is never blocked by a not-yet-profiled judge.
 *   - `calibrationGate` is the PROMOTION gate. It default-*distrusts* a missing
 *     or un-calibrated profile, because letting an uncalibrated judge steer the
 *     harness is exactly the failure 2606.14629 ("When Good Verifiers Go Bad")
 *     names: a confident-but-wrong verifier silently regresses the result, and
 *     above-threshold-on-A can be sub-threshold-on-B. Calibrate BEFORE it steers.
 *
 * Calibrated ⇔ a profile entry exists for the slice-type AND its blind-accuracy
 * battery actually ran (`blindAccuracyBucket !== null`) AND `trustGate` passes
 * (consistency ≥ threshold AND bucket not "low"). Pure (N6).
 */
export function calibrationGate(
  profile: JudgeReliabilityProfile,
  sliceType: string,
  threshold = TRUST_THRESHOLD,
): { calibrated: boolean; reason: string } {
  const entry = profile.perSliceType.find((e) => e.sliceType === sliceType);
  if (!entry) {
    return { calibrated: false, reason: "no-profile — an uncalibrated judge may not steer promotion (fail-closed)" };
  }
  if (entry.blindAccuracyBucket === null) {
    return { calibrated: false, reason: "blind-accuracy battery not run — calibration pending (fail-closed)" };
  }
  const t = trustGate(profile, sliceType, threshold);
  if (!t.trust) return { calibrated: false, reason: t.reason };
  return { calibrated: true, reason: `calibrated — ${t.reason}; blind-accuracy ${entry.blindAccuracyBucket}` };
}
