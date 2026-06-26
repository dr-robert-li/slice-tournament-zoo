export function streamStats(numbers) {
  let n = 0;
  let mean = 0;
  let M2 = 0; // Sum of squared differences from mean

  for (const num of numbers) {
    n++;
    const delta = num - mean;
    mean += delta / n;
    const delta2 = num - mean;
    M2 += delta * delta2;
  }

  const variance = n > 0 ? M2 / n : 0;

  return {
    n,
    mean,
    variance
  };
}
