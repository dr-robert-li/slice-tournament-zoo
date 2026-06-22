// nextRun(expr, after) -> Date
//
// Standard 5-field cron: minute hour day-of-month month day-of-week.
// Returns the earliest firing time strictly after `after`, in UTC, seconds zeroed.
// Pure, Node built-ins only. Throws on malformed expression or invalid date.
//
// Strategy: parse each field into a sorted set of allowed integer values, then
// perform a bounded field-by-field forward search (carry on overflow), applying
// the standard cron day-of-month / day-of-week union rule.

const FIELDS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "dom", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "dow", min: 0, max: 6 }, // 0 = Sunday; 7 is normalized to 0
];

// Parse a single cron field into a sorted array of unique allowed values.
function parseField(raw, spec, restrictedOut) {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`empty field for ${spec.name}`);
  }
  const allowed = new Set();
  let restricted = false; // true if this field constrains beyond "*"

  for (const part of raw.split(",")) {
    if (part.length === 0) {
      throw new Error(`empty list element in ${spec.name}: "${raw}"`);
    }

    // Split off an optional step: "<range>/<step>"
    let rangePart = part;
    let step = 1;
    const slash = part.indexOf("/");
    if (slash !== -1) {
      rangePart = part.slice(0, slash);
      const stepStr = part.slice(slash + 1);
      if (!/^\d+$/.test(stepStr)) {
        throw new Error(`invalid step in ${spec.name}: "${part}"`);
      }
      step = Number(stepStr);
      if (step <= 0) {
        throw new Error(`step must be > 0 in ${spec.name}: "${part}"`);
      }
      if (rangePart.length === 0) {
        throw new Error(`missing range before step in ${spec.name}: "${part}"`);
      }
    }

    let lo;
    let hi;
    let wildcard = false;

    if (rangePart === "*") {
      lo = spec.min;
      hi = spec.max;
      wildcard = true;
    } else {
      const dash = rangePart.indexOf("-");
      if (dash !== -1) {
        const loStr = rangePart.slice(0, dash);
        const hiStr = rangePart.slice(dash + 1);
        if (!/^\d+$/.test(loStr) || !/^\d+$/.test(hiStr)) {
          throw new Error(`invalid range in ${spec.name}: "${part}"`);
        }
        lo = Number(loStr);
        hi = Number(hiStr);
        restricted = true;
      } else {
        if (!/^\d+$/.test(rangePart)) {
          throw new Error(`invalid value in ${spec.name}: "${part}"`);
        }
        lo = Number(rangePart);
        // A bare single value with a step (e.g. "5/15") means "from 5 to max".
        hi = slash !== -1 ? spec.max : lo;
        restricted = true;
      }
    }

    // Day-of-week accepts POSIX 7 as an alias for Sunday (0). Validate against
    // an extended ceiling of 7, but map each expanded value 7 -> 0 so that
    // ranges touching 7 (e.g. "6-7", "0-7") expand correctly rather than
    // collapsing or inverting.
    const ceiling = spec.name === "dow" ? 7 : spec.max;

    if (lo < spec.min || lo > ceiling || hi < spec.min || hi > ceiling) {
      throw new Error(`value out of range in ${spec.name}: "${part}"`);
    }
    if (lo > hi) {
      throw new Error(`inverted range in ${spec.name}: "${part}"`);
    }

    for (let v = lo; v <= hi; v += step) {
      allowed.add(spec.name === "dow" && v === 7 ? 0 : v);
    }
    // Wildcard alone (no step) does not restrict; with a step it does.
    if (wildcard && step !== 1) {
      restricted = true;
    }
  }

  // Ensure dow Sunday duplicates collapse (0 and 7 already mapped to 0).
  const values = [...allowed].sort((a, b) => a - b);
  if (values.length === 0) {
    throw new Error(`no values produced for ${spec.name}: "${raw}"`);
  }
  restrictedOut[spec.name] = restricted;
  return values;
}

function parseExpr(expr) {
  if (typeof expr !== "string") {
    throw new Error("expression must be a string");
  }
  const trimmed = expr.trim();
  if (trimmed.length === 0) {
    throw new Error("empty expression");
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`expected 5 fields, got ${parts.length}`);
  }

  const restricted = {};
  const fields = {};
  for (let i = 0; i < 5; i += 1) {
    const spec = FIELDS[i];
    fields[spec.name] = parseField(parts[i], spec, restricted);
  }

  return {
    minute: new Set(fields.minute),
    hour: new Set(fields.hour),
    dom: new Set(fields.dom),
    month: new Set(fields.month),
    dow: new Set(fields.dow),
    domRestricted: restricted.dom,
    dowRestricted: restricted.dow,
  };
}

function daysInMonth(year, month /* 1-12 */) {
  // Day 0 of next month == last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Does the given date (year, month 1-12, day) satisfy the dom/dow union rule?
function dayMatches(parsed, year, month, day) {
  const domOk = parsed.dom.has(day);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun
  const dowOk = parsed.dow.has(weekday);

  if (parsed.domRestricted && parsed.dowRestricted) {
    // Both restricted: standard cron OR semantics.
    return domOk || dowOk;
  }
  if (parsed.domRestricted) return domOk;
  if (parsed.dowRestricted) return dowOk;
  return true; // neither restricted -> every day
}

export function nextRun(expr, after) {
  const parsed = parseExpr(expr);

  if (!(after instanceof Date)) {
    throw new Error("after must be a Date");
  }
  const afterMs = after.getTime();
  if (!Number.isFinite(afterMs)) {
    throw new Error("after is an invalid Date");
  }

  // Start strictly after `after`: advance to the next whole minute.
  // Zero seconds/millis, then step to the first candidate minute > after.
  let year = after.getUTCFullYear();
  let month = after.getUTCMonth() + 1; // 1-12
  let day = after.getUTCDate();
  let hour = after.getUTCHours();
  let minute = after.getUTCMinutes();

  // Move to the next minute boundary strictly after `after`. Because any time
  // within minute M (sec/ms > 0 or == 0) — "strictly after" means the candidate
  // minute must be > the minute containing `after` if we want > after at second 0.
  // We always advance at least one minute so seconds/ms are dropped and we are
  // strictly later than `after`.
  minute += 1;

  // Normalize the minute overflow before searching.
  const normalize = () => {
    if (minute > 59) {
      minute -= 60;
      hour += 1;
    }
    if (hour > 23) {
      hour -= 24;
      day += 1;
    }
    // Day/month/year overflow handled inside the day search loop.
  };
  normalize();

  // Bounded search: a valid cron schedule fires at least once every few years.
  // Cap iterations to avoid hanging on impossible-but-valid combos (e.g. Feb 30).
  // A real cron can legitimately have no firing within years only for impossible
  // date combos like "0 0 30 2 *"; we bound and throw if exceeded.
  const MAX_YEARS = 8;
  const yearLimit = year + MAX_YEARS;

  // Iterate over candidate dates/times moving forward.
  while (true) {
    if (year > yearLimit) {
      throw new Error("no matching time found within bounded search window");
    }

    // --- Month ---
    if (!parsed.month.has(month)) {
      // Advance to the next allowed month.
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      day = 1;
      hour = 0;
      minute = 0;
      continue;
    }

    // --- Day (dom/dow union) ---
    const dim = daysInMonth(year, month);
    if (day > dim || !dayMatches(parsed, year, month, day)) {
      day += 1;
      hour = 0;
      minute = 0;
      if (day > dim) {
        day = 1;
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
      continue;
    }

    // --- Hour ---
    if (!parsed.hour.has(hour)) {
      hour += 1;
      minute = 0;
      if (hour > 23) {
        hour = 0;
        day += 1;
        // re-validate day on next loop pass (handles month rollover there)
        if (day > dim) {
          day = 1;
          month += 1;
          if (month > 12) {
            month = 1;
            year += 1;
          }
        }
      }
      continue;
    }

    // --- Minute ---
    if (!parsed.minute.has(minute)) {
      minute += 1;
      if (minute > 59) {
        minute = 0;
        hour += 1;
        if (hour > 23) {
          hour = 0;
          day += 1;
          if (day > dim) {
            day = 1;
            month += 1;
            if (month > 12) {
              month = 1;
              year += 1;
            }
          }
        }
      }
      continue;
    }

    // All fields match.
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  }
}
