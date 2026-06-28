// nextRun(expr, after) — next firing time of a standard 5-field cron expression,
// strictly after `after`. UTC-only, deterministic, pure. Node built-ins only.

const FIELD_BOUNDS = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day-of-month
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 },  // day-of-week (0=Sunday)
];

// Parse a single cron field into a sorted, de-duplicated array of allowed values.
// Also reports whether the field is literally "*" (used for DOM/DOW OR logic).
function parseField(raw, min, max) {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Invalid cron field: ${raw}`);
  }

  const allowed = new Set();

  for (const part of raw.split(",")) {
    if (part.length === 0) throw new Error(`Invalid cron field: ${raw}`);

    // Split off an optional step (e.g. "a-b/n", "*/n", "5/n").
    const slashIdx = part.indexOf("/");
    let rangeSpec = part;
    let step = 1;

    if (slashIdx !== -1) {
      rangeSpec = part.slice(0, slashIdx);
      const stepStr = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepStr)) throw new Error(`Invalid step: ${part}`);
      step = parseInt(stepStr, 10);
      if (step < 1) throw new Error(`Invalid step: ${part}`);
    }

    let lo;
    let hi;

    if (rangeSpec === "*") {
      lo = min;
      hi = max;
    } else if (rangeSpec.indexOf("-") !== -1) {
      const dashIdx = rangeSpec.indexOf("-");
      const loStr = rangeSpec.slice(0, dashIdx);
      const hiStr = rangeSpec.slice(dashIdx + 1);
      if (!/^\d+$/.test(loStr) || !/^\d+$/.test(hiStr)) {
        throw new Error(`Invalid range: ${part}`);
      }
      lo = parseInt(loStr, 10);
      hi = parseInt(hiStr, 10);
    } else {
      if (!/^\d+$/.test(rangeSpec)) throw new Error(`Invalid value: ${part}`);
      lo = parseInt(rangeSpec, 10);
      // A bare number with a step (e.g. "5/15") ranges from the number to max.
      hi = slashIdx !== -1 ? max : lo;
    }

    if (lo < min || hi > max || lo > hi) {
      throw new Error(`Field value out of range: ${part}`);
    }

    for (let v = lo; v <= hi; v += step) allowed.add(v);
  }

  if (allowed.size === 0) throw new Error(`Empty cron field: ${raw}`);

  return {
    values: new Set(allowed),
    isStar: raw === "*",
  };
}

function parseExpr(expr) {
  if (typeof expr !== "string") throw new Error("Cron expression must be a string");
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5 || (fields.length === 1 && fields[0] === "")) {
    throw new Error(`Cron expression must have exactly 5 fields: "${expr}"`);
  }
  if (fields.some((f) => f === "")) {
    throw new Error(`Malformed cron expression: "${expr}"`);
  }

  const [minute, hour, dom, month, dow] = fields.map((f, i) =>
    parseField(f, FIELD_BOUNDS[i].min, FIELD_BOUNDS[i].max)
  );

  return { minute, hour, dom, month, dow };
}

// Does the given UTC day satisfy the DOM/DOW constraints?
// Vixie OR-semantics: if both DOM and DOW are restricted (not "*"), the day
// matches when EITHER matches. Otherwise only the restricted one applies.
function dayMatches(parsed, year, monthIdx /* 0-11 */, dayOfMonth) {
  const cronMonth = monthIdx + 1;
  if (!parsed.month.values.has(cronMonth)) return false;

  const weekday = new Date(Date.UTC(year, monthIdx, dayOfMonth)).getUTCDay(); // 0=Sun

  const domRestricted = !parsed.dom.isStar;
  const dowRestricted = !parsed.dow.isStar;

  const domHit = parsed.dom.values.has(dayOfMonth);
  const dowHit = parsed.dow.values.has(weekday);

  if (domRestricted && dowRestricted) return domHit || dowHit;
  if (domRestricted) return domHit;
  if (dowRestricted) return dowHit;
  return true; // both "*"
}

export function nextRun(expr, after) {
  const parsed = parseExpr(expr);

  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("`after` must be a valid Date");
  }

  // Candidate floor: top of the minute strictly after `after`.
  // Floor `after` to the minute, then add one minute -> strict-after for free.
  let year = after.getUTCFullYear();
  let monthIdx = after.getUTCMonth();
  let day = after.getUTCDate();
  let hour = after.getUTCHours();
  let minute = after.getUTCMinutes();

  // Step to the next minute boundary (zero seconds/ms implicitly via reconstruction).
  let cursor = Date.UTC(year, monthIdx, day, hour, minute) + 60_000;

  const minuteVals = [...parsed.minute.values].sort((a, b) => a - b);
  const hourVals = [...parsed.hour.values].sort((a, b) => a - b);

  // Cap the search at ~8 years of days to guarantee termination on
  // never-firing expressions (e.g. "0 0 31 2 *").
  const MAX_DAYS = 366 * 8;
  let daysScanned = 0;

  // Day-outer loop: advance whole days; within a matching day scan hour/minute.
  // Start from the cursor's day.
  let cy = new Date(cursor).getUTCFullYear();
  let cm = new Date(cursor).getUTCMonth();
  let cd = new Date(cursor).getUTCDate();

  while (daysScanned <= MAX_DAYS) {
    if (dayMatches(parsed, cy, cm, cd)) {
      // Within this day, find the first hour:minute slot whose epoch > after.
      for (const h of hourVals) {
        for (const m of minuteVals) {
          const t = Date.UTC(cy, cm, cd, h, m);
          if (t >= cursor) {
            return new Date(t);
          }
        }
      }
    }

    // Advance to the start of the next day; cursor only constrains the first day.
    const nextDay = Date.UTC(cy, cm, cd) + 86_400_000;
    const nd = new Date(nextDay);
    cy = nd.getUTCFullYear();
    cm = nd.getUTCMonth();
    cd = nd.getUTCDate();
    // After the first day, any matching hour/minute qualifies (cursor is in the past).
    cursor = nextDay;
    daysScanned += 1;
  }

  throw new Error(`No matching time found within search horizon for: "${expr}"`);
}
