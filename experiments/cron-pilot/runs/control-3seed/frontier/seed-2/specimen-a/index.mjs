// nextRun(expr, after) -> Date
//
// Standard 5-field cron: minute hour day-of-month month day-of-week.
// Returns the earliest firing time strictly after `after`, in UTC, with
// seconds (and milliseconds) zeroed. Pure, Node built-ins only.
//
// Field semantics:
//   minute       0-59
//   hour         0-23
//   day-of-month 1-31
//   month        1-12
//   day-of-week  0-6 (0 = Sunday); 7 is also accepted as Sunday (POSIX).
//
// Supported tokens per field: `*`, single values, lists (`,`), ranges
// (`a-b`), and steps (`*/n`, `a-b/n`, `a/n` meaning a-max/n).
//
// dom/dow interaction (classic Vixie cron rule): if BOTH day-of-month and
// day-of-week are restricted (neither is `*`), a day matches when it matches
// EITHER field (union/OR). If only one is restricted, only that one applies.

const FIELD_RANGES = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day-of-month
  { min: 1, max: 12 }, // month
  { min: 0, max: 7 }, // day-of-week (7 normalized to 0)
];

// Parse a single field into a sorted array of allowed integers (within the
// field's natural range). Throws on any malformed input.
function parseField(raw, fieldIdx) {
  const { min, max } = FIELD_RANGES[fieldIdx];
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`cron: empty field ${fieldIdx}`);
  }

  const allowed = new Set();

  for (const part of raw.split(",")) {
    if (part.length === 0) {
      throw new Error(`cron: empty list element in field ${fieldIdx}`);
    }

    // Split optional step.
    let rangeSpec = part;
    let step = 1;
    const slashIdx = part.indexOf("/");
    if (slashIdx !== -1) {
      rangeSpec = part.slice(0, slashIdx);
      const stepStr = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepStr)) {
        throw new Error(`cron: invalid step "${stepStr}" in field ${fieldIdx}`);
      }
      step = parseInt(stepStr, 10);
      if (step === 0) {
        throw new Error(`cron: step of 0 in field ${fieldIdx}`);
      }
      if (rangeSpec.length === 0) {
        throw new Error(`cron: missing range before step in field ${fieldIdx}`);
      }
    }

    // Determine the [lo, hi] bounds for this part.
    let lo;
    let hi;
    if (rangeSpec === "*") {
      lo = min;
      hi = max;
    } else {
      const dashIdx = rangeSpec.indexOf("-");
      if (dashIdx !== -1) {
        const loStr = rangeSpec.slice(0, dashIdx);
        const hiStr = rangeSpec.slice(dashIdx + 1);
        if (!/^\d+$/.test(loStr) || !/^\d+$/.test(hiStr)) {
          throw new Error(`cron: invalid range "${rangeSpec}" in field ${fieldIdx}`);
        }
        lo = parseInt(loStr, 10);
        hi = parseInt(hiStr, 10);
      } else {
        if (!/^\d+$/.test(rangeSpec)) {
          throw new Error(`cron: invalid value "${rangeSpec}" in field ${fieldIdx}`);
        }
        lo = parseInt(rangeSpec, 10);
        // A bare value with a step (e.g. "5/10") means from value to max.
        hi = slashIdx !== -1 ? max : lo;
      }
    }

    if (lo < min || lo > max || hi < min || hi > max) {
      throw new Error(`cron: value out of range in field ${fieldIdx} (${rangeSpec})`);
    }
    if (lo > hi) {
      throw new Error(`cron: inverted range "${rangeSpec}" in field ${fieldIdx}`);
    }

    for (let v = lo; v <= hi; v += step) {
      // Normalize day-of-week 7 -> 0 (Sunday).
      const value = fieldIdx === 4 && v === 7 ? 0 : v;
      allowed.add(value);
    }
  }

  const list = Array.from(allowed).sort((a, b) => a - b);
  if (list.length === 0) {
    throw new Error(`cron: field ${fieldIdx} matches nothing`);
  }
  return list;
}

function parseExpr(expr) {
  if (typeof expr !== "string") {
    throw new Error("cron: expression must be a string");
  }
  const fields = expr.trim().split(/\s+/);
  if (expr.trim().length === 0 || fields.length !== 5) {
    throw new Error(`cron: expected 5 fields, got ${fields.length}`);
  }

  const minutes = parseField(fields[0], 0);
  const hours = parseField(fields[1], 1);
  const domField = fields[2];
  const monthField = fields[3];
  const dowField = fields[4];
  const days = parseField(domField, 2);
  const months = parseField(monthField, 3);
  const dows = parseField(dowField, 4);

  // A field is "restricted" if it does not begin with `*`. This is the
  // canonical Vixie-cron rule: `0 0 1-31 * 1` (dom covers all days but is a
  // literal range) is treated as restricted, so it unions with dow and fires
  // every day; `*/2` is treated as a star (unrestricted). Deciding by the
  // leading token rather than by the resulting set matches real cron.
  const domRestricted = !domField.trim().startsWith("*");
  const dowRestricted = !dowField.trim().startsWith("*");

  return {
    minutes: new Set(minutes),
    hours: new Set(hours),
    days: new Set(days),
    months: new Set(months),
    dows: new Set(dows),
    domRestricted,
    dowRestricted,
  };
}

// Does this date (UTC) satisfy the day constraints?
function dayMatches(parsed, year, month0, dom) {
  const date = new Date(Date.UTC(year, month0, dom, 0, 0, 0, 0));
  const dow = date.getUTCDay(); // 0=Sunday..6=Saturday

  const domHit = parsed.days.has(dom);
  const dowHit = parsed.dows.has(dow);

  if (parsed.domRestricted && parsed.dowRestricted) {
    return domHit || dowHit; // union
  }
  if (parsed.domRestricted) {
    return domHit;
  }
  if (parsed.dowRestricted) {
    return dowHit;
  }
  return true; // neither restricted: every day
}

export function nextRun(expr, after) {
  const parsed = parseExpr(expr);

  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("cron: invalid `after` date");
  }

  // Start strictly after `after`: advance to the next minute boundary.
  // Truncate to the minute, then add one minute.
  let t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t = new Date(t.getTime() + 60_000);

  // Bounded search: cron can legitimately repeat at most every 4 years
  // (Feb 29 + day-of-week alignment). 8 years gives ample headroom while
  // guaranteeing termination on impossible-but-valid schedules.
  const limit = new Date(t.getTime());
  limit.setUTCFullYear(limit.getUTCFullYear() + 8);
  const limitMs = limit.getTime();

  while (t.getTime() <= limitMs) {
    const year = t.getUTCFullYear();
    const month0 = t.getUTCMonth();
    const month = month0 + 1;
    const dom = t.getUTCDate();
    const hour = t.getUTCHours();
    const minute = t.getUTCMinutes();

    // Month: jump to start of next valid month if mismatched.
    if (!parsed.months.has(month)) {
      const nextMonth0 = month0 + 1;
      t = new Date(Date.UTC(year, nextMonth0, 1, 0, 0, 0, 0));
      continue;
    }

    // Day: if the day doesn't match, advance to the next day.
    if (!dayMatches(parsed, year, month0, dom)) {
      t = new Date(Date.UTC(year, month0, dom + 1, 0, 0, 0, 0));
      continue;
    }

    // Hour.
    if (!parsed.hours.has(hour)) {
      t = new Date(Date.UTC(year, month0, dom, hour + 1, 0, 0, 0));
      continue;
    }

    // Minute.
    if (!parsed.minutes.has(minute)) {
      t = new Date(Date.UTC(year, month0, dom, hour, minute + 1, 0, 0));
      continue;
    }

    return t;
  }

  throw new Error("cron: no matching time found within search horizon");
}
