// HELD-OUT TRUTH oracle for `evaluate`. Grades frozen winners only; never a selection
// signal, seen by NO genome's author. Mechanism: ABSOLUTE comparison to the validated
// recursive-descent reference (ref/correct.mjs) over seeded fuzzed expressions (SEED_T)
// PLUS a battery of precedence/associativity discriminators. A correct impl scores 1.0;
// an impl with the natural ** / unary-minus bug scores partial (graded fitness).
//
// Harness contract: node truth.mjs <impl-path>
// Prints one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.
import { evaluate as reference } from "./ref/correct.mjs";
import { validExpressions } from "./_expr.mjs";

const SEED_T = 0x7ec0ffee;

let passed = 0, total = 0;
function close(got, exp) {
  if (typeof got !== "number" || !Number.isFinite(got)) return false;
  return Math.abs(got - exp) <= 1e-9 * Math.max(1, Math.abs(exp));
}
function check(c) { total += 1; try { if (c === true) passed += 1; } catch { /* throw=fail */ } }

async function main() {
  const impl = process.argv[2];
  let f;
  try { f = (await import(impl)).evaluate; } catch { f = undefined; }
  if (typeof f !== "function") { process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n"); process.exit(1); }

  // fuzzed cases (the non-enumerable bulk)
  const cases = validExpressions(reference, SEED_T, 80, 3);
  // explicit precedence/associativity discriminators (guarantee the axis is tested)
  const battery = ["2**3**2", "-2**2", "2**2**3", "-3**2", "2*-3**2", "--2**2",
                   "2**3*2", "(-2)**2", "3-2**2", "2**1**4"];
  for (const e of battery) cases.push({ expr: e, value: reference(e) });

  for (const c of cases) {
    let got; try { got = f(c.expr); } catch { got = null; }
    check(close(got, c.value));
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
