// Reference GOOD-FAITH-NAIVE impl — the tempting "weight times random, take the top"
// heuristic. It is a legitimate-looking single pass that gets the gross behaviour right
// (heavier items selected more) but the WRONG distribution: P(first=i) is not w_i/Σw and
// P(i before j) is not w_i/(w_i+w_j). This is the natural mistake a blind implementer
// makes when not recalling the Efraimidis–Spirakis exponential-key scheme.
// Used ONLY for the separation gate. NEVER shown to specimens.
export function weightedSample(items, weights, k) {
  const keyed = items.map((it, i) => ({ it, key: weights[i] * Math.random() }));
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, k).map((x) => x.it);
}
