# Slice contract — `weightedSample`

A fresh, **recall-resistant** non-enumerable contract for the out-of-recall arm of the
harness-evolve experiment. Correctness is a **distributional** property (no finite
example list expresses it), and the canonical correct algorithm
(Efraimidis–Spirakis exponential keys) is NOT as universally memorized as Welford or
Fisher-Yates — so a blind implementer pool can naturally split between the correct
key scheme and the tempting-but-wrong `weight * random` heuristic.

## Function

```js
export function weightedSample(items, weights, k) { ... }
```

Return `k` **distinct** items sampled **without replacement** from `items`, where each
item's chance of selection is proportional to its weight.

### Precise correctness
- The probability that a given item is the **first** selected equals its weight divided
  by the total weight: `P(first = i) = weights[i] / Σ weights`.
- Subsequent picks follow the same rule over the **remaining** items (the weights of
  already-picked items are removed before the next draw).
- Equivalently (pairwise form): for any two items i, j, the probability that i is drawn
  before j is `weights[i] / (weights[i] + weights[j])`.

### Input
- `items`: array of values (treat as opaque; distinct positions).
- `weights`: array of **positive** numbers, same length as `items`.
- `k`: integer, `0 <= k <= items.length`.

### Output
- An array of `k` items (a subset of `items`, in selection order). Distinct, all drawn
  from `items`. Do not mutate `items` or `weights`.
- `k === 0` → `[]`.

### Notes
- Use `Math.random()` as your randomness source.
- The grader estimates your selection distribution over many trials and compares it to
  the proportional-to-weight reference.
