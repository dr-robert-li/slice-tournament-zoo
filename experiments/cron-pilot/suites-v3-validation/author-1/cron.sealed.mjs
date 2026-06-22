// Sealed held-out suite for nextRun(expr, after).
// Usage: node cron.sealed.mjs <impl-path>
// Prints exactly one JSON line: {"passed":<int>,"total":<int>,"passRate":<float>}
// Exits 0 iff passRate === 1. Node built-ins only.

const implPath = process.argv[2];
if (!implPath) {
  console.error("usage: node cron.sealed.mjs <impl-path>");
  process.exit(2);
}

const mod = await import(implPath);
const nextRun = mod.nextRun ?? mod.default;

let passed = 0;
let total = 0;

// A check that expects nextRun(expr, after) to return `expectIso`.
function expectEq(expr, afterIso, expectIso) {
  total++;
  try {
    const got = nextRun(expr, new Date(afterIso));
    if (!(got instanceof Date) || Number.isNaN(got.getTime())) return;
    if (got.toISOString() === new Date(expectIso).toISOString()) passed++;
  } catch {
    // value expected, throw => fail
  }
}

// A check that expects nextRun to throw (rejection).
function expectThrow(expr, after) {
  total++;
  try {
    nextRun(expr, after);
    // no throw => fail
  } catch {
    passed++;
  }
}

// A predicate check (boolean function). Throw or false => fail.
function expectTrue(fn) {
  total++;
  try {
    if (fn() === true) passed++;
  } catch {
    /* fail */
  }
}

const T0 = "2024-01-01T00:00:00Z"; // Monday

// ---------------------------------------------------------------------------
// Happy-path / contract sanity examples
// ---------------------------------------------------------------------------
expectEq("* * * * *", T0, "2024-01-01T00:01:00Z");
expectEq("0 0 * * *", T0, "2024-01-02T00:00:00Z");
expectEq("*/15 * * * *", T0, "2024-01-01T00:15:00Z");

// ---------------------------------------------------------------------------
// Strictly-later semantics (catches >= vs >)
// ---------------------------------------------------------------------------
expectEq("* * * * *", "2024-01-01T00:01:00Z", "2024-01-01T00:02:00Z");
expectEq("0 0 * * *", "2024-01-02T00:00:00Z", "2024-01-03T00:00:00Z");
// after carrying nonzero seconds must still land on the top of the next minute
expectEq("* * * * *", "2024-01-01T00:00:30Z", "2024-01-01T00:01:00Z");
expectEq("0 12 * * *", "2024-01-01T12:00:00Z", "2024-01-02T12:00:00Z");

// ---------------------------------------------------------------------------
// Seconds always zeroed
// ---------------------------------------------------------------------------
expectTrue(() => {
  const r = nextRun("*/5 * * * *", new Date("2024-03-10T08:02:17Z"));
  return r.getUTCSeconds() === 0 && r.getUTCMilliseconds() === 0;
});

// ---------------------------------------------------------------------------
// Lists, ranges, steps
// ---------------------------------------------------------------------------
expectEq("0,30 * * * *", T0, "2024-01-01T00:30:00Z");
expectEq("0,30 * * * *", "2024-01-01T00:30:00Z", "2024-01-01T01:00:00Z");
expectEq("5 9-17 * * *", T0, "2024-01-01T09:05:00Z");
expectEq("0 9-17 * * *", "2024-01-01T17:30:00Z", "2024-01-02T09:00:00Z");
// step on a range: minutes 0,10,20,30,40,50 -> after 00:12 gives 00:20
expectEq("0-59/10 * * * *", "2024-01-01T00:12:00Z", "2024-01-01T00:20:00Z");
// bare-number-with-step: "10/15" hours -> 10, then nothing higher reaches; next day 10:00
expectEq("0 10/15 * * *", "2024-01-01T11:00:00Z", "2024-01-02T10:00:00Z");
expectEq("0 0 1,15 * *", "2024-01-02T00:00:00Z", "2024-01-15T00:00:00Z");

// ---------------------------------------------------------------------------
// Day-of-week (0 = Sunday). 2024-01-07 is the first Sunday of 2024.
// ---------------------------------------------------------------------------
expectEq("0 0 * * 0", T0, "2024-01-07T00:00:00Z"); // next Sunday
expectEq("0 0 * * 1", T0, "2024-01-08T00:00:00Z"); // next Monday (strictly later than Mon 00:00)
// range of weekdays Mon-Fri (1-5): from Sat ref, lands Monday
expectEq("0 0 * * 1-5", "2024-01-06T00:00:00Z", "2024-01-08T00:00:00Z");

// ---------------------------------------------------------------------------
// DOM/DOW interaction (Vixie OR semantics when BOTH restricted).
// Discriminating: "0 0 13 * 5" => fires on DOM 13 OR any Friday.
// First Friday of Jan 2024 is Jan 5; an AND impl would jump far later.
// ---------------------------------------------------------------------------
expectEq("0 0 13 * 5", T0, "2024-01-05T00:00:00Z"); // Friday Jan 5 (OR)
// DOM 13 reached before the next Friday after Jan 5? Jan 12 is the next Friday,
// Jan 13 is the DOM. From Jan 5: next match is Fri Jan 12.
expectEq("0 0 13 * 5", "2024-01-05T00:00:00Z", "2024-01-12T00:00:00Z");
// Only DOM restricted (DOW = *): AND with rest, plain DOM 13.
expectEq("0 0 13 * *", T0, "2024-01-13T00:00:00Z");
// Only DOW restricted (DOM = *): plain Friday.
expectEq("0 0 * * 5", T0, "2024-01-05T00:00:00Z");

// ---------------------------------------------------------------------------
// Month / year boundaries
// ---------------------------------------------------------------------------
expectEq("0 0 1 * *", "2024-01-15T00:00:00Z", "2024-02-01T00:00:00Z"); // month rollover
expectEq("0 0 1 1 *", "2024-06-01T00:00:00Z", "2025-01-01T00:00:00Z"); // year rollover
expectEq("59 23 31 12 *", "2024-12-31T23:58:00Z", "2024-12-31T23:59:00Z"); // last minute of year
expectEq("0 0 1 1 *", "2024-12-31T23:59:00Z", "2025-01-01T00:00:00Z"); // crossing into new year
// last-of-month handling: 31st only exists some months; from Feb expect March 31.
expectEq("0 0 31 * *", "2024-02-01T00:00:00Z", "2024-03-31T00:00:00Z");

// ---------------------------------------------------------------------------
// Leap years: Feb 29 only in leap years.
// ---------------------------------------------------------------------------
expectEq("0 0 29 2 *", "2024-03-01T00:00:00Z", "2028-02-29T00:00:00Z"); // next leap year
expectEq("0 0 29 2 *", "2023-01-01T00:00:00Z", "2024-02-29T00:00:00Z"); // 2024 is a leap year
expectEq("0 0 29 2 *", "2024-01-01T00:00:00Z", "2024-02-29T00:00:00Z"); // same year

// ---------------------------------------------------------------------------
// Negative cases: contract mandates throwing on malformed expr / invalid date.
// ---------------------------------------------------------------------------
expectThrow("* * * *", new Date(T0)); // 4 fields
expectThrow("* * * * * *", new Date(T0)); // 6 fields
expectThrow("", new Date(T0)); // empty
expectThrow("   ", new Date(T0)); // whitespace only
expectThrow("a * * * *", new Date(T0)); // non-numeric minute token
expectThrow("* foo * * *", new Date(T0)); // non-numeric hour token
expectThrow("99 * * * *", new Date(T0)); // minute out of range (0-59)
expectThrow("* 25 * * *", new Date(T0)); // hour out of range (0-23)
expectThrow("* * 32 * *", new Date(T0)); // day-of-month out of range (1-31)
expectThrow("* * 0 * *", new Date(T0)); // day-of-month below range (min 1)
expectThrow("* * * 13 *", new Date(T0)); // month out of range (1-12)
expectThrow("* * * 0 *", new Date(T0)); // month below range (min 1)
expectThrow("* * * * 8", new Date(T0)); // day-of-week out of range (0-6)
expectThrow("*/0 * * * *", new Date(T0)); // zero step
expectThrow("0 0 * * *", new Date(NaN)); // invalid date

// ---------------------------------------------------------------------------
// Property-based checks with a deterministic seeded PRNG.
// Invariant 1: result is a Date strictly after `after`, seconds/ms zeroed.
// Invariant 2: minimality — no earlier minute in [after+1min, result) matches
//   the fields (independent scan, not reusing nextRun's search).
// Invariant 3: the result itself matches all fields.
// ---------------------------------------------------------------------------

// Mulberry32 deterministic PRNG.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BOUNDS = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
];

function randInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

// Generate one well-formed field string and its allowed-set predicate.
function genField(rng, lo, hi) {
  const kind = randInt(rng, 0, 3);
  if (kind === 0) {
    return { str: "*", allows: () => true };
  }
  if (kind === 1) {
    // single value
    const v = randInt(rng, lo, hi);
    return { str: String(v), allows: (x) => x === v };
  }
  if (kind === 2) {
    // step over full range
    const n = randInt(rng, 1, Math.max(1, hi - lo));
    const allowed = new Set();
    for (let v = lo; v <= hi; v += n) allowed.add(v);
    return { str: `*/${n}`, allows: (x) => allowed.has(x) };
  }
  // range a-b
  let a = randInt(rng, lo, hi);
  let b = randInt(rng, lo, hi);
  if (a > b) [a, b] = [b, a];
  return { str: `${a}-${b}`, allows: (x) => x >= a && x <= b };
}

function buildExpr(rng) {
  const fields = BOUNDS.map(([lo, hi]) => genField(rng, lo, hi));
  return {
    expr: fields.map((f) => f.str).join(" "),
    min: fields[0],
    hr: fields[1],
    dom: fields[2],
    mon: fields[3],
    dow: fields[4],
    domStar: fields[2].str === "*",
    dowStar: fields[4].str === "*",
  };
}

function dayOk(spec, date) {
  const dom = date.getUTCDate();
  const dow = date.getUTCDay();
  if (!spec.domStar && !spec.dowStar) {
    return spec.dom.allows(dom) || spec.dow.allows(dow);
  }
  if (!spec.domStar) return spec.dom.allows(dom);
  if (!spec.dowStar) return spec.dow.allows(dow);
  return true;
}

function fieldsMatch(spec, date) {
  return (
    spec.mon.allows(date.getUTCMonth() + 1) &&
    dayOk(spec, date) &&
    spec.hr.allows(date.getUTCHours()) &&
    spec.min.allows(date.getUTCMinutes())
  );
}

const rng = makeRng(0xc0ffee);
const PROP_RUNS = 60;
for (let i = 0; i < PROP_RUNS; i++) {
  const spec = buildExpr(rng);
  // Random reference time within a multi-year window.
  const baseMs = Date.UTC(2023, 0, 1, 0, 0, 0);
  const afterMs = baseMs + Math.floor(rng() * 3 * 365 * 24 * 60) * 60000 + randInt(rng, 0, 59) * 1000;
  const after = new Date(afterMs);

  expectTrue(() => {
    const got = nextRun(spec.expr, after);
    if (!(got instanceof Date) || Number.isNaN(got.getTime())) return false;
    // strictly after
    if (!(got.getTime() > after.getTime())) return false;
    // seconds + ms zeroed
    if (got.getUTCSeconds() !== 0 || got.getUTCMilliseconds() !== 0) return false;
    // result matches the fields
    if (!fieldsMatch(spec, got)) return false;
    // minimality: independent scan over [after+1min, got)
    const start = new Date(after.getTime());
    start.setUTCSeconds(0, 0);
    start.setUTCMinutes(start.getUTCMinutes() + 1);
    for (
      let t = start.getTime();
      t < got.getTime();
      t += 60000
    ) {
      if (fieldsMatch(spec, new Date(t))) return false; // an earlier match exists => not minimal
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
const passRate = total === 0 ? 0 : passed / total;
console.log(JSON.stringify({ passed, total, passRate }));
process.exit(passRate === 1 ? 0 : 1);
