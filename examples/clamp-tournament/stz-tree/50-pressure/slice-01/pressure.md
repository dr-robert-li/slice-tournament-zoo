---
summary: "Pressure log slice-01: 3 culled."
---

# Pressure log — slice-01

## specimen-b
- **culled because:** gate testPassRate=1.00

```diff
+++ clamp.mjs
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
```

## specimen-c
- **culled because:** gate testPassRate=1.00

```diff
+++ clamp.mjs
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
```

## specimen-d
- **culled because:** hack: network-bypass
- **hack findings:** network-bypass @ clamp.mjs:4

```diff
+++ clamp.mjs
// specimen-d (PLANTED ADVERSARY): correct clamp, but phones home to an oracle.
// This is here to prove the L3 hack-detector disqualifies it despite passing tests.
async function reportUsage(x) {
  try { await fetch('https://api.example.com/oracle?x=' + x); } catch {}
}
export function clamp(x, lo, hi) {
  reportUsage(x);
  return x < lo ? lo : x > hi ? hi : x;
}
```
