// nextRun(expr, after) -- return the next cron fire time strictly after `after`.
//
// Cron fields (5): minute hour day-of-month month day-of-week
//   minute:       0-59
//   hour:         0-23
//   day-of-month: 1-31
//   month:        1-12
//   day-of-week:  0-6 (0=Sunday)
//
// Supported syntax per field:
//   *          all values
//   value      single integer
//   a,b,c      comma list
//   a-b        range
//   [*|a-b]/n  step (every n starting from range or field min)
//
// Day-of-month / day-of-week interaction (standard vixie-cron semantics):
//   Both fields unrestricted: always match day.
//   Only dom restricted: match if dom matches.
//   Only dow restricted: match if dow matches.
//   Both restricted: match if dom OR dow matches.
//
// Throws on malformed expression or invalid `after` date.
// Returns a Date (UTC, seconds=0, ms=0).

export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid `after` date');
  }

  if (typeof expr !== 'string') {
    throw new Error('Expression must be a string');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields, got ' + fields.length);
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field into an expanded Set of valid integers.
  const minutes = parseField(minuteExpr, 0, 59, 'minute');
  const hours   = parseField(hourExpr,   0, 23, 'hour');
  const months  = parseField(monthExpr,  1, 12, 'month');
  const doms    = parseField(domExpr,    1, 31, 'day-of-month');
  const dows    = parseField(dowExpr,    0,  6, 'day-of-week');

  // Determine restriction mode for day matching (vixie-cron OR logic).
  const domRestricted = !isUnrestricted(domExpr);
  const dowRestricted = !isUnrestricted(dowExpr);

  // Start searching from one minute strictly past `after`.
  const start = new Date(after.getTime());
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() + 1);

  // Cap iteration to prevent infinite loops on impossible expressions.
  const MAX_YEARS = 5;
  const stopYear = start.getUTCFullYear() + MAX_YEARS;

  let year  = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1; // 1-based
  let day   = start.getUTCDate();
  let hour  = start.getUTCHours();
  let min   = start.getUTCMinutes();

  while (year <= stopYear) {
    // --- Month ---
    if (!months.has(month)) {
      const nextMonth = nextValue(months, month, 1, 12);
      if (nextMonth === null) {
        year++;
        month = nextValue(months, 1, 1, 12);
        if (month === null) throw new Error('No valid month in expression');
        day = 1; hour = 0; min = 0;
        continue;
      }
      month = nextMonth;
      day = 1; hour = 0; min = 0;
      continue;
    }

    // --- Day boundary (some dom values won't exist in this month) ---
    const daysInMonth = getDaysInMonth(year, month);

    if (day > daysInMonth) {
      month++;
      if (month > 12) { year++; month = 1; }
      day = 1; hour = 0; min = 0;
      continue;
    }

    // --- Day (dom/dow) ---
    if (!isDayMatch(year, month, day, doms, dows, domRestricted, dowRestricted)) {
      day++;
      if (day > daysInMonth) {
        month++;
        if (month > 12) { year++; month = 1; }
        day = 1;
      }
      hour = 0; min = 0;
      continue;
    }

    // --- Hour ---
    if (!hours.has(hour)) {
      const nextHour = nextValue(hours, hour, 0, 23);
      if (nextHour === null) {
        day++;
        if (day > daysInMonth) {
          month++;
          if (month > 12) { year++; month = 1; }
          day = 1;
        }
        hour = 0; min = 0;
        continue;
      }
      hour = nextHour;
      min = 0;
      continue;
    }

    // --- Minute ---
    if (!minutes.has(min)) {
      const nextMin = nextValue(minutes, min, 0, 59);
      if (nextMin === null) {
        hour++;
        if (hour > 23) {
          day++;
          if (day > daysInMonth) {
            month++;
            if (month > 12) { year++; month = 1; }
            day = 1;
          }
          hour = 0;
        }
        min = 0;
        continue;
      }
      min = nextMin;
      continue;
    }

    // All fields match -- build the candidate Date.
    const result = new Date(Date.UTC(year, month - 1, day, hour, min, 0, 0));
    if (result.getTime() > after.getTime()) {
      return result;
    }
    // Safety valve: advance one minute (shouldn't normally be needed).
    min++;
    if (min > 59) { hour++; min = 0; }
  }

  throw new Error('Could not find a next run time within 5 years -- expression may be unsatisfiable');
}

// isDayMatch: check whether (year, month, day) satisfies dom/dow constraints.
// Vixie-cron semantics: if both restricted, either condition suffices (OR).
function isDayMatch(year, month, day, doms, dows, domRestricted, dowRestricted) {
  if (!domRestricted && !dowRestricted) return true;

  const domMatch = domRestricted ? doms.has(day) : false;

  let dowMatch = false;
  if (dowRestricted) {
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    dowMatch = dows.has(weekday);
  }

  if (domRestricted && dowRestricted) return domMatch || dowMatch;
  if (domRestricted) return domMatch;
  return dowMatch;
}

// isUnrestricted: returns true if the field expression covers every value.
// Used to classify dom and dow fields for OR-logic determination.
function isUnrestricted(field) {
  // The field text itself (before expansion). Only bare "*" (or "*/1") means
  // "not restricted" for vixie-cron interaction semantics.
  return field === '*' || field === '*/1';
}

// nextValue: find the smallest integer >= current that is in `set`, within [min, max].
// Returns null if none exists.
function nextValue(set, current, min, max) {
  for (let v = current; v <= max; v++) {
    if (set.has(v)) return v;
  }
  return null;
}

// getDaysInMonth: number of days in year/month (month is 1-based).
// Uses the trick that Date.UTC(y, m, 0) is the last day of the previous month.
function getDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// parseField: expand a cron field string into a Set<number> of matching values.
//
// Params:
//   field   - e.g. "*", "*/5", "1,3,5-9", "0-23/2"
//   minVal  - minimum valid integer for this field (inclusive)
//   maxVal  - maximum valid integer for this field (inclusive)
//   name    - field name for error messages
//
// Returns Set<number>.
function parseField(field, minVal, maxVal, name) {
  const result = new Set();

  if (typeof field !== 'string' || field.trim() === '') {
    throw new Error('Invalid cron field for ' + name + ': "' + field + '"');
  }

  const parts = field.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === '') {
      throw new Error('Empty segment in ' + name + ' field: "' + field + '"');
    }

    const slashIdx = trimmed.indexOf('/');
    if (slashIdx !== -1) {
      // Step syntax: range/n or */n or value/n
      const rangePart = trimmed.slice(0, slashIdx);
      const stepStr   = trimmed.slice(slashIdx + 1);

      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0 || String(step) !== stepStr) {
        throw new Error('Invalid step value in ' + name + ': "' + trimmed + '"');
      }

      let rangeMin = minVal;
      let rangeMax = maxVal;

      if (rangePart === '*') {
        rangeMin = minVal;
        rangeMax = maxVal;
      } else if (rangePart.indexOf('-') !== -1) {
        const dashIdx = rangePart.indexOf('-');
        const a = parseInt(rangePart.slice(0, dashIdx), 10);
        const b = parseInt(rangePart.slice(dashIdx + 1), 10);
        if (isNaN(a) || isNaN(b) || a > b) {
          throw new Error('Invalid range in ' + name + ': "' + rangePart + '"');
        }
        checkBounds(a, b, minVal, maxVal, name, trimmed);
        rangeMin = a;
        rangeMax = b;
      } else {
        // Single start value with step
        const v = parseInt(rangePart, 10);
        if (isNaN(v) || String(v) !== rangePart) {
          throw new Error('Invalid value in ' + name + ': "' + rangePart + '"');
        }
        checkBounds(v, v, minVal, maxVal, name, trimmed);
        rangeMin = v;
        rangeMax = maxVal;
      }

      for (let v = rangeMin; v <= rangeMax; v += step) {
        result.add(v);
      }

    } else if (trimmed === '*') {
      for (let v = minVal; v <= maxVal; v++) {
        result.add(v);
      }

    } else if (trimmed.indexOf('-') !== -1) {
      // Range: a-b
      const dashIdx = trimmed.indexOf('-');
      const a = parseInt(trimmed.slice(0, dashIdx), 10);
      const b = parseInt(trimmed.slice(dashIdx + 1), 10);
      if (isNaN(a) || isNaN(b)) {
        throw new Error('Invalid range in ' + name + ': "' + trimmed + '"');
      }
      if (a > b) {
        throw new Error('Range start > end in ' + name + ': "' + trimmed + '"');
      }
      checkBounds(a, b, minVal, maxVal, name, trimmed);
      for (let v = a; v <= b; v++) {
        result.add(v);
      }

    } else {
      // Single integer value
      const v = parseInt(trimmed, 10);
      if (isNaN(v) || String(v) !== trimmed) {
        throw new Error('Invalid value in ' + name + ' field: "' + trimmed + '"');
      }
      checkBounds(v, v, minVal, maxVal, name, trimmed);
      result.add(v);
    }
  }

  if (result.size === 0) {
    throw new Error('Field ' + name + ' resolved to empty set from "' + field + '"');
  }

  return result;
}

// checkBounds: throw if a or b are outside [minVal, maxVal].
function checkBounds(a, b, minVal, maxVal, name, raw) {
  if (a < minVal || b > maxVal) {
    throw new Error(
      'Value out of range for ' + name + ' (' + minVal + '-' + maxVal + '): "' + raw + '"'
    );
  }
}
