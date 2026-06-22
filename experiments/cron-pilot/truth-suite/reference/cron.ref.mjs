// Correct reference implementation of the `nextRun` contract (UTC, minute granularity).
// Authored independently of the public/sealed suites — proves the TRUTH suite is satisfiable.
// Node built-ins only. Strategy: parse the 5 fields into integer sets, then step minute-by-
// minute from (floor(after to minute)+1min) until all fields match. Slow but obviously correct.

function parseField(raw, lo, hi) {
  const set = new Set();
  for (const part of raw.split(",")) {
    if (part === "") throw new Error("empty field part");
    let rangePart = part;
    let step = 1;
    const slash = part.split("/");
    if (slash.length === 2) {
      rangePart = slash[0];
      step = Number(slash[1]);
      if (!Number.isInteger(step) || step <= 0) throw new Error("bad step");
    } else if (slash.length > 2) {
      throw new Error("bad step syntax");
    }
    let a;
    let b;
    if (rangePart === "*") {
      a = lo;
      b = hi;
    } else if (rangePart.includes("-")) {
      const [x, y] = rangePart.split("-");
      a = Number(x);
      b = Number(y);
    } else {
      a = Number(rangePart);
      // "a/step" means a..hi step; bare "a" means just a
      b = slash.length === 2 ? hi : a;
    }
    if (!Number.isInteger(a) || !Number.isInteger(b)) throw new Error("non-integer");
    if (a < lo || b > hi || a > b) throw new Error("out of range");
    for (let v = a; v <= b; v += step) set.add(v);
  }
  return set;
}

function parse(expr) {
  if (typeof expr !== "string") throw new Error("expr must be string");
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("expr must have 5 fields");
  const [minF, hourF, domF, monF, dowF] = fields;
  const min = parseField(minF, 0, 59);
  const hour = parseField(hourF, 0, 23);
  const dom = parseField(domF, 1, 31);
  const mon = parseField(monF, 1, 12);
  const dow = parseField(dowF, 0, 7);
  if (dow.has(7)) {
    dow.add(0);
    dow.delete(7);
  }
  return { min, hour, dom, mon, dow, domR: domF !== "*", dowR: dowF !== "*" };
}

function dayMatches(f, dom, dow) {
  // Standard cron OR-semantics: if BOTH day-of-month and day-of-week are restricted,
  // a day matches when EITHER matches. If only one is restricted, only that one applies.
  if (f.domR && f.dowR) return f.dom.has(dom) || f.dow.has(dow);
  if (f.domR) return f.dom.has(dom);
  if (f.dowR) return f.dow.has(dow);
  return true;
}

export function nextRun(expr, after) {
  const f = parse(expr);
  if (!(after instanceof Date) || Number.isNaN(after.getTime())) throw new Error("after must be a valid Date");
  let t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t = new Date(t.getTime() + 60000); // strictly after `after`, on a minute boundary
  // Search horizon: 5 years of minutes. Impossible expressions (e.g. Feb 30) exhaust it.
  const LIMIT = 5 * 366 * 24 * 60;
  for (let i = 0; i < LIMIT; i++) {
    if (
      f.min.has(t.getUTCMinutes()) &&
      f.hour.has(t.getUTCHours()) &&
      f.mon.has(t.getUTCMonth() + 1) &&
      dayMatches(f, t.getUTCDate(), t.getUTCDay())
    ) {
      return t;
    }
    t = new Date(t.getTime() + 60000);
  }
  throw new Error("no matching time within horizon");
}
