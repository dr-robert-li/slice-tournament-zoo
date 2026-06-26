// Reference CORRECT impl — Efraimidis–Spirakis weighted sampling without replacement.
// key_i = U_i^(1/w_i), take the k largest keys. This yields exactly
// P(first = i) = w_i / Σw and P(i before j) = w_i/(w_i+w_j). Single pass over items,
// no renormalization loop needed. Used ONLY for the separation gate. NEVER shown to
// specimens.
export function weightedSample(items, weights, k) {
  const keyed = items.map((it, i) => ({ it, key: Math.pow(Math.random(), 1 / weights[i]) }));
  keyed.sort((a, b) => b.key - a.key);
  return keyed.slice(0, k).map((x) => x.it);
}
