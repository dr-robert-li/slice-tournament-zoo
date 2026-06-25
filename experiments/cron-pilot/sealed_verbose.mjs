// SEALED suite (Suite 2) for slice `nextRun`. Held-out: specimens never see this file.
// Adversarial about the awkward parts of cron. All times UTC; comparisons by getTime().
//
// Harness contract: node cron.sealed.mjs <impl-path>
//   - await import(process.argv[2]); take the `nextRun` export.
//   - On import failure / non-function: emit {"passed":0,"total":1,"passRate":0} and exit 1.
//   - Prints EXACTLY ONE final JSON line {"passed":int,"total":int,"passRate":float} to stdout.
//   - exits 0 iff passRate===1. Node built-ins only. Diagnostics (if any) go to stderr.
//
// Design: a trivial brute-force minute-scanning ORACLE is the correctness backbone. It is
// correct by construction (field-by-field match + scan from after+1min). It (a) cross-checks
// every hand-pinned case at load time and (b) drives the seeded property battery, so the exact
// random inputs are not knowable in advance. Hand-pins only fix values the contract unambiguously
// determines; genuinely ambiguous points are asserted as invariants instead.

let passed = 0;
const __failures = [];
let total = 0;

function check(cond) {
  total += 1;
  if (cond) passed += 1;
}

// ---------------------------------------------------------------------------
// Brute-force oracle (independent of any specimen; correct by construction).
// ---------------------------------------------------------------------------

// Parse one cron field into a Set of allowed integers over [min,max].
// Supports: *, a, a-b, a,b,c, */n, a-b/n, a/n (a/n => a-max step n).
// Throws on anything malformed or out-of-range or inverted-range.
function parseField(spec, min, max) {
  const out = new Set();
  if (typeof spec !== "string" || spec.length === 0) throw new Error("empty field");
  for (const part of spec.split(",")) {
    if (part.length === 0) throw new Error("empty list element");
    let range = part;
    let step = 1;
    const slash = part.indexOf("/");
    if (slash !== -1) {
      range = part.slice(0, slash);
      const stepStr = part.slice(slash + 1);
      if (!/^\d+$/.test(stepStr)) throw new Error("bad step");
      step = parseInt(stepStr, 10);
      if (step <= 0) throw new Error("bad step");
    }
    let lo, hi;
    if (range === "*") {
      lo = min;
      hi = max;
    } else if (/^\d+$/.test(range)) {
      lo = parseInt(range, 10);
      // "a/n" => from a to max; bare "a" => single value
      hi = slash !== -1 ? max : lo;
    } else {
      const m = /^(\d+)-(\d+)$/.exec(range);
      if (!m) throw new Error("bad range");
      lo = parseInt(m[1], 10);
      hi = parseInt(m[2], 10);
      if (lo > hi) throw new Error("inverted range");
    }
    if (lo < min || hi > max || lo > max || hi < min) throw new Error("out of range");
    for (let v = lo; v <= hi; v += step) out.add(v);
  }
  return out;
}

function parseExpr(expr) {
  if (typeof expr !== "string") throw new Error("not a string");
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("need 5 fields");
  return {
    minute: parseField(fields[0], 0, 59),
    hour: parseField(fields[1], 0, 23),
    dom: parseField(fields[2], 1, 31),
    month: parseField(fields[3], 1, 12),
    dow: parseField(fields[4], 0, 6),
    domStar: fields[2] === "*",
    dowStar: fields[4] === "*",
  };
}

// Vixie/POSIX day rule: if BOTH dom and dow are restricted (neither is "*"),
// a day matches if EITHER matches (union). If exactly one is restricted, only
// that one applies. If both "*", every day.
function dayMatches(p, dt) {
  const dom = dt.getUTCDate();
  const dow = dt.getUTCDay(); // 0=Sun..6=Sat
  const domOk = p.dom.has(dom);
  const dowOk = p.dow.has(dow);
  if (p.domStar && p.dowStar) return true;
  if (p.domStar) return dowOk;
  if (p.dowStar) return domOk;
  return domOk || dowOk;
}

function matches(p, dt) {
  return (
    p.minute.has(dt.getUTCMinutes()) &&
    p.hour.has(dt.getUTCHours()) &&
    p.month.has(dt.getUTCMonth() + 1) &&
    dayMatches(p, dt)
  );
}

const MINUTE = 60 * 1000;

// Oracle: earliest top-of-minute strictly after `after` that matches, scanning
// minute by minute up to maxMinutes. Returns Date or null if none in window.
function oracleNext(p, afterDate, maxMinutes) {
  // Start at the next whole minute strictly after `after`.
  let t = Math.floor(afterDate.getTime() / MINUTE) * MINUTE + MINUTE;
  const limit = t + maxMinutes * MINUTE;
  for (; t < limit; t += MINUTE) {
    const dt = new Date(t);
    if (matches(p, dt)) return dt;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers for invoking the specimen safely.
// ---------------------------------------------------------------------------

const U = (y, mo, d, h, mi) => Date.UTC(y, mo - 1, d, h, mi, 0);

function callNext(nextRun, expr, afterMs) {
  try {
    return { ok: true, value: nextRun(expr, new Date(afterMs)) };
  } catch (e) {
    return { ok: false, value: null };
  }
}

// Expect a specific UTC-ms result. Also cross-validate the pin against the
// oracle so a buggy pin can never silently penalize a correct specimen.
function expectMs(nextRun, expr, afterMs, wantMs) {
  // self-check: oracle must agree with the hand-pin (large window).
  try {
    const p = parseExpr(expr);
    const o = oracleNext(p, new Date(afterMs), 366 * 24 * 60 * 4);
    if (!o || o.getTime() !== wantMs) {
      process.stderr.write(`PIN/ORACLE MISMATCH expr=${expr} pin=${wantMs} oracle=${o && o.getTime()}\n`);
    }
  } catch (e) {
    process.stderr.write(`PIN PARSE ERROR expr=${expr}: ${e.message}\n`);
  }
  const r = callNext(nextRun, expr, afterMs);
  const __ok = r.ok && r.value instanceof Date && r.value.getTime() === wantMs;
  if (!__ok) __failures.push({ kind: "expectNext", expr, afterMs, wantMs, got: r.ok ? (r.value instanceof Date ? r.value.getTime() : String(r.value)) : "threw/invalid" });
  check(__ok);
}

// Expect the specimen to throw.
function expectThrow(nextRun, expr, afterMs) {
  const r = callNext(nextRun, expr, afterMs);
  if (r.ok) __failures.push({ kind: "expectThrow", expr, afterMs, got: r.value instanceof Date ? r.value.getTime() : String(r.value) });
  check(!r.ok);
}

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) for the property battery — deterministic per run.
// ---------------------------------------------------------------------------

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

function randInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

// Build a dense-ish random field so the oracle's scan window stays small.
function randField(rng, min, max) {
  const kind = randInt(rng, 0, 4);
  if (kind === 0) return "*";
  if (kind === 1) return String(randInt(rng, min, max)); // single value
  if (kind === 2) {
    // short list
    const a = randInt(rng, min, max);
    const b = randInt(rng, min, max);
    return [a, b].join(",");
  }
  if (kind === 3) {
    // range
    let a = randInt(rng, min, max);
    let b = randInt(rng, min, max);
    if (a > b) [a, b] = [b, a];
    return `${a}-${b}`;
  }
  // step over star
  const n = randInt(rng, 1, Math.max(1, Math.floor((max - min) / 2)));
  return `*/${n}`;
}

function randExpr(rng) {
  return [
    randField(rng, 0, 59),
    randField(rng, 0, 23),
    randField(rng, 1, 28), // cap dom at 28 so it's always reachable every month
    randField(rng, 1, 12),
    randField(rng, 0, 6),
  ].join(" ");
}

// ---------------------------------------------------------------------------
// Test program.
// ---------------------------------------------------------------------------

function emitZero(exit) {
  process.stdout.write(JSON.stringify({ passed: 0, total: 1, passRate: 0 }) + "\n");
  process.exit(exit);
}

async function main() {
  const implPath = process.argv[2];
  let nextRun;
  try {
    nextRun = (await import(implPath)).nextRun;
  } catch {
    emitZero(1);
    return;
  }
  if (typeof nextRun !== "function") {
    emitZero(1);
    return;
  }

  // === A. Basic happy path (mirrors spec sanity examples) ===
  const JAN1 = U(2024, 1, 1, 0, 0); // Mon
  expectMs(nextRun, "* * * * *", JAN1, U(2024, 1, 1, 0, 1));
  expectMs(nextRun, "0 0 * * *", JAN1, U(2024, 1, 2, 0, 0));
  expectMs(nextRun, "*/15 * * * *", JAN1, U(2024, 1, 1, 0, 15));

  // === B. Strictly-after semantics at minute/hour/day/dow granularity ===
  // after lands EXACTLY on a match -> must advance, never return `after`.
  expectMs(nextRun, "0 0 * * *", U(2024, 1, 1, 0, 0), U(2024, 1, 2, 0, 0)); // midnight -> next day
  expectMs(nextRun, "0 0 * * 1", U(2024, 1, 1, 0, 0), U(2024, 1, 8, 0, 0)); // Mon -> next Mon
  expectMs(nextRun, "30 12 * * *", U(2024, 1, 1, 12, 30), U(2024, 1, 2, 12, 30));
  // after at :30s within a matching minute -> next top-of-minute (seconds zeroed).
  expectMs(nextRun, "* * * * *", U(2024, 1, 1, 0, 0) + 30 * 1000, U(2024, 1, 1, 0, 1));
  // after with nonzero seconds AND ms, still pre-match minute -> the minute itself.
  expectMs(nextRun, "5 * * * *", U(2024, 1, 1, 0, 0) + 42 * 1000 + 123, U(2024, 1, 1, 0, 5));

  // === C. Steps, ranges, lists ===
  expectMs(nextRun, "*/30 * * * *", JAN1, U(2024, 1, 1, 0, 30));
  expectMs(nextRun, "*/20 * * * *", U(2024, 1, 1, 0, 25), U(2024, 1, 1, 0, 40)); // 0,20,40 -> next is 40
  expectMs(nextRun, "10-50/10 * * * *", JAN1, U(2024, 1, 1, 0, 10)); // a-b/n
  // dom step a-b/n: 1,3,5,7. From Jan1 00:00 strictly-after -> Jan 3.
  expectMs(nextRun, "0 0 1-7/2 * *", U(2024, 1, 1, 0, 0), U(2024, 1, 3, 0, 0));
  expectMs(nextRun, "15,45 * * * *", U(2024, 1, 1, 0, 20), U(2024, 1, 1, 0, 45)); // list
  expectMs(nextRun, "0 9-17 * * *", U(2024, 1, 1, 18, 0), U(2024, 1, 2, 9, 0)); // hour range, rolls to next day
  // a/n step form (a..max step n) — standard Vixie, listed in task; oracle-checked.
  expectMs(nextRun, "5/15 * * * *", JAN1, U(2024, 1, 1, 0, 5)); // 5,20,35,50

  // === D. day-of-month / day-of-week UNION (the famous gotcha) ===
  // Both restricted -> OR. "30 4 1,15 * 5": 1st, 15th, AND every Friday.
  // From Jan 1 (Mon) 00:00: first hit is Jan 1 04:30 (dom=1). strictly-after holds (00:00<04:30).
  expectMs(nextRun, "30 4 1,15 * 5", U(2024, 1, 1, 0, 0), U(2024, 1, 1, 4, 30));
  // From Jan 1 05:00 (past the 04:30): next Friday is Jan 5, but the 15th is later;
  // union -> earliest of {Jan15, next Friday Jan5} = Jan 5 04:30.
  expectMs(nextRun, "30 4 1,15 * 5", U(2024, 1, 1, 5, 0), U(2024, 1, 5, 4, 30));
  // dom restricted, dow "*" -> dom only (Fridays irrelevant): 0 0 13 * * .
  expectMs(nextRun, "0 0 13 * *", U(2024, 1, 1, 0, 0), U(2024, 1, 13, 0, 0));
  // dow restricted, dom "*" -> dow only: 0 0 * * 5 -> first Friday after Jan1 = Jan 5.
  expectMs(nextRun, "0 0 * * 5", U(2024, 1, 1, 0, 0), U(2024, 1, 5, 0, 0));
  // Union where dow hits before dom: "0 0 15 * 1" from Jan1 -> Mondays are Jan8,15,22;
  // dom=15 is Jan15. earliest = Jan 8 (Monday) by union.
  expectMs(nextRun, "0 0 15 * 1", U(2024, 1, 1, 0, 0), U(2024, 1, 8, 0, 0));

  // === E. Month rollover, including day 31 in short months ===
  // "0 0 31 * *" from Jan 31 12:00 -> Jan has 31, next with a 31st after Jan is Mar 31
  // (Feb has no 31). strictly after Jan31 -> March 31.
  expectMs(nextRun, "0 0 31 * *", U(2024, 1, 31, 12, 0), U(2024, 3, 31, 0, 0));
  // hour rollover into next day.
  expectMs(nextRun, "0 0 * * *", U(2024, 1, 31, 0, 0), U(2024, 2, 1, 0, 0));
  // month field restricts: only fires in given month.
  expectMs(nextRun, "0 0 1 3 *", U(2024, 1, 1, 0, 0), U(2024, 3, 1, 0, 0));

  // === F. Year rollover ===
  expectMs(nextRun, "0 0 1 1 *", U(2024, 6, 15, 0, 0), U(2025, 1, 1, 0, 0));
  expectMs(nextRun, "59 23 31 12 *", U(2024, 12, 31, 23, 59) + 1000, U(2025, 12, 31, 23, 59));

  // === G. Leap year Feb 29, including multi-year wait from a non-leap year ===
  // From 2023-03-01 (non-leap year, past Feb): next Feb 29 is 2024-02-29.
  expectMs(nextRun, "0 0 29 2 *", U(2023, 3, 1, 0, 0), U(2024, 2, 29, 0, 0));
  // From just after 2024-02-29: next Feb 29 is 2028 (2025/26/27 not leap).
  expectMs(nextRun, "0 0 29 2 *", U(2024, 2, 29, 0, 0), U(2028, 2, 29, 0, 0));
  // Feb 29 strictly-after within the leap day.
  expectMs(nextRun, "30 0 29 2 *", U(2024, 2, 29, 0, 0), U(2024, 2, 29, 0, 30));

  // === H. Malformed expressions / invalid date -> throw ===
  expectThrow(nextRun, "* * * *", JAN1); // 4 fields
  expectThrow(nextRun, "* * * * * *", JAN1); // 6 fields
  expectThrow(nextRun, "", JAN1); // empty
  expectThrow(nextRun, "60 * * * *", JAN1); // minute out of range
  expectThrow(nextRun, "* 24 * * *", JAN1); // hour out of range
  expectThrow(nextRun, "* * 0 * *", JAN1); // dom < 1
  expectThrow(nextRun, "* * 32 * *", JAN1); // dom > 31
  expectThrow(nextRun, "* * * 0 *", JAN1); // month < 1
  expectThrow(nextRun, "* * * 13 *", JAN1); // month > 12
  expectThrow(nextRun, "abc * * * *", JAN1); // non-numeric garbage
  expectThrow(nextRun, "5-2 * * * *", JAN1); // inverted range (spec lists as sealed concern)
  // invalid Date -> throw
  {
    const r = (() => {
      try {
        return { ok: true, value: nextRun("* * * * *", new Date(NaN)) };
      } catch {
        return { ok: false };
      }
    })();
    check(!r.ok);
  }

  // === I. Output hygiene invariants (any expr) ===
  {
    const r = callNext(nextRun, "0 0 * * *", JAN1);
    check(r.ok && r.value instanceof Date); // returns a Date
    check(r.ok && r.value.getUTCSeconds() === 0 && r.value.getUTCMilliseconds() === 0); // seconds+ms zeroed
  }
  // input `after` must not be mutated.
  {
    const before = JAN1;
    const arg = new Date(before);
    try {
      nextRun("*/5 * * * *", arg);
    } catch {
      /* ignore */
    }
    check(arg.getTime() === before);
  }

  // === J. Seeded property battery — randomized exprs cross-checked vs oracle ===
  // Invariants per case (only run when expr parses AND oracle finds a match in window):
  //   - result is a Date strictly after `after`
  //   - result has seconds and ms zeroed
  //   - result actually matches the expression (field-by-field)
  //   - result equals the oracle's earliest match (no skipped earlier minute)
  //   - `after` is not mutated
  const rng = mulberry32(0x5713c0de);
  const SCAN_WINDOW = 366 * 24 * 60; // up to ~1 year of minutes
  let propRun = 0;
  const PROP_TARGET = 200;
  let attempts = 0;
  while (propRun < PROP_TARGET && attempts < PROP_TARGET * 4) {
    attempts += 1;
    const expr = randExpr(rng);
    let p;
    try {
      p = parseExpr(expr);
    } catch {
      continue; // skip exprs our oracle considers malformed
    }
    // random `after` within 2024-2025, on an arbitrary second offset.
    const afterMs =
      U(2024, randInt(rng, 1, 12), randInt(rng, 1, 28), randInt(rng, 0, 23), randInt(rng, 0, 59)) +
      randInt(rng, 0, 59) * 1000;
    const want = oracleNext(p, new Date(afterMs), SCAN_WINDOW);
    if (!want) continue; // sparse expr with no match in window: skip exact check
    propRun += 1;

    const argBefore = afterMs;
    const arg = new Date(afterMs);
    let got;
    try {
      got = nextRun(expr, arg);
    } catch {
      got = null;
    }
    const isDate = got instanceof Date && !Number.isNaN(got.getTime());
    check(isDate); // produced a valid Date
    check(isDate && got.getTime() > afterMs); // strictly after
    check(isDate && got.getUTCSeconds() === 0 && got.getUTCMilliseconds() === 0); // zeroed
    check(isDate && matches(p, got)); // fields actually match
    check(isDate && got.getTime() === want.getTime()); // earliest (oracle-equal)
    check(arg.getTime() === argBefore); // no mutation
  }

  const passRate = total === 0 ? 0 : passed / total;
  process.stderr.write("__SEALED_FAILURES__" + JSON.stringify(__failures.slice(0, 20)) + "\n");
  process.stdout.write(JSON.stringify({ passed, total, passRate }) + "\n");
  process.exit(passRate === 1 ? 0 : 1);
}

main();
