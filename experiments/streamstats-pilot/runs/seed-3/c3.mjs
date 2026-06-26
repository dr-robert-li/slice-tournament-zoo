export function streamStats(numbers) {
  let n = 0;
  let mean = 0;
  let m2 = 0; // sum of squared differences from mean (for variance)

  for (const x of numbers) {
    n++;
    const delta = x - mean;
    mean += delta / n;
    const delta2 = x - mean;
    m2 += delta * delta2;
  }

  const variance = n > 0 ? m2 / n : 0;

  return {
    n,
    mean,
    variance
  };
}
