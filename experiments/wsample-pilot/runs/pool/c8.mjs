export function weightedSample(items, weights, k) {
  if (k === 0) {
    return [];
  }

  const n = items.length;
  if (k > n) {
    k = n;
  }

  // Create indices and compute keys using Exponential Variates method
  // For each item, compute key = log(random()) / weight
  // Then select the k items with the largest keys
  const keys = new Array(n);
  for (let i = 0; i < n; i++) {
    keys[i] = Math.log(Math.random()) / weights[i];
  }

  // Create array of indices sorted by key (descending)
  const indices = new Array(n);
  for (let i = 0; i < n; i++) {
    indices[i] = i;
  }

  indices.sort((a, b) => keys[b] - keys[a]);

  // Select the top k items
  const result = new Array(k);
  for (let i = 0; i < k; i++) {
    result[i] = items[indices[i]];
  }

  return result;
}
