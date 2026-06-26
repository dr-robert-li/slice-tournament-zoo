// INCUMBENT sealed suite (genome `baseline-v0`, heuristicId = "explicit-examples-v0").
// A GOOD-FAITH, competent fixed-example suite: exactly what a careful author writes
// for streamStats WITHOUT anticipating the large-offset/tiny-spread cancellation case.
// It includes a "large numbers" case — but at the magnitude a reasonable author picks
// (thousands), where the naive sum-of-squares formula is still accurate. It is NOT a
// strawman: it pins n, mean, population variance, empty/singleton edges, negatives,
// and floats. It just cannot SEE the magnitude axis (the whole point of the arm).
//
// Harness contract: node fixed_suite.mjs <impl-path>
// Prints one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.

let passed = 0, total = 0;
function close(got, exp, tol = 1e-6) {
  if (typeof got !== "number" || !Number.isFinite(got)) return false;
  if (Math.abs(exp) < 1e-9) return Math.abs(got) <= 1e-6;
  return Math.abs(got - exp) / Math.abs(exp) <= tol;
}
function check(cond) { total += 1; try { if (cond === true) passed += 1; } catch { /* throw = fail */ } }

// population variance via a plain two-pass over a SMALL, well-conditioned literal
// array — what an author computes by hand / in their head for an example.
function popVar(a) {
  const m = a.reduce((s, x) => s + x, 0) / a.length;
  return a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length;
}

async function main() {
  const implPath = process.argv[2];
  let f;
  try { f = (await import(implPath)).streamStats; } catch { f = undefined; }
  if (typeof f !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
  }
  const cases = [
    [],
    [42],
    [1, 2, 3, 4, 5],
    [2, 4, 4, 4, 5, 5, 7, 9],          // textbook: mean 5, variance 4
    [-3, -1, 0, 1, 3],
    [1.5, 2.5, 3.5],
    [10, 10, 10, 10],                   // zero variance
    [100, 200, 300, 400, 500],
    [1000, 1010, 1020, 1030, 1040],     // "large" — but well-conditioned (mean/σ ≈ 70)
    [-1000000, 1000000],                // big magnitude, big spread → naive still fine
  ];
  for (const c of cases) {
    let r; try { r = f(c.slice()); } catch { r = null; }
    if (r === null) { check(false); check(false); check(false); continue; }
    check(r.n === c.length);
    const m = c.length ? c.reduce((s, x) => s + x, 0) / c.length : 0;
    check(close(r.mean, m));
    check(close(r.variance, c.length ? popVar(c) : 0));
  }
  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
