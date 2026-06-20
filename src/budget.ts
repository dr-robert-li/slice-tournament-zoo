/**
 * Adaptive complexity-based budgeting (F15, N5).
 *
 * Elicitation emits a complexity score 1..5 per slice. The orchestrator
 * allocates token + wall-clock budget from a project pool against complexity.
 * Actuals feed back into a calibration table so future estimates improve.
 */
import type { Budget } from "./types.js";

export interface BudgetConfig {
  /** Project-level token pool to draw from. */
  poolTokens: number;
  /** Base tokens for a complexity-1 slice. */
  baseTokens: number;
  /** Multiplier applied per complexity step above 1. */
  perComplexity: number;
  /** Base wall-clock per slice (ms). Default 30 min (N4). */
  baseWallClockMs: number;
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  poolTokens: 5_000_000,
  baseTokens: 200_000,
  perComplexity: 1.6,
  baseWallClockMs: 30 * 60_000,
};

export function clampComplexity(c: number): number {
  if (Number.isNaN(c)) return 1;
  return Math.max(1, Math.min(5, Math.round(c)));
}

/**
 * Allocate a per-slice budget. Token cap grows geometrically with complexity
 * but is never allowed to exceed the remaining pool.
 */
export function allocateBudget(
  complexity: number,
  poolRemaining: number,
  cfg: BudgetConfig = DEFAULT_BUDGET_CONFIG,
): Budget {
  const c = clampComplexity(complexity);
  const raw = Math.round(cfg.baseTokens * cfg.perComplexity ** (c - 1));
  const tokenCap = Math.min(raw, Math.max(0, poolRemaining));
  return {
    tokenCap,
    wallClockMs: cfg.baseWallClockMs * (1 + 0.5 * (c - 1)),
    tokensSpent: 0,
  };
}

/** A calibration table entry: estimated vs actual token spend at a complexity. */
export interface CalibrationEntry {
  complexity: number;
  estimated: number;
  actual: number;
}

/**
 * Update the per-complexity calibration multiplier from observed actuals.
 * Returns a corrected `perComplexity`-style scalar centred on observed ratios.
 * Simple mean-of-ratios estimator (transparent, auditable).
 */
export function calibrate(entries: CalibrationEntry[], cfg = DEFAULT_BUDGET_CONFIG): BudgetConfig {
  if (entries.length === 0) return cfg;
  const ratios = entries
    .filter((e) => e.estimated > 0)
    .map((e) => e.actual / e.estimated);
  if (ratios.length === 0) return cfg;
  const meanRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  // Nudge baseTokens by the observed ratio so next estimates track actuals.
  return { ...cfg, baseTokens: Math.round(cfg.baseTokens * meanRatio) };
}

/** True if spending `add` more tokens would breach the slice cap (N5 hard cap). */
export function wouldExceed(budget: Budget, add: number): boolean {
  return budget.tokensSpent + add > budget.tokenCap;
}
