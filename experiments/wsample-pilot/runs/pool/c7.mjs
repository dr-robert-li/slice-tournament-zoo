export function weightedSample(items, weights, k) {
  if (k === 0) return [];
  if (k > items.length) k = items.length;

  // Use exponential variates method: key = log(random()) / weight
  // Items with highest keys are selected (equivalent to weighted sampling)
  const candidates = items.map((item, i) => ({
    item,
    key: Math.log(Math.random()) / weights[i]
  }));

  // Sort by key descending and take top k
  candidates.sort((a, b) => b.key - a.key);

  return candidates.slice(0, k).map(c => c.item);
}
