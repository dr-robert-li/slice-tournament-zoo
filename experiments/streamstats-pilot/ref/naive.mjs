// Reference GOOD-FAITH-NAIVE impl — the textbook single-pass "sum of squares"
// formula: var = E[x^2] - E[x]^2. It satisfies the contract literally (one pass,
// O(1) memory) and is correct to full precision on well-conditioned data, but
// suffers catastrophic cancellation when the mean is large relative to the spread.
// This is the natural mistake the contract's "single pass, O(1)" constraint tempts.
// Used ONLY for the substrate-separation gate. NEVER shown to specimens.
export function streamStats(numbers) {
  let n = 0;
  let sum = 0;
  let sumSq = 0;
  for (const x of numbers) {
    n += 1;
    sum += x;
    sumSq += x * x;
  }
  if (n === 0) return { n: 0, mean: 0, variance: 0 };
  const mean = sum / n;
  const variance = sumSq / n - mean * mean;
  return { n, mean, variance };
}
