// HELD-OUT TRUTH oracle for `streamStats`. Grades frozen winners only; never a
// selection signal, seen by NO genome's author. Independent mechanism + seed from
// every selection suite:
//   - mechanism: ABSOLUTE comparison to a float64 two-pass reference (the impl is
//     constrained to single-pass; the oracle is not, so two-pass is the ground truth).
//   - seed: SEED_T  (≠ property_suite's SEED_P).
//   - distribution: log-uniform magnitude OFFSETS in [1, 1e8] crossed with gaussian
//     spreads — a different shape from the property suite's power-of-ten ladder.
// It mixes well-conditioned AND ill-conditioned cases, so a correct impl scores 1.0
// and a cancellation-prone impl scores partial (graded fitness, not pass/fail).
//
// Harness contract: node truth.mjs <impl-path>
// Prints one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.

const SEED_T = 0x7a1c0ffe; // truth oracle's own seed — NOT the property seed.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(SEED_T);
function gauss() { // Box–Muller from the seeded stream
  const u = Math.max(1e-12, rng()), v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// float64 two-pass reference (ground truth; not single-pass-constrained).
function refStats(a) {
  const n = a.length;
  if (n === 0) return { n: 0, mean: 0, variance: 0 };
  let s = 0; for (const x of a) s += x;
  const mean = s / n;
  let m2 = 0; for (const x of a) { const d = x - mean; m2 += d * d; }
  return { n, mean, variance: m2 / n };
}

let passed = 0, total = 0;
function close(got, exp, tol = 1e-6) {
  if (typeof got !== "number" || !Number.isFinite(got)) return false;
  if (Math.abs(exp) < 1e-9) return Math.abs(got) <= 1e-6;
  return Math.abs(got - exp) / Math.abs(exp) <= tol;
}
function check(cond) { total += 1; try { if (cond === true) passed += 1; } catch { /* throw = fail */ } }

async function main() {
  const implPath = process.argv[2];
  let f;
  try { f = (await import(implPath)).streamStats; } catch { f = undefined; }
  if (typeof f !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
  }

  const cases = [];
  // edges
  cases.push([], [7], [0, 0, 0]);
  // 40 random sequences across the magnitude spectrum (well- AND ill-conditioned)
  for (let i = 0; i < 40; i++) {
    const n = 2 + Math.floor(rng() * 60);
    const logOff = rng() * 8;            // log-uniform exponent 0..8
    const off = Math.pow(10, logOff);    // offset in [1, 1e8]
    const spread = Math.pow(10, rng() * 2); // spread in [1, 100]
    const arr = Array.from({ length: n }, () => off + gauss() * spread);
    cases.push(arr);
  }

  for (const c of cases) {
    const ref = refStats(c);
    let r; try { r = f(c.slice()); } catch { r = null; }
    if (r === null) { check(false); check(false); check(false); continue; }
    check(r.n === c.length);
    check(close(r.mean, ref.mean));
    check(close(r.variance, ref.variance));
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
