// Reference CORRECT impl — Welford's online algorithm. Single pass, O(1) memory,
// numerically stable. Used ONLY for the substrate-separation gate (it must pass
// fixed + property + truth). NEVER shown to specimens.
export function streamStats(numbers) {
  let n = 0;
  let mean = 0;
  let m2 = 0;
  for (const x of numbers) {
    n += 1;
    const delta = x - mean;
    mean += delta / n;
    m2 += delta * (x - mean);
  }
  if (n === 0) return { n: 0, mean: 0, variance: 0 };
  return { n, mean, variance: m2 / n };
}
