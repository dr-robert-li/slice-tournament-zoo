export function weightedSample(items, weights, k) {
  // Handle edge case: k is 0
  if (k === 0) {
    return [];
  }

  // Create mutable copies to avoid mutating inputs
  const remainingItems = items.slice();
  const remainingWeights = weights.slice();

  const result = [];

  for (let i = 0; i < k; i++) {
    // Calculate total weight of remaining items
    const totalWeight = remainingWeights.reduce((sum, w) => sum + w, 0);

    // Generate random number in [0, totalWeight)
    const randomValue = Math.random() * totalWeight;

    // Find the item to select
    let cumulativeWeight = 0;
    let selectedIndex = -1;

    for (let j = 0; j < remainingWeights.length; j++) {
      cumulativeWeight += remainingWeights[j];
      if (randomValue < cumulativeWeight) {
        selectedIndex = j;
        break;
      }
    }

    // Add selected item to result
    result.push(remainingItems[selectedIndex]);

    // Remove selected item and its weight from remaining arrays
    remainingItems.splice(selectedIndex, 1);
    remainingWeights.splice(selectedIndex, 1);
  }

  return result;
}
