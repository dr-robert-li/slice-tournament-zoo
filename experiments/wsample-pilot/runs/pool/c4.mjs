export function weightedSample(items, weights, k) {
  if (k === 0) {
    return [];
  }

  // Create arrays of indices and remaining weights to track selections
  const remaining = Array.from({ length: items.length }, (_, i) => i);
  const remainingWeights = [...weights];
  const result = [];

  for (let i = 0; i < k; i++) {
    // Calculate total weight of remaining items
    let totalWeight = 0;
    for (let j = 0; j < remaining.length; j++) {
      totalWeight += remainingWeights[j];
    }

    // Generate random value proportional to total weight
    let randomValue = Math.random() * totalWeight;

    // Find which item to select based on cumulative weights
    let selectedPos = 0;
    let cumulative = 0;
    for (let j = 0; j < remaining.length; j++) {
      cumulative += remainingWeights[j];
      if (randomValue <= cumulative) {
        selectedPos = j;
        break;
      }
    }

    // Add the selected item to result
    result.push(items[remaining[selectedPos]]);

    // Remove the selected item from remaining arrays
    remaining.splice(selectedPos, 1);
    remainingWeights.splice(selectedPos, 1);
  }

  return result;
}
