// Sealed held-out test suite for nextRun(expr, after).
// Invoked: node cron.sealed.mjs <impl-path>
// Prints exactly one JSON line: {"passed":<int>,"total":<int>,"passRate":<float>}
// Exits 0 iff passRate === 1. Node built-ins only.

import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const implPath = process.argv[2];
if (!implPath) {
  console.error("usage: node cron.sealed.mjs <impl-path>");
  process.exit(2);
}

const mod = await import(pathToFileURL(resolve(implPath)).href);
const nextRun = mod.nextRun;

let passed = 0;
let total = 0;

// A check that expects a value back. body() must return truthy.
// A throw inside body counts as FAIL.
function check(fn) {
  total++;
  try {
    if (fn()) passed++;
  } catch {
    // throw where a value/assertion was expected => fail
  }
}

// A check that expects the impl to throw. If it throws => pass.
function checkThrows(fn) {
  total++;
  try {
    fn();
    // no throw => fail
  } catch {
    passed++;
  }
}

// ---------------------------------------------------------------------------
// Independent oracle (does NOT import the implementation).
// ---------------------------------------------------------------------------

const FIELD_BOUNDS = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 6 },
];

function oracleParseField(spec, { min, max }) {
  const allowed = new Set();
  for (const part of spec.split(",")) {
    let rangePart = part;
    let step = 1;
    const slashIdx = part.indexOf("/");
    if (slashIdx !== -1) {
      rangePart = part.slice(0, slashIdx);
      step = parseInt(part.slice(slashIdx + 1), 10);
    }
    let lo, hi;
    if (rangePart === "*") {
      lo = min;
      hi = max;
    } else if (rangePart.includes("-")) {
      const [a, b] = rangePart.split("-");
      lo = parseInt(a, 10);
      hi = parseInt(b, 10);
    } else {
      lo = parseInt(rangePart, 10);
      hi = slashIdx !== -1 ? max : lo;
    }
    for (let v = lo; v <= hi; v += step) allowed.add(v);
  }
  return allowed;
}

function oracleParse(expr) {
  const fields = expr.trim().split(/\s+/);
  return {
    minute: oracleParseField(fields[0], FIELD_BOUNDS[0]),
    hour: oracleParseField(fields[1], FIELD_BOUNDS[1]),
    dom: oracleParseField(fields[2], FIELD_BOUNDS[2]),
    month: oracleParseField(fields[3], FIELD_BOUNDS[3]),
    dow: oracleParseField(fields[4], FIELD_BOUNDS[4]),
    domR: fields[2] !== "*",
    dowR: fields[4] !== "*",
  };
}

// Does cron expression `expr` fire at the exact minute `d` (UTC)?
function matches(expr, d) {
  const p = oracleParse(expr);
  if (!p.minute.has(d.getUTCMinutes())) return false;
  if (!p.hour.has(d.getUTCHours())) return false;
  if (!p.month.has(d.getUTCMonth() + 1)) return false;
  const domOk = p.dom.has(d.getUTCDate());
  const dowOk = p.dow.has(d.getUTCDay());
  const dayOk = p.domR && p.dowR ? domOk || dowOk : domOk && dowOk;
  return dayOk;
}

// Independent minimal-next computation: scan minute by minute.
// Returns null if no fire within `maxMinutes`.
function oracleNext(expr, after, maxMinutes) {
  const t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t.setUTCMinutes(t.getUTCMinutes() + 1);
  for (let i = 0; i < maxMinutes; i++) {
    if (matches(expr, t)) return new Date(t.getTime());
    t.setUTCMinutes(t.getUTCMinutes() + 1);
  }
  return null;
}

// Deterministic PRNG (mulberry32) so the sealed suite is reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isDate(x) {
  return x instanceof Date && !Number.isNaN(x.getTime());
}

function eq(a, bIso) {
  return isDate(a) && a.getTime() === new Date(bIso).getTime();
}

// ---------------------------------------------------------------------------
// Sanity examples from the contract.
// ---------------------------------------------------------------------------
const A = new Date("2024-01-01T00:00:00Z");
check(() => eq(nextRun("* * * * *", A), "2024-01-01T00:01:00Z"));
check(() => eq(nextRun("0 0 * * *", A), "2024-01-02T00:00:00Z"));
check(() => eq(nextRun("*/15 * * * *", A), "2024-01-01T00:15:00Z"));

// Returns a real Date.
check(() => isDate(nextRun("* * * * *", A)));

// ---------------------------------------------------------------------------
// Strictly-after + seconds/ms zeroing.
// ---------------------------------------------------------------------------
// after exactly on a fire boundary -> must advance, not return same.
check(() => eq(nextRun("0 0 * * *", new Date("2024-01-02T00:00:00Z")), "2024-01-03T00:00:00Z"));
// nonzero seconds -> top of next minute, seconds zeroed.
check(() => {
  const r = nextRun("* * * * *", new Date("2024-01-01T00:00:30Z"));
  return eq(r, "2024-01-01T00:01:00Z") && r.getUTCSeconds() === 0 && r.getUTCMilliseconds() === 0;
});
// nonzero ms also zeroed.
check(() => {
  const r = nextRun("* * * * *", new Date("2024-01-01T00:00:00.500Z"));
  return r.getUTCSeconds() === 0 && r.getUTCMilliseconds() === 0;
});
// strictly-after when already matching the every-minute schedule mid-minute.
check(() => eq(nextRun("30 14 * * *", new Date("2024-03-10T14:30:00Z")), "2024-03-11T14:30:00Z"));

// ---------------------------------------------------------------------------
// Ranges (inclusive endpoints) + discrimination on off-range values.
// ---------------------------------------------------------------------------
// hour range 9-17: from 08:59 next is 09:00.
check(() => eq(nextRun("0 9-17 * * *", new Date("2024-01-01T08:59:00Z")), "2024-01-01T09:00:00Z"));
// upper endpoint inclusive: from 17:00 next 0-minute is... 17 is last; from 17:01 jump to next day 09:00.
check(() => eq(nextRun("0 9-17 * * *", new Date("2024-01-01T17:00:00Z")), "2024-01-02T09:00:00Z"));
// minute range lower endpoint inclusive.
check(() => eq(nextRun("10-20 * * * *", new Date("2024-01-01T00:05:00Z")), "2024-01-01T00:10:00Z"));
// off-range minute must skip past the range to next in-range minute (01:10), not fire at 21..59.
check(() => eq(nextRun("10-20 * * * *", new Date("2024-01-01T00:20:00Z")), "2024-01-01T01:10:00Z"));

// ---------------------------------------------------------------------------
// Lists.
// ---------------------------------------------------------------------------
check(() => eq(nextRun("0,30 * * * *", new Date("2024-01-01T00:00:00Z")), "2024-01-01T00:30:00Z"));
check(() => eq(nextRun("0,30 * * * *", new Date("2024-01-01T00:30:00Z")), "2024-01-01T01:00:00Z"));
check(() => eq(nextRun("0 0 1,15 * *", new Date("2024-01-02T00:00:00Z")), "2024-01-15T00:00:00Z"));

// ---------------------------------------------------------------------------
// Steps: */n and a-b/n. Discriminate by asserting NOT firing off-step.
// ---------------------------------------------------------------------------
check(() => eq(nextRun("*/15 * * * *", new Date("2024-01-01T00:01:00Z")), "2024-01-01T00:15:00Z"));
// */20 fires at 0,20,40 — from 00:25 next is 00:40 (NOT 00:26).
check(() => eq(nextRun("*/20 * * * *", new Date("2024-01-01T00:25:00Z")), "2024-01-01T00:40:00Z"));
// a-b/n bounded range step: 0-30/10 -> 0,10,20,30; from 00:11 next is 00:20.
check(() => eq(nextRun("0-30/10 * * * *", new Date("2024-01-01T00:11:00Z")), "2024-01-01T00:20:00Z"));
// 0-30/10 must NOT fire past 30: from 00:31 jump to next hour 00.
check(() => eq(nextRun("0-30/10 * * * *", new Date("2024-01-01T00:31:00Z")), "2024-01-01T01:00:00Z"));
// step on hours */6 -> 0,6,12,18.
check(() => eq(nextRun("0 */6 * * *", new Date("2024-01-01T07:00:00Z")), "2024-01-01T12:00:00Z"));

// ---------------------------------------------------------------------------
// DOM/DOW interaction — the OR rule when BOTH restricted.
// 2024-01: the 1st is a Monday. 2024-01-13 is a Saturday; 2024-01-15 is Monday.
// "0 0 13 * 1" => fires on day-13 OR on any Monday.
// ---------------------------------------------------------------------------
// From Jan 2 (Tue): next Monday is Jan 8 -> fires via DOW even though DOM!=13.
check(() => eq(nextRun("0 0 13 * 1", new Date("2024-01-02T00:00:00Z")), "2024-01-08T00:00:00Z"));
// From Jan 9 (after Mon Jan 8, before Sat Jan 13): next match is Jan 13 via DOM
// (Jan 13 is Saturday, NOT Monday) -> proves DOM side of the OR fires.
check(() => eq(nextRun("0 0 13 * 1", new Date("2024-01-09T00:00:00Z")), "2024-01-13T00:00:00Z"));

// When ONLY DOM restricted (DOW = *): pure AND, only DOM constrains.
// "0 0 15 * *" => only the 15th.
check(() => eq(nextRun("0 0 15 * *", new Date("2024-01-01T00:00:00Z")), "2024-01-15T00:00:00Z"));

// When ONLY DOW restricted (DOM = *): only DOW constrains.
// "0 0 * * 5" => Fridays. 2024-01-05 is a Friday.
check(() => eq(nextRun("0 0 * * 5", new Date("2024-01-01T00:00:00Z")), "2024-01-05T00:00:00Z"));

// DOW range Mon-Fri (1-5): from Saturday should skip the weekend.
// 2024-01-06 Sat, 2024-01-07 Sun -> next weekday is Mon Jan 8.
check(() => eq(nextRun("0 0 * * 1-5", new Date("2024-01-06T12:00:00Z")), "2024-01-08T00:00:00Z"));

// DOW 0 = Sunday: 2024-01-07 is a Sunday.
check(() => eq(nextRun("0 0 * * 0", new Date("2024-01-01T00:00:00Z")), "2024-01-07T00:00:00Z"));

// ---------------------------------------------------------------------------
// Month / year rollover.
// ---------------------------------------------------------------------------
// End of year: last fire of Dec -> first of next year.
check(() => eq(nextRun("0 0 1 * *", new Date("2024-12-15T00:00:00Z")), "2025-01-01T00:00:00Z"));
// Month boundary: from Jan 31 23:59 with every-minute -> Feb 1 00:00.
check(() => eq(nextRun("* * * * *", new Date("2024-01-31T23:59:00Z")), "2024-02-01T00:00:00Z"));
// Specific month: "0 0 1 7 *" -> July 1st across the year.
check(() => eq(nextRun("0 0 1 7 *", new Date("2024-08-01T00:00:00Z")), "2025-07-01T00:00:00Z"));

// ---------------------------------------------------------------------------
// Leap year — strong discriminator. Feb 29 only exists in leap years.
// 2024 is leap; 2025,2026,2027 are not; 2028 is leap.
// ---------------------------------------------------------------------------
// From just after Feb 29 2024 -> must skip to Feb 29 2028 (not 2025/26/27).
check(() => eq(nextRun("0 0 29 2 *", new Date("2024-03-01T00:00:00Z")), "2028-02-29T00:00:00Z"));
// From 2025-01-01, "0 0 29 2 *" -> 2028-02-29 (skips three non-leap Febs).
check(() => eq(nextRun("0 0 29 2 *", new Date("2025-01-01T00:00:00Z")), "2028-02-29T00:00:00Z"));
// Non-leap Feb: last day Feb 28 -> Mar 1 for daily.
check(() => eq(nextRun("0 0 * * *", new Date("2025-02-28T00:00:00Z")), "2025-03-01T00:00:00Z"));
// Leap Feb has a 29th for daily schedule.
check(() => eq(nextRun("0 0 * * *", new Date("2024-02-28T00:00:00Z")), "2024-02-29T00:00:00Z"));

// ---------------------------------------------------------------------------
// Combined fields discrimination.
// "30 9 * * 1-5" weekday 09:30. From Fri 09:31 -> Mon 09:30.
// 2024-01-05 Fri, next weekday Mon 2024-01-08.
// ---------------------------------------------------------------------------
check(() => eq(nextRun("30 9 * * 1-5", new Date("2024-01-05T09:31:00Z")), "2024-01-08T09:30:00Z"));

// ---------------------------------------------------------------------------
// Property-based: random expressions + random `after`. Assert the contract:
//   (1) result matches the expression (independent oracle)
//   (2) result strictly after `after`
//   (3) seconds & ms zeroed
//   (4) minimality: no earlier matching minute between after+60s and result
// ---------------------------------------------------------------------------
const rnd = mulberry32(0x5eed1234);
function ri(lo, hi) {
  return lo + Math.floor(rnd() * (hi - lo + 1));
}

function randField(min, max) {
  const kind = ri(0, 4);
  if (kind === 0) return "*";
  if (kind === 1) return String(ri(min, max)); // single
  if (kind === 2) {
    // range
    const a = ri(min, max);
    const b = ri(a, max);
    return `${a}-${b}`;
  }
  if (kind === 3) {
    // step over *
    const n = ri(1, Math.max(1, Math.floor((max - min) / 2) || 1));
    return `*/${n}`;
  }
  // list of 2 values
  const a = ri(min, max);
  const b = ri(min, max);
  return `${a},${b}`;
}

const MAX_SCAN = 366 * 24 * 60 * 6; // ~6 years of minutes
for (let iter = 0; iter < 120; iter++) {
  const expr = [
    randField(0, 59),
    randField(0, 23),
    // Keep DOM <= 28 in random gen so day-restricted exprs stay satisfiable
    // within every month (avoids "31st" unsatisfiable noise). Specific
    // leap/boundary behaviour is covered by the explicit cases above.
    (() => {
      const f = randField(1, 28);
      return f;
    })(),
    randField(1, 12),
    randField(0, 6),
  ].join(" ");

  // random `after` within a few years.
  const afterMs = Date.UTC(2024, 0, 1) + Math.floor(rnd() * 3 * 365 * 24 * 60) * 60000 + ri(0, 59) * 1000;
  const after = new Date(afterMs);

  const expected = oracleNext(expr, after, MAX_SCAN);

  check(() => {
    let r;
    try {
      r = nextRun(expr, after);
    } catch {
      // If the oracle also finds nothing, a throw is acceptable here.
      return expected === null;
    }
    if (expected === null) return false; // oracle says a fire exists path differs
    if (!isDate(r)) return false;
    if (r.getUTCSeconds() !== 0 || r.getUTCMilliseconds() !== 0) return false;
    if (r.getTime() <= after.getTime()) return false;
    if (!matches(expr, r)) return false;
    // minimality: impl must equal the earliest matching minute.
    return r.getTime() === expected.getTime();
  });
}

// ---------------------------------------------------------------------------
// NEGATIVE CASES — contract: "Throw on a malformed expression or invalid date."
// ---------------------------------------------------------------------------
const B = new Date("2024-01-01T00:00:00Z");

// Wrong field count.
checkThrows(() => nextRun("* * * *", B));        // 4 fields
checkThrows(() => nextRun("* * * * * *", B));    // 6 fields
checkThrows(() => nextRun("", B));               // empty string
checkThrows(() => nextRun("   ", B));            // whitespace only

// Out-of-range numerics.
checkThrows(() => nextRun("60 * * * *", B));     // minute 60 (max 59)
checkThrows(() => nextRun("* 24 * * *", B));     // hour 24 (max 23)
checkThrows(() => nextRun("* * 32 * *", B));     // dom 32 (max 31)
checkThrows(() => nextRun("* * 0 * *", B));      // dom 0 (min 1)
checkThrows(() => nextRun("* * * 13 *", B));     // month 13 (max 12)
checkThrows(() => nextRun("* * * 0 *", B));      // month 0 (min 1)
checkThrows(() => nextRun("* * * * 8", B));      // dow 8 (max 6)

// Non-numeric garbage.
checkThrows(() => nextRun("a b c d e", B));
checkThrows(() => nextRun("* * * * x", B));

// Step of zero.
checkThrows(() => nextRun("*/0 * * * *", B));

// Out-of-range inside a range.
checkThrows(() => nextRun("0-70 * * * *", B));

// Invalid date.
checkThrows(() => nextRun("* * * * *", new Date("not-a-date")));
checkThrows(() => nextRun("* * * * *", new Date(NaN)));

// ---------------------------------------------------------------------------
const passRate = total === 0 ? 0 : passed / total;
console.log(JSON.stringify({ passed, total, passRate }));
process.exit(passRate === 1 ? 0 : 1);
