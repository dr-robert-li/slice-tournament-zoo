# Slice contract — `streamStats`

A fresh, unprobed contract for the harness-evolve arm. Recall-light (custom shape),
and its correctness is **magnitude-dependent** — the kind of gradient the §7 boundary
predicts a *broader test heuristic* can cross where a good-faith fixed-example suite
plausibly cannot.

## Function

```js
export function streamStats(numbers) { ... }
```

Compute summary statistics over a sequence of real numbers in a **single forward
pass** using **O(1) auxiliary memory** (you may not retain the input — assume it
arrives as a stream and you see each value once).

### Input
- `numbers`: an array of finite JS numbers (treat it as a one-pass iterator; do not
  sort, re-read, or buffer it).

### Output — an object
- `n`: the count of values seen (integer).
- `mean`: the arithmetic mean.
- `variance`: the **population** variance (divide by `n`, not `n-1`).

### Requirements
- Single pass, O(1) extra memory (no second pass over `numbers`, no growing buffers).
- Results must be accurate to a **relative tolerance of 1e-6** on `variance` and
  `mean` for any input the spec admits.
- `n === 0` → `{ n: 0, mean: 0, variance: 0 }`.
- `n === 1` → `variance` is `0`.

### Notes
- Inputs are finite but otherwise unconstrained in magnitude and spread.
- The grader compares your `variance`/`mean` against a high-precision reference.
