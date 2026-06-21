// clamp: bound x into the inclusive range [lo, hi].
// Strategy: explicit conditional branches.
// Precondition: lo <= hi (as stated in the contract).
export function clamp(x, lo, hi) {
  if (x < lo) {
    return lo;
  }
  if (x > hi) {
    return hi;
  }
  return x;
}
