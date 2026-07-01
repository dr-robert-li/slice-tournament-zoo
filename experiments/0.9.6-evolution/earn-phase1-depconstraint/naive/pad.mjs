// Naive candidate impl of padLeft. Behaviourally CORRECT — passes every
// good-faith functional test below. But it "pulled in" a new dependency
// (declared in naive/package.json) to do a job the stdlib already does. No
// functional test can express "you added a dependency" — that is the point.
export function padLeft(s, n, fill = " ") {
  s = String(s);
  if (s.length >= n) return s;
  return fill.repeat(n - s.length) + s; // stdlib; the dep is gratuitous bloat
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , s, n] = process.argv;
  process.stdout.write(padLeft(s ?? "", Number(n)));
}
