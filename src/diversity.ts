/**
 * Variance-collapse guard for the harness meta-loop (0.9.0).
 *
 * GRPO's documented failure mode (DeepSeekMath; RC-GRPO arXiv:2602.03025): when
 * every member of a group scores alike, the group stddev → 0, advantages vanish,
 * and the relative signal carries no information. At the harness altitude this is
 * a generation of variants that are effectively identical — promoting the
 * "winner" of such a generation is a coin-flip dressed as a decision.
 *
 * This module is the gate that refuses such a generation. It is the BUILD the
 * shelved 0.8.0 `diversityFloor` only ever named in prose; it reuses `grpo.ts`'s
 * `stddev` so the diversity stat and the advantage stat are the same number.
 * Pure and deterministic (N6).
 */
import { stddev } from "./grpo.js";

export interface DiversityCheck {
  /** Group fitness standard deviation. */
  sigma: number;
  floor: number;
  /** True ⇒ the generation carries enough spread to rank meaningfully. */
  ok: boolean;
}

/**
 * Check a generation's fitness spread against the floor. `ok:false` means the
 * generation collapsed (RC-GRPO σ→0) and must be re-sampled with forced gene
 * diversity, not ranked.
 */
export function checkDiversity(fitness: number[], floor: number): DiversityCheck {
  const sigma = stddev(fitness);
  return { sigma, floor, ok: sigma >= floor };
}

/**
 * AceGRPO-style learnability-frontier substrate weights (arXiv:2602.07906).
 * A substrate the incumbent already aces (fitness → 1) or wholly fails
 * (fitness → 0) contributes no gradient; the learnable signal lives in the
 * mid-band. Weight each substrate by `4·f·(1−f)` (peaks at f=0.5, zero at the
 * extremes), normalized to sum to 1. An all-extreme set falls back to uniform so
 * fitness is always defined.
 */
export function frontierWeights(incumbentPerSubstrate: number[]): number[] {
  const raw = incumbentPerSubstrate.map((f) => 4 * f * (1 - f));
  const total = raw.reduce((a, b) => a + b, 0);
  if (total <= 0) return incumbentPerSubstrate.map(() => 1 / Math.max(1, incumbentPerSubstrate.length));
  return raw.map((r) => r / total);
}

/** Weighted mean of per-substrate scores under frontier weights. */
export function weightedFitness(perSubstrate: number[], weights: number[]): number {
  if (perSubstrate.length === 0) return 0;
  if (weights.length !== perSubstrate.length) {
    return perSubstrate.reduce((a, b) => a + b, 0) / perSubstrate.length;
  }
  return perSubstrate.reduce((acc, s, i) => acc + s * weights[i]!, 0);
}
