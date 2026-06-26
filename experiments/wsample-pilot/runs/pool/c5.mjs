export function weightedSample(items, weights, k) {
  if (k === 0) return [];
  if (k > items.length) throw new Error('k cannot exceed items.length');
  if (items.length === 0) return [];
  if (items.length !== weights.length) throw new Error('items and weights must have equal length');

  // Create mutable copies to avoid mutating inputs
  const remainingItems = items.slice();
  const remainingWeights = weights.slice();
  const result = [];

  for (let i = 0; i < k; i++) {
    // Calculate total weight of remaining items
    let totalWeight = 0;
    for (let j = 0; j < remainingWeights.length; j++) {
      totalWeight += remainingWeights[j];
    }

    // Draw a random threshold
    const threshold = Math.random() * totalWeight;

    // Find which item crosses the threshold
    let cumulativeWeight = 0;
    let selectedIndex = -1;
    for (let j = 0; j < remainingWeights.length; j++) {
      cumulativeWeight += remainingWeights[j];
      if (cumulativeWeight >= threshold) {
        selectedIndex = j;
        break;
      }
    }

    // Handle floating point edge case where no item is selected
    if (selectedIndex === -1) {
      selectedIndex = remainingWeights.length - 1;
    }

    // Add selected item to result
    result.push(remainingItems[selectedIndex]);

    // Remove selected item and weight from remaining
    remainingItems.splice(selectedIndex, 1);
    remainingWeights.splice(selectedIndex, 1);
  }

  return result;
}
