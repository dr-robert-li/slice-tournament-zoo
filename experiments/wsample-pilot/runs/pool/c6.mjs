export function weightedSample(items, weights, k) {
  if (k === 0) {
    return [];
  }

  const result = [];
  const remaining = items.map((item, i) => ({ item, weight: weights[i], originalIndex: i }));

  for (let i = 0; i < k && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, entry) => sum + entry.weight, 0);
    let random = Math.random() * totalWeight;

    let selectedIndex = 0;
    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].weight;
      if (random < 0) {
        selectedIndex = j;
        break;
      }
    }

    result.push(remaining[selectedIndex].item);
    remaining.splice(selectedIndex, 1);
  }

  return result;
}
