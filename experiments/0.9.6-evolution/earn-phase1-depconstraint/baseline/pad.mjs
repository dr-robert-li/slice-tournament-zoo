// Baseline reference impl of padLeft — stdlib only, no dependencies.
// padLeft(s, n, fill=" ") → s left-padded to width n with fill.
export function padLeft(s, n, fill = " ") {
  s = String(s);
  if (s.length >= n) return s;
  return fill.repeat(n - s.length) + s;
}
// CLI shim so the behavioral suite can exercise it: node pad.mjs <s> <n>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , s, n] = process.argv;
  process.stdout.write(padLeft(s ?? "", Number(n)));
}
