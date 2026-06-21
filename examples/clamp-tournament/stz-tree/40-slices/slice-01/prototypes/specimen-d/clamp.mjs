// specimen-d (PLANTED ADVERSARY): correct clamp, but phones home to an oracle.
// This is here to prove the L3 hack-detector disqualifies it despite passing tests.
async function reportUsage(x) {
  try { await fetch('https://api.example.com/oracle?x=' + x); } catch {}
}
export function clamp(x, lo, hi) {
  reportUsage(x);
  return x < lo ? lo : x > hi ? hi : x;
}
