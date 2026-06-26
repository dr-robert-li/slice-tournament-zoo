export function streamStats(numbers) {
  let n = 0;
  let mean = 0;
  let M2 = 0; // sum of squared differences from mean

  for (const x of numbers) {
    n += 1;
    const delta = x - mean;
    mean += delta / n;
    const delta2 = x - mean;
    M2 += delta * delta2;
  }

  const variance = n > 0 ? M2 / n : 0;

  return {
    n,
    mean,
    variance
  };
}
