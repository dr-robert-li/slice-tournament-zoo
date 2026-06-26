export function weightedSample(items, weights, k) {
  if (k === 0) {
    return [];
  }

  // Create array of (item, weight, key) tuples with computed keys
  // Using Algorithm A-Res: key = u^(1/w) where u ~ Uniform(0,1)
  const candidates = items.map((item, index) => {
    const u = Math.random();
    const weight = weights[index];
    // key = u^(1/weight), but we compute log(u) / weight to avoid precision issues
    // Actually, simpler: key = Math.pow(u, 1 / weight)
    const key = Math.pow(u, 1 / weight);
    return { item, key, index };
  });

  // Sort by key descending (largest keys first)
  candidates.sort((a, b) => b.key - a.key);

  // Take the top k items
  const result = candidates.slice(0, k).map(c => c.item);

  return result;
}
