export function shuffle(arr) {
  // Create a copy to avoid mutating the input
  const result = arr.slice();

  // Fisher-Yates shuffle algorithm (linear time: O(n))
  for (let i = result.length - 1; i > 0; i--) {
    // Random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));
    // Swap result[i] and result[j]
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
