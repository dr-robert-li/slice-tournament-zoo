/**
 * GRPO group-relative advantage (F8).
 *
 *   advantage_i = (reward_i − group_mean) / (group_std + ε)
 *
 * Adopted at the harness selection layer (DeepSeekMath / verl formulation).
 * Used both to pick the winner and to weight which losers' diffs are the most
 * informative forward signal for the pressure log (F9).
 */
import type { Advantage, SpecimenId } from "./types.js";

export const GRPO_EPSILON = 1e-8;

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Population standard deviation (divide by N, matching the GRPO group stat). */
export function stddev(xs: number[], mu = mean(xs)): number {
  if (xs.length === 0) return 0;
  const variance = xs.reduce((a, x) => a + (x - mu) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}

/**
 * Compute group-relative advantages across a slice's specimen group.
 * The ε guard means an all-equal-rewards group yields all-zero advantages
 * (no division by zero), which is the correct "no signal" outcome.
 */
export function groupRelativeAdvantage(
  rewards: { specimen: SpecimenId; reward: number }[],
  epsilon = GRPO_EPSILON,
): Advantage[] {
  const values = rewards.map((r) => r.reward);
  const mu = mean(values);
  const sigma = stddev(values, mu);
  return rewards.map(({ specimen, reward }) => ({
    specimen,
    reward,
    advantage: (reward - mu) / (sigma + epsilon),
  }));
}

/**
 * Rank specimens whose diffs are most informative as negative exemplars (F9):
 * the largest-magnitude advantages carry the most signal. Returns specimen ids
 * sorted by |advantage| descending.
 */
export function mostInformative(advantages: Advantage[]): SpecimenId[] {
  return [...advantages]
    .sort((x, y) => Math.abs(y.advantage) - Math.abs(x.advantage))
    .map((a) => a.specimen);
}
