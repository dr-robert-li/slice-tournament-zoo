// nextRun(expr, after) — standard 5-field cron next-firing-time engine (UTC).
//
// Strategy: field-carry / jump. We test candidate times field-by-field from the
// most significant (month) down to minute; whenever a field doesn't match, we
// advance that field to its next valid value and reset all less-significant
// fields to their minimum, then re-loop. This converges far faster than a naive
// minute-by-minute scan while staying exact.
//
// Standard cron semantics:
//   minute hour day-of-month month day-of-week
//   * lists (,) ranges (a-b) steps (*/n, a-b/n)
//   dow 0-6 with 0=Sunday; POSIX 7 also == Sunday
//   dom/dow: when BOTH are restricted (not '*'), a day matches if EITHER matches.
//   Seconds are zeroed; result is strictly after `after`.

const FIELD_SPECS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "dom", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "dow", min: 0, max: 6 }, // 7 normalized to 0
];

// Optional textual aliases (case-insensitive). Common cron implementations
// accept these; including them is harmless and more correct.
const MONTH_NAMES = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const DOW_NAMES = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function fail(msg) {
  throw new Error("Invalid cron expression: " + msg);
}

// Parse one token (an element of a comma list) for a given field into a set of
// integers. Returns a Set of allowed values within [spec.min, spec.max].
function parseToken(token, spec, fieldName) {
  if (token === "") fail(`empty term in ${fieldName} field`);

  // Split optional step: "<range>/<step>"
  let rangePart = token;
  let step = 1;
  const slashIdx = token.indexOf("/");
  if (slashIdx !== -1) {
    rangePart = token.slice(0, slashIdx);
    const stepStr = token.slice(slashIdx + 1);
    if (token.indexOf("/", slashIdx + 1) !== -1) {
      fail(`multiple '/' in term '${token}' of ${fieldName} field`);
    }
    if (!/^\d+$/.test(stepStr)) fail(`bad step '${stepStr}' in ${fieldName} field`);
    step = parseInt(stepStr, 10);
    if (step === 0) fail(`step of zero in ${fieldName} field`);
  }

  let lo;
  let hi;
  let rangeExplicit = false;

  if (rangePart === "*") {
    lo = spec.min;
    hi = spec.max;
  } else {
    // Could be "a" or "a-b".
    const dashIdx = rangePart.indexOf("-");
    if (dashIdx === -1) {
      const v = resolveValue(rangePart, spec, fieldName);
      if (slashIdx !== -1) {
        // "a/n" means from a to field max, stepping by n.
        lo = v;
        hi = spec.max;
      } else {
        lo = v;
        hi = v;
      }
    } else {
      rangeExplicit = true;
      const loStr = rangePart.slice(0, dashIdx);
      const hiStr = rangePart.slice(dashIdx + 1);
      if (hiStr.indexOf("-") !== -1) {
        fail(`malformed range '${rangePart}' in ${fieldName} field`);
      }
      lo = resolveValue(loStr, spec, fieldName);
      hi = resolveValue(hiStr, spec, fieldName);
    }
  }

  if (lo < spec.min || lo > spec.max || hi < spec.min || hi > spec.max) {
    fail(`value out of range in ${fieldName} field (got ${lo}-${hi}, allowed ${spec.min}-${spec.max})`);
  }
  if (rangeExplicit && lo > hi) {
    fail(`inverted range '${lo}-${hi}' in ${fieldName} field`);
  }

  const out = new Set();
  for (let v = lo; v <= hi; v += step) {
    out.add(v);
  }
  return out;
}

// Resolve a single literal (numeric or textual alias) to an integer.
function resolveValue(str, spec, fieldName) {
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }
  const lower = str.toLowerCase();
  if (spec.name === "month" && MONTH_NAMES[lower] !== undefined) {
    return MONTH_NAMES[lower];
  }
  if (spec.name === "dow" && DOW_NAMES[lower] !== undefined) {
    return DOW_NAMES[lower];
  }
  fail(`unrecognized value '${str}' in ${fieldName} field`);
  return 0; // unreachable
}

// Parse a whole field (comma-separated terms) into a sorted ascending array of
// allowed integers, plus a flag indicating whether it is restricted (not '*').
function parseField(raw, spec) {
  const restricted = raw !== "*";
  const set = new Set();
  const terms = raw.split(",");
  for (const term of terms) {
    for (const v of parseToken(term, spec, spec.name)) {
      set.add(v);
    }
  }

  // Normalize dow: 7 -> 0 (Sunday). parseToken already restricts to spec.max=6,
  // so we must accept 7 specially. Handle that here by re-parsing dow with a
  // wider max. (See parse() which adjusts spec for dow.)

  if (set.size === 0) fail(`no values in ${spec.name} field`);
  return { values: Array.from(set).sort((a, b) => a - b), restricted };
}

function parse(expr) {
  if (typeof expr !== "string") fail("expression must be a string");
  const trimmed = expr.trim();
  if (trimmed === "") fail("empty expression");
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    fail(`expected 5 fields, got ${parts.length}`);
  }

  const fields = {};
  for (let i = 0; i < 5; i += 1) {
    const spec = FIELD_SPECS[i];
    // For dow, allow 0-7 during parsing, then fold 7 into 0.
    const effectiveSpec = spec.name === "dow"
      ? { name: "dow", min: 0, max: 7 }
      : spec;
    const parsed = parseField(parts[i], effectiveSpec);

    if (spec.name === "dow") {
      // Fold 7 -> 0.
      const folded = new Set();
      for (const v of parsed.values) folded.add(v === 7 ? 0 : v);
      parsed.values = Array.from(folded).sort((a, b) => a - b);
    }
    fields[spec.name] = parsed;
  }
  return fields;
}

// Days in a given month (1-12) of a given full year, UTC, leap-year aware.
function daysInMonth(year, month) {
  // month is 1-12. Date.UTC with day 0 of next month gives last day.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dowMatches(fields, year, month, day) {
  // day-of-week of the given date, 0=Sunday.
  const wd = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return fields.dow.values.includes(wd);
}

function domMatches(fields, year, month, day) {
  return fields.dom.values.includes(day);
}

// Does a given calendar day satisfy the dom/dow constraints?
// - both restricted: OR (either matches)
// - only one restricted: that one must match
// - neither restricted: any day
function dayMatches(fields, year, month, day) {
  const domR = fields.dom.restricted;
  const dowR = fields.dow.restricted;
  if (domR && dowR) {
    return domMatches(fields, year, month, day) || dowMatches(fields, year, month, day);
  }
  if (domR) {
    return domMatches(fields, year, month, day);
  }
  if (dowR) {
    return dowMatches(fields, year, month, day);
  }
  return true;
}

export function nextRun(expr, after) {
  const fields = parse(expr);

  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("Invalid date: 'after' must be a valid Date");
  }

  // Start strictly after `after`, at the next minute boundary (seconds zeroed).
  let year = after.getUTCFullYear();
  let month = after.getUTCMonth() + 1; // 1-12
  let day = after.getUTCDate();
  let hour = after.getUTCHours();
  let minute = after.getUTCMinutes();

  // Advance to the next whole minute strictly after `after`. Cron fires at the
  // top of a minute; since we need strictly-after and seconds are zeroed, the
  // earliest candidate is the minute following `after` (regardless of whether
  // `after` had nonzero seconds — the same minute as `after` is not strictly
  // after when seconds/ms are zero, and is partially past otherwise).
  minute += 1;
  // Normalize the carry from the +1.
  ({ year, month, day, hour, minute } = normalizeUp(year, month, day, hour, minute));

  // Bounded search: cron schedules repeat within a few years at most (the worst
  // realistic case is Feb 29, which recurs at least every 8 years). Cap the
  // year search well beyond that to guarantee termination without hanging.
  const MAX_YEAR = year + 8;

  // Field-carry / jump loop.
  // We resolve fields from most-significant to least, jumping forward when a
  // field doesn't match and resetting lower fields.
  while (true) {
    if (year > MAX_YEAR) {
      throw new Error("No matching time found within bounded search horizon");
    }

    // MONTH
    const nextMonth = nextAllowed(fields.month.values, month);
    if (nextMonth === null) {
      // No allowed month >= current month this year; roll to next year.
      year += 1;
      month = fields.month.values[0];
      day = 1;
      hour = 0;
      minute = 0;
      continue;
    }
    if (nextMonth !== month) {
      month = nextMonth;
      day = 1;
      hour = 0;
      minute = 0;
      // Re-evaluate from DAY with reset lowers (month is now valid).
    }

    // DAY — must satisfy dom/dow union AND exist in the month.
    const dim = daysInMonth(year, month);
    let foundDay = false;
    for (let d = day; d <= dim; d += 1) {
      if (dayMatches(fields, year, month, d)) {
        if (d !== day) {
          // moved to a later day; reset hour/minute
          hour = 0;
          minute = 0;
        }
        day = d;
        foundDay = true;
        break;
      }
    }
    if (!foundDay) {
      // No valid day remaining in this month; advance to next month.
      month += 1;
      day = 1;
      hour = 0;
      minute = 0;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      continue;
    }

    // HOUR
    const nextHour = nextAllowed(fields.hour.values, hour);
    if (nextHour === null) {
      // advance day
      day += 1;
      hour = 0;
      minute = 0;
      // day overflow handled by re-loop (day may exceed dim -> caught above)
      if (day > dim) {
        month += 1;
        day = 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
      continue;
    }
    if (nextHour !== hour) {
      hour = nextHour;
      minute = 0;
    }

    // MINUTE
    const nextMinute = nextAllowed(fields.minute.values, minute);
    if (nextMinute === null) {
      hour += 1;
      minute = 0;
      if (hour > 23) {
        hour = 0;
        day += 1;
        if (day > dim) {
          month += 1;
          day = 1;
          if (month > 12) {
            month = 1;
            year += 1;
          }
        }
      }
      continue;
    }
    minute = nextMinute;

    // All fields matched.
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  }
}

// Return the smallest value in sorted `values` that is >= `current`, or null if
// none (caller must carry into the next higher field).
function nextAllowed(values, current) {
  for (let i = 0; i < values.length; i += 1) {
    if (values[i] >= current) return values[i];
  }
  return null;
}

// Normalize a minute carry-up (only minute may exceed its max by the +1 step).
function normalizeUp(year, month, day, hour, minute) {
  if (minute > 59) {
    minute -= 60;
    hour += 1;
  }
  if (hour > 23) {
    hour -= 24;
    day += 1;
  }
  let dim = daysInMonth(year, month);
  if (day > dim) {
    day -= dim;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    // After month change, day could still be off only if it was way over; for a
    // single +1 carry this won't happen, but guard anyway.
    dim = daysInMonth(year, month);
    if (day > dim) {
      day = 1; // defensive; not reachable for single-minute increments
    }
  }
  return { year, month, day, hour, minute };
}
