export function weightedSample(items, weights, k) {
  // Handle edge cases
  if (k === 0) return [];
  if (items.length === 0) return [];
  if (k > items.length) k = items.length;

  // Create indices and remaining weights for tracking
  const indices = Array.from({ length: items.length }, (_, i) => i);
  const remainingWeights = [...weights];
  const result = [];

  for (let i = 0; i < k; i++) {
    // Calculate total of remaining weights
    let totalWeight = 0;
    for (let j = 0; j < remainingWeights.length; j++) {
      if (remainingWeights[j] > 0) {
        totalWeight += remainingWeights[j];
      }
    }

    if (totalWeight <= 0) break;

    // Generate random selection based on weights
    let random = Math.random() * totalWeight;
    let selectedPos = -1;

    for (let j = 0; j < remainingWeights.length; j++) {
      if (remainingWeights[j] > 0) {
        random -= remainingWeights[j];
        if (random < 0) {
          selectedPos = j;
          break;
        }
      }
    }

    if (selectedPos !== -1) {
      // Add selected item to result
      result.push(items[indices[selectedPos]]);

      // Remove selected item from consideration
      remainingWeights[selectedPos] = 0;
      indices.splice(selectedPos, 1);
      remainingWeights.splice(selectedPos, 1);
    }
  }

  return result;
}
