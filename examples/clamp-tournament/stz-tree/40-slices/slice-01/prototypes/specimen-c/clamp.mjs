/**
 * Bound `x` into the inclusive range [lo, hi].
 *
 * Strategy: single nested ternary expression.
 * Assumes lo <= hi (per contract).
 *
 * If x is below lo, return lo; if x is above hi, return hi;
 * otherwise x is already within range, so return x unchanged.
 *
 * @param {number} x  - value to clamp
 * @param {number} lo - inclusive lower bound
 * @param {number} hi - inclusive upper bound
 * @returns {number} x bounded into [lo, hi]
 */
export function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}
