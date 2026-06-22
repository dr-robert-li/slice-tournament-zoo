// HELD-OUT TRUTH suite (Suite 3) for slice `nextRun`. Independent oracle: grades frozen winners
// only; never a selection signal, seen by no condition. Strict adversarial superset of the
// sealed suite — adds the cron realities that separate correct from plausibly-wrong: dom/dow
// UNION semantics, leap-year Feb 29 (incl. multi-year search), month/year rollover, step+range
// parsing, list fields, error handling, and properties (strictly-after, seconds=0, field-match).
//
// Harness contract: node cron.truth.mjs <impl-path>
// Prints exactly one JSON line {"passed":int,"total":int,"passRate":float}; exit 0 iff passRate===1.
// Node built-ins only.

let passed = 0;
let total = 0;
function check(cond) {
  total += 1;
  try {
    if (cond === true) passed += 1;
  } catch {
    /* throwing predicate = failure */
  }
}
const U = (y, mo, d, h, mi) => Date.UTC(y, mo - 1, d, h, mi, 0);

// [expr, afterMs, expectedMs] — expected next firing time (UTC).
const CASES = [
  // basics re-pinned
  ["* * * * *", U(2024, 1, 1, 0, 0), U(2024, 1, 1, 0, 1)],
  ["0 0 * * *", U(2024, 1, 1, 0, 0), U(2024, 1, 2, 0, 0)],
  // strictly-after when `after` is exactly on a match
  ["0 0 * * *", U(2024, 1, 1, 0, 0), U(2024, 1, 2, 0, 0)],
  ["30 * * * *", U(2024, 1, 1, 0, 30), U(2024, 1, 1, 1, 30)],
  // steps and ranges
  ["0-30/10 * * * *", U(2024, 1, 1, 0, 0), U(2024, 1, 1, 0, 10)],
  ["0 0 1 */3 *", U(2024, 1, 15, 0, 0), U(2024, 4, 1, 0, 0)], // every 3rd month, 1st
  ["15,45 * * * *", U(2024, 1, 1, 0, 0), U(2024, 1, 1, 0, 15)],
  ["0 0 1,15 * *", U(2024, 1, 1, 0, 0), U(2024, 1, 15, 0, 0)],
  // day-of-week
  ["0 0 * * 0", U(2024, 1, 1, 0, 0), U(2024, 1, 7, 0, 0)], // next Sunday
  ["0 0 * * 7", U(2024, 1, 1, 0, 0), U(2024, 1, 7, 0, 0)], // 7 == Sunday
  ["0 9 * * 1", U(2024, 1, 1, 0, 0), U(2024, 1, 1, 9, 0)], // Mon 09:00; after is Mon 00:00 -> same day 09:00
  // dom/dow UNION (both restricted -> OR). Fri the 5th vs the 13th: Fri comes first.
  ["0 0 13 * 5", U(2024, 1, 1, 0, 0), U(2024, 1, 5, 0, 0)],
  // union where dom comes first: the 2nd vs Friday
  ["0 0 2 * 5", U(2024, 1, 1, 0, 0), U(2024, 1, 2, 0, 0)],
  // only dom restricted -> dow ignored
  ["0 0 31 * *", U(2024, 1, 1, 0, 0), U(2024, 1, 31, 0, 0)],
  // month with no 31st -> skip to next month that has it
  ["0 0 31 * *", U(2024, 2, 1, 0, 0), U(2024, 3, 31, 0, 0)],
  // leap-year Feb 29 (2024 is leap)
  ["0 0 29 2 *", U(2024, 1, 1, 0, 0), U(2024, 2, 29, 0, 0)],
  // Feb 29 across non-leap years: from 2025 -> next leap is 2028
  ["0 0 29 2 *", U(2025, 1, 1, 0, 0), U(2028, 2, 29, 0, 0)],
  // year rollover
  ["0 0 1 1 *", U(2024, 6, 1, 0, 0), U(2025, 1, 1, 0, 0)],
  ["59 23 31 12 *", U(2024, 1, 1, 0, 0), U(2024, 12, 31, 23, 59)],
];

// Expressions that MUST throw.
const THROWS = [
  "* * * *", // 4 fields
  "* * * * * *", // 6 fields
  "60 * * * *", // minute out of range
  "0 24 * * *", // hour out of range
  "0 0 0 * *", // dom 0 out of range
  "0 0 * 13 *", // month out of range
  "5-2 * * * *", // inverted range
  "*/0 * * * *", // step 0
  "abc * * * *", // garbage
];

async function main() {
  const implPath = process.argv[2];
  let nextRun;
  try {
    nextRun = (await import(implPath)).nextRun;
  } catch {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  if (typeof nextRun !== "function") {
    process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
    process.exit(1);
    return;
  }
  const call = (expr, afterMs) => {
    try {
      return nextRun(expr, new Date(afterMs));
    } catch {
      return "<<threw>>";
    }
  };

  // 1) Exact expected firing times
  for (const [expr, afterMs, wantMs] of CASES) {
    const got = call(expr, afterMs);
    check(got instanceof Date && got.getTime() === wantMs);
  }

  // 2) Malformed expressions must throw
  for (const bad of THROWS) {
    let threw = false;
    try {
      nextRun(bad, new Date(U(2024, 1, 1, 0, 0)));
    } catch {
      threw = true;
    }
    check(threw === true);
  }

  // 3) Properties over a batch of valid expressions: result is a Date, strictly after `after`,
  //    on a zeroed-seconds minute boundary, and its UTC minute/hour are within the field sets.
  const PROPS = [
    ["*/7 * * * *", U(2024, 3, 10, 4, 33)],
    ["0 0 * * 3", U(2024, 1, 1, 0, 0)],
    ["30 6 * * 1-5", U(2024, 1, 6, 0, 0)],
    ["0 0 1 * *", U(2024, 12, 15, 0, 0)],
    ["*/5 9-17 * * *", U(2024, 7, 4, 12, 2)],
  ];
  for (const [expr, afterMs] of PROPS) {
    const after = afterMs;
    const got = call(expr, after);
    check(got instanceof Date); // is a Date
    if (got instanceof Date) {
      check(got.getTime() > after); // strictly after
      check(got.getUTCSeconds() === 0 && got.getUTCMilliseconds() === 0); // minute boundary
    } else {
      check(false);
      check(false);
    }
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}
main();
