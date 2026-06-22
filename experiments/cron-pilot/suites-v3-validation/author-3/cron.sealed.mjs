// Sealed held-out suite for nextRun(expr, after). Node built-ins only.
// Usage: node cron.sealed.mjs <impl-path>
// Prints exactly one JSON line: {"passed":<int>,"total":<int>,"passRate":<float>}
// Exit 0 iff passRate === 1.

const implPath = process.argv[2];
if (!implPath) {
  console.error('usage: node cron.sealed.mjs <impl-path>');
  process.exit(2);
}

let nextRun;
try {
  const mod = await import(implPath);
  nextRun = mod.nextRun;
  if (typeof nextRun !== 'function') throw new Error('no nextRun export');
} catch (e) {
  console.log(JSON.stringify({ passed: 0, total: 1, passRate: 0 }));
  process.exit(1);
}

let passed = 0;
let total = 0;

const D = (s) => new Date(s);
const iso = (d) => (d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().replace('.000', '') : String(d));

// A check that expects a specific ISO result.
function expectFire(expr, afterISO, expectedISO) {
  total++;
  try {
    const r = nextRun(expr, D(afterISO));
    if (r instanceof Date && !isNaN(r.getTime()) && r.getTime() === D(expectedISO).getTime()) {
      passed++;
    }
  } catch (e) {
    // throw where value expected = fail
  }
}

// A check that runs a predicate against the result.
function expectPred(expr, afterISO, pred) {
  total++;
  try {
    const after = D(afterISO);
    const r = nextRun(expr, after);
    if (r instanceof Date && !isNaN(r.getTime()) && pred(r, after)) passed++;
  } catch (e) {
    // fail
  }
}

// A check that expects a throw.
function expectThrow(fn) {
  total++;
  try {
    const r = fn();
    // If it returned a value/Date instead of throwing, that's a fail.
    void r;
  } catch (e) {
    passed++;
  }
}

// ---------------------------------------------------------------------------
// 1. Happy path / sanity examples from the contract.
// ---------------------------------------------------------------------------
expectFire('* * * * *', '2024-01-01T00:00:00Z', '2024-01-01T00:01:00Z');
expectFire('0 0 * * *', '2024-01-01T00:00:00Z', '2024-01-02T00:00:00Z');
expectFire('*/15 * * * *', '2024-01-01T00:00:00Z', '2024-01-01T00:15:00Z');

// ---------------------------------------------------------------------------
// 2. Field forms — each discriminating.
// ---------------------------------------------------------------------------
// list of minutes
expectFire('5,30,45 * * * *', '2024-03-10T12:10:00Z', '2024-03-10T12:30:00Z');
// range of minutes — first in range strictly after
expectFire('10-20 * * * *', '2024-03-10T12:14:00Z', '2024-03-10T12:15:00Z');
// range that has passed this hour -> rolls to next hour's range start
expectFire('10-20 * * * *', '2024-03-10T12:55:00Z', '2024-03-10T13:10:00Z');
// range-step a-b/n
expectFire('0-30/10 * * * *', '2024-03-10T12:05:00Z', '2024-03-10T12:10:00Z');
expectFire('0-30/10 * * * *', '2024-03-10T12:35:00Z', '2024-03-10T13:00:00Z');
// step on hour field
expectFire('0 */6 * * *', '2024-03-10T05:00:00Z', '2024-03-10T06:00:00Z');
expectFire('0 */6 * * *', '2024-03-10T06:00:00Z', '2024-03-10T12:00:00Z');

// ---------------------------------------------------------------------------
// 3. Rollovers.
// ---------------------------------------------------------------------------
// minute -> hour
expectFire('0 * * * *', '2024-03-10T12:34:00Z', '2024-03-10T13:00:00Z');
// hour -> day
expectFire('0 0 * * *', '2024-03-10T23:30:00Z', '2024-03-11T00:00:00Z');
// day -> month (end of a 31-day month)
expectFire('0 0 1 * *', '2024-03-31T12:00:00Z', '2024-04-01T00:00:00Z');
// month -> year (Dec 31 -> next Jan)
expectFire('0 0 * * *', '2024-12-31T12:00:00Z', '2025-01-01T00:00:00Z');
expectFire('30 2 15 1 *', '2024-06-01T00:00:00Z', '2025-01-15T02:30:00Z');

// ---------------------------------------------------------------------------
// 4. Day-of-month skipping short months.
// ---------------------------------------------------------------------------
// day 31 must skip April (30 days) -> May 31
expectFire('0 0 31 * *', '2024-04-15T00:00:00Z', '2024-05-31T00:00:00Z');
// day 30 must skip Feb (2024) -> March 30
expectFire('0 0 30 * *', '2024-02-10T00:00:00Z', '2024-03-30T00:00:00Z');

// ---------------------------------------------------------------------------
// 5. Leap year, both directions.
// ---------------------------------------------------------------------------
// from within leap year 2024, before Feb 29 -> hits this year
expectFire('0 0 29 2 *', '2024-01-01T00:00:00Z', '2024-02-29T00:00:00Z');
// from non-leap 2023 -> must skip to next leap Feb 29 (2024)
expectFire('0 0 29 2 *', '2023-03-01T00:00:00Z', '2024-02-29T00:00:00Z');
// from just after Feb 29 2024 -> next leap year 2028
expectFire('0 0 29 2 *', '2024-03-01T00:00:00Z', '2028-02-29T00:00:00Z');

// ---------------------------------------------------------------------------
// 6. Day-of-week, 0 = Sunday.
// ---------------------------------------------------------------------------
// 2024-03-10 is a Sunday. dow 0 -> next Sunday after a Sunday noon = next Sunday.
expectFire('0 0 * * 0', '2024-03-10T12:00:00Z', '2024-03-17T00:00:00Z');
// dow 1 = Monday: from Sunday -> Monday 2024-03-11
expectFire('0 0 * * 1', '2024-03-10T12:00:00Z', '2024-03-11T00:00:00Z');
// dow range 1-5 (weekdays): from Friday evening -> Monday
expectFire('0 0 * * 1-5', '2024-03-08T12:00:00Z', '2024-03-11T00:00:00Z'); // 2024-03-08 is Friday
// dow 6 = Saturday
expectFire('0 0 * * 6', '2024-03-10T00:00:00Z', '2024-03-16T00:00:00Z');

// ---------------------------------------------------------------------------
// 7. DOM/DOW UNION RULE (Vixie/POSIX) — the load-bearing case.
// When BOTH dom and dow are restricted -> fire when EITHER matches.
// ---------------------------------------------------------------------------
// "0 0 1 * 1" = midnight on the 1st OR any Monday.
// From 2024-03-04 (a Monday) noon: next Monday is 2024-03-11, but the 1st of
// April is later. Union -> next is the closer of {next 1st-of-month, next Monday}.
// After 2024-03-04T12:00 -> next Monday = 2024-03-11. (1st already passed.)
expectFire('0 0 1 * 1', '2024-03-04T12:00:00Z', '2024-03-11T00:00:00Z');
// From 2024-03-25 (Monday) -> next Monday 2024-04-01 which is ALSO the 1st.
expectFire('0 0 1 * 1', '2024-03-25T12:00:00Z', '2024-04-01T00:00:00Z');
// From 2024-03-12 (Tuesday) -> the 1st of April is far; next Monday is 2024-03-18.
// Union picks the Monday (closer than April 1).
expectFire('0 0 1 * 1', '2024-03-12T00:00:00Z', '2024-03-18T00:00:00Z');
// Discriminating against INTERSECTION: "0 0 13 * 5" = 13th OR Friday.
// 2024-09-13 is a Friday (intersection coincidence). Use a month where 13th is
// NOT Friday so union and intersection differ sharply.
// After 2024-03-01: 2024-03-01 is Friday. Next Friday = 2024-03-08 (union hits it;
// intersection would need the 13th to be a Friday). Union -> 2024-03-08.
expectFire('0 0 13 * 5', '2024-03-01T12:00:00Z', '2024-03-08T00:00:00Z'); // 2024-03-08 Fri
// And union also fires on the 13th itself even though it's a Wednesday:
// after 2024-03-08T12:00 -> next is 2024-03-13 (Wed, matches dom) which precedes
// next Friday 2024-03-15. Union -> 2024-03-13.
expectFire('0 0 13 * 5', '2024-03-08T12:00:00Z', '2024-03-13T00:00:00Z');

// When only DOM is restricted (dow = *) -> pure dom, no union.
expectFire('0 0 13 * *', '2024-03-01T00:00:00Z', '2024-03-13T00:00:00Z');
// When only DOW is restricted (dom = *) -> pure dow.
expectFire('0 0 * * 5', '2024-03-01T12:00:00Z', '2024-03-08T00:00:00Z');

// ---------------------------------------------------------------------------
// 8. Strictly-later semantics & invariants (property-ish, closed-form oracle).
// ---------------------------------------------------------------------------
// after exactly aligned on a fire instant -> must advance (> not >=).
expectFire('* * * * *', '2024-05-05T08:08:00Z', '2024-05-05T08:09:00Z');
expectFire('0 0 * * *', '2024-05-05T00:00:00Z', '2024-05-06T00:00:00Z');

// Seconds/milliseconds of `after` ignored for alignment; result top-of-minute.
expectPred('* * * * *', '2024-05-05T08:08:30Z', (r, a) =>
  r.getTime() === D('2024-05-05T08:09:00Z').getTime() &&
  r.getUTCSeconds() === 0 && r.getUTCMilliseconds() === 0 && r.getTime() > a.getTime());

// Seeded pseudo-property: for "* * * * *", result === floor(after/60000)*60000 + 60000.
let seed = 0x12345678;
function lcg() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
const baseMs = D('2020-01-01T00:00:00Z').getTime();
const spanMs = D('2030-01-01T00:00:00Z').getTime() - baseMs;
for (let i = 0; i < 40; i++) {
  const afterMs = baseMs + Math.floor(lcg() * spanMs);
  const after = new Date(afterMs);
  const expected = Math.floor(afterMs / 60000) * 60000 + 60000;
  total++;
  try {
    const r = nextRun('* * * * *', after);
    if (r instanceof Date && r.getTime() === expected &&
        r.getUTCSeconds() === 0 && r.getUTCMilliseconds() === 0) passed++;
  } catch (e) { /* fail */ }
}

// Seeded pseudo-property: for "0 * * * *", result is the next top-of-hour strictly after.
for (let i = 0; i < 40; i++) {
  const afterMs = baseMs + Math.floor(lcg() * spanMs);
  const after = new Date(afterMs);
  // next top-of-hour strictly after `after`
  let expected = Math.floor(afterMs / 3600000) * 3600000 + 3600000;
  total++;
  try {
    const r = nextRun('0 * * * *', after);
    if (r instanceof Date && r.getTime() === expected &&
        r.getUTCMinutes() === 0 && r.getUTCSeconds() === 0) passed++;
  } catch (e) { /* fail */ }
}

// Purity: after not mutated, two calls equal.
total++;
try {
  const after = D('2024-07-15T03:21:45Z');
  const before = after.getTime();
  const r1 = nextRun('*/5 * * * *', after);
  const r2 = nextRun('*/5 * * * *', new Date(before));
  if (after.getTime() === before && r1 instanceof Date && r2 instanceof Date &&
      r1.getTime() === r2.getTime() && r1.getTime() > before) passed++;
} catch (e) { /* fail */ }

// Result always strictly later than after (random exprs).
const exprs = ['* * * * *', '0 0 * * *', '*/15 * * * *', '30 4 1 * *', '0 0 * * 0', '15 14 1 1 *'];
for (let i = 0; i < 30; i++) {
  const afterMs = baseMs + Math.floor(lcg() * spanMs);
  const after = new Date(afterMs);
  const expr = exprs[Math.floor(lcg() * exprs.length)];
  total++;
  try {
    const r = nextRun(expr, after);
    if (r instanceof Date && !isNaN(r.getTime()) && r.getTime() > after.getTime() &&
        r.getUTCSeconds() === 0 && r.getUTCMilliseconds() === 0) passed++;
  } catch (e) { /* fail */ }
}

// ---------------------------------------------------------------------------
// 9. Combined-field discriminating case.
// ---------------------------------------------------------------------------
// "15 14 1 1 *" = 14:15 on Jan 1.
expectFire('15 14 1 1 *', '2024-06-01T00:00:00Z', '2025-01-01T14:15:00Z');
expectFire('15 14 1 1 *', '2024-01-01T00:00:00Z', '2024-01-01T14:15:00Z');
// Specific minute+hour mid-day.
expectFire('30 9 * * *', '2024-03-10T09:30:00Z', '2024-03-11T09:30:00Z');
expectFire('30 9 * * *', '2024-03-10T08:00:00Z', '2024-03-10T09:30:00Z');

// ---------------------------------------------------------------------------
// 10. NEGATIVE CASES — contract mandates throw on malformed expr / invalid date.
// ---------------------------------------------------------------------------
const valid = D('2024-01-01T00:00:00Z');
expectThrow(() => nextRun('', valid));                  // empty string
expectThrow(() => nextRun('   ', valid));               // whitespace only
expectThrow(() => nextRun('* * * *', valid));           // 4 fields
expectThrow(() => nextRun('* * * * * *', valid));       // 6 fields
expectThrow(() => nextRun('* * * * * * *', valid));     // 7 fields
expectThrow(() => nextRun('foo bar baz qux quux', valid)); // non-numeric garbage
expectThrow(() => nextRun('60 * * * *', valid));        // minute 60 (>59)
expectThrow(() => nextRun('* 24 * * *', valid));        // hour 24 (>23)
expectThrow(() => nextRun('* * 0 * *', valid));         // dom 0 (<1)
expectThrow(() => nextRun('* * 32 * *', valid));        // dom 32 (>31)
expectThrow(() => nextRun('* * * 0 *', valid));         // month 0 (<1)
expectThrow(() => nextRun('* * * 13 *', valid));        // month 13 (>12)
expectThrow(() => nextRun('*/0 * * * *', valid));       // step zero
expectThrow(() => nextRun('1,,2 * * * *', valid));      // empty list element
expectThrow(() => nextRun('a * * * *', valid));         // single non-numeric token
expectThrow(() => nextRun('* * * * *', new Date(NaN))); // invalid date
expectThrow(() => nextRun('70-80 * * * *', valid));     // range out of bounds

// ---------------------------------------------------------------------------
const passRate = total === 0 ? 0 : passed / total;
console.log(JSON.stringify({ passed, total, passRate }));
process.exit(passRate === 1 ? 0 : 1);
