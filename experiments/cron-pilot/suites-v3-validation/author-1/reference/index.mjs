// Reference implementation of nextRun(expr, after).
// Standard 5-field cron, UTC, Node built-ins only. Deterministic and pure.

const FIELD_BOUNDS = [
  [0, 59], // minute
  [0, 23], // hour
  [1, 31], // day-of-month
  [1, 12], // month
  [0, 6], // day-of-week (0 = Sunday)
];

// Parse one field into a sorted set (array of allowed integers) within bounds.
function parseField(raw, min, max) {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`empty field`);
  }
  const result = new Set();
  const parts = raw.split(",");
  if (parts.length === 0) throw new Error(`empty field`);

  for (const part of parts) {
    if (part.length === 0) throw new Error(`empty list element in "${raw}"`);

    let rangePart = part;
    let step = 1;

    // step syntax: <base>/<n>
    if (part.includes("/")) {
      const segs = part.split("/");
      if (segs.length !== 2) throw new Error(`bad step "${part}"`);
      rangePart = segs[0];
      const stepStr = segs[1];
      if (!/^\d+$/.test(stepStr)) throw new Error(`bad step value "${stepStr}"`);
      step = parseInt(stepStr, 10);
      if (step <= 0) throw new Error(`step must be > 0`);
    }

    let lo;
    let hi;

    if (rangePart === "*") {
      lo = min;
      hi = max;
    } else if (rangePart.includes("-")) {
      const ends = rangePart.split("-");
      if (ends.length !== 2) throw new Error(`bad range "${rangePart}"`);
      if (!/^\d+$/.test(ends[0]) || !/^\d+$/.test(ends[1])) {
        throw new Error(`non-numeric range "${rangePart}"`);
      }
      lo = parseInt(ends[0], 10);
      hi = parseInt(ends[1], 10);
      if (lo > hi) throw new Error(`reversed range "${rangePart}"`);
    } else {
      if (!/^\d+$/.test(rangePart)) {
        throw new Error(`non-numeric token "${rangePart}"`);
      }
      lo = parseInt(rangePart, 10);
      // A bare number with a step (e.g. "5/15") means "from 5 to max step n".
      hi = part.includes("/") ? max : lo;
    }

    if (lo < min || lo > max || hi < min || hi > max) {
      throw new Error(`value out of range in "${part}" (bounds ${min}-${max})`);
    }

    for (let v = lo; v <= hi; v += step) {
      result.add(v);
    }
  }

  if (result.size === 0) throw new Error(`field produced no values: "${raw}"`);
  return result;
}

export function nextRun(expr, after) {
  if (typeof expr !== "string") throw new Error("expr must be a string");
  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("invalid date");
  }

  const tokens = expr.trim().split(/\s+/);
  if (tokens.length !== 5) {
    throw new Error(`expected 5 fields, got ${tokens.length}`);
  }

  const minutes = parseField(tokens[0], ...FIELD_BOUNDS[0]);
  const hours = parseField(tokens[1], ...FIELD_BOUNDS[1]);
  const doms = parseField(tokens[2], ...FIELD_BOUNDS[2]);
  const months = parseField(tokens[3], ...FIELD_BOUNDS[3]);
  const dows = parseField(tokens[4], ...FIELD_BOUNDS[4]);

  const domRestricted = tokens[2] !== "*";
  const dowRestricted = tokens[4] !== "*";

  function dayMatches(date) {
    const dom = date.getUTCDate();
    const dow = date.getUTCDay(); // 0 = Sunday
    if (domRestricted && dowRestricted) {
      // Vixie cron OR semantics when both are restricted.
      return doms.has(dom) || dows.has(dow);
    }
    if (domRestricted) return doms.has(dom);
    if (dowRestricted) return dows.has(dow);
    return true;
  }

  // Start strictly after `after`, at the top of the next minute.
  const t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t.setUTCMinutes(t.getUTCMinutes() + 1);

  // Generous cap: ~9 years of minutes covers century leap-year skips.
  const CAP = 9 * 366 * 24 * 60;
  for (let i = 0; i < CAP; i++) {
    if (
      months.has(t.getUTCMonth() + 1) &&
      dayMatches(t) &&
      hours.has(t.getUTCHours()) &&
      minutes.has(t.getUTCMinutes())
    ) {
      return new Date(t.getTime());
    }
    t.setUTCMinutes(t.getUTCMinutes() + 1);
  }

  throw new Error("no matching time found within search window");
}
