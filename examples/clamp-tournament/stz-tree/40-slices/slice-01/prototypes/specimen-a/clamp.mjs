/**
 * Bound `x` into the inclusive range [lo, hi].
 *
 * Strategy: min-max composition. Lifting the value to at least `lo`
 * (Math.max) and capping it to at most `hi` (Math.min) yields a value
 * in [lo, hi] for any `x`, given the precondition lo <= hi.
 *
 * @param {number} x  - value to clamp
 * @param {number} lo - lower bound (inclusive)
 * @param {number} hi - upper bound (inclusive); assumed lo <= hi
 * @returns {number} x bounded into [lo, hi]
 */
export function clamp(x, lo, hi) {
  return Math.min(Math.max(x, lo), hi);
}
