// Cron next-firing-time engine.
//
// export function nextRun(expr, after) -> Date
//   Returns the earliest firing time strictly after `after`, computed in UTC,
//   with seconds (and ms) zeroed. Throws on a malformed expression or an
//   invalid `after` date.
//
// Standard 5-field cron: minute hour day-of-month month day-of-week.
//   - `*`, lists `a,b,c`, ranges `a-b`, steps `*/n` and `a-b/n` and `a/n`.
//   - day-of-week 0-6 with 0=Sunday; 7 is also accepted as Sunday.
//   - month/day-of-week names (jan..dec, sun..sat) accepted, case-insensitive.
//   - dom/dow union semantics: when BOTH dom and dow are restricted (not `*`),
//     a day matches if EITHER matches (logical OR). If only one is restricted,
//     only that one constrains. If neither, all days match.
//
// Algorithm: field-carry / jump search over (year, month, day, hour, minute)
// rather than minute-by-minute brute force. We advance the smallest field that
// is out of range, carrying into larger fields, and reset smaller fields to
// their minimum legal values when a larger field changes. Bounded by a search
// horizon to guarantee termination on schedules that can never fire.

const FIELD_SPECS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "dom", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "dow", min: 0, max: 7 }, // 7 normalized to 0
];

const MONTH_NAMES = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const DOW_NAMES = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function parseNumber(token, spec) {
  // Accept names for month and dow fields.
  let t = token.toLowerCase();
  if (spec.name === "month" && Object.prototype.hasOwnProperty.call(MONTH_NAMES, t)) {
    return MONTH_NAMES[t];
  }
  if (spec.name === "dow" && Object.prototype.hasOwnProperty.call(DOW_NAMES, t)) {
    return DOW_NAMES[t];
  }
  if (!/^\d+$/.test(t)) {
    throw new Error(`Invalid token "${token}" in ${spec.name} field`);
  }
  return parseInt(t, 10);
}

// Parse one field into a Set of allowed integer values within [min, max].
// For dow, value 7 is normalized to 0 (both mean Sunday).
function parseField(raw, spec) {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new Error(`Empty ${spec.name} field`);
  }
  const restricted = raw !== "*";
  const allowed = new Set();
  const parts = raw.split(",");
  if (parts.length === 0) throw new Error(`Empty ${spec.name} field`);

  for (const part of parts) {
    if (part.length === 0) throw new Error(`Empty list element in ${spec.name} field`);

    let rangePart = part;
    let step = 1;
    const slashIdx = part.indexOf("/");
    if (slashIdx !== -1) {
      rangePart = part.slice(0, slashIdx);
      const stepStr = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepStr)) {
        throw new Error(`Invalid step "${stepStr}" in ${spec.name} field`);
      }
      step = parseInt(stepStr, 10);
      if (step === 0) {
        throw new Error(`Step of zero in ${spec.name} field`);
      }
      if (rangePart.length === 0) {
        throw new Error(`Missing range before step in ${spec.name} field`);
      }
    }

    let lo;
    let hi;
    if (rangePart === "*") {
      lo = spec.min;
      hi = spec.max;
    } else {
      const dashIdx = rangePart.indexOf("-");
      if (dashIdx > 0) {
        lo = parseNumber(rangePart.slice(0, dashIdx), spec);
        hi = parseNumber(rangePart.slice(dashIdx + 1), spec);
      } else {
        lo = parseNumber(rangePart, spec);
        // A bare value with a step (e.g. "5/10") means "from value to max".
        hi = slashIdx !== -1 ? spec.max : lo;
      }
    }

    if (lo < spec.min || lo > spec.max || hi < spec.min || hi > spec.max) {
      throw new Error(`Value out of range in ${spec.name} field`);
    }
    if (lo > hi) {
      throw new Error(`Inverted range "${rangePart}" in ${spec.name} field`);
    }

    for (let v = lo; v <= hi; v += step) {
      let nv = v;
      if (spec.name === "dow" && nv === 7) nv = 0;
      allowed.add(nv);
    }
  }

  if (spec.name === "dow" && allowed.has(7)) {
    allowed.delete(7);
    allowed.add(0);
  }

  if (allowed.size === 0) {
    throw new Error(`No values selected in ${spec.name} field`);
  }

  return { values: allowed, restricted };
}

function parseExpr(expr) {
  if (typeof expr !== "string") {
    throw new Error("Cron expression must be a string");
  }
  const trimmed = expr.trim();
  if (trimmed.length === 0) {
    throw new Error("Empty cron expression");
  }
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Expected 5 fields, got ${fields.length}`);
  }
  return {
    minute: parseField(fields[0], FIELD_SPECS[0]),
    hour: parseField(fields[1], FIELD_SPECS[1]),
    dom: parseField(fields[2], FIELD_SPECS[2]),
    month: parseField(fields[3], FIELD_SPECS[3]),
    dow: parseField(fields[4], FIELD_SPECS[4]),
  };
}

function daysInMonth(year, month) {
  // month is 1-12. Day 0 of next month gives the last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Does the given calendar day satisfy the dom/dow constraints (union semantics)?
function dayMatches(parsed, year, month, day) {
  const domRestricted = parsed.dom.restricted;
  const dowRestricted = parsed.dow.restricted;

  const domOk = parsed.dom.values.has(day);
  // getUTCDay returns 0-6 with 0=Sunday, matching our normalized dow set.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const dowOk = parsed.dow.values.has(weekday);

  if (domRestricted && dowRestricted) {
    return domOk || dowOk;
  }
  if (domRestricted) return domOk;
  if (dowRestricted) return dowOk;
  return true; // both `*`
}

function nextRun(expr, after) {
  const parsed = parseExpr(expr);

  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("Invalid `after` date");
  }

  // Start strictly after `after`: advance to the next whole minute boundary.
  // Seconds and milliseconds are dropped; the result fires at the top of a minute.
  let year = after.getUTCFullYear();
  let month = after.getUTCMonth() + 1; // 1-12
  let day = after.getUTCDate();
  let hour = after.getUTCHours();
  let minute = after.getUTCMinutes();

  // Strictly-after semantics: move to the next minute regardless of seconds.
  minute += 1;

  // Normalize any minute overflow before entering the search loop.
  const normalize = () => {
    while (minute > 59) { minute -= 60; hour += 1; }
    while (hour > 23) { hour -= 24; day += 1; advanceDayOverflow(); }
  };
  function advanceDayOverflow() {
    while (true) {
      while (month > 12) { month -= 12; year += 1; }
      const dim = daysInMonth(year, month);
      if (day > dim) { day -= dim; month += 1; } else break;
    }
  }
  normalize();

  const minMinute = Math.min(...parsed.minute.values);
  const minHour = Math.min(...parsed.hour.values);

  // Bounded horizon: a valid 5-field schedule must repeat within a few years.
  // 8 years comfortably covers Feb-29 / specific-weekday-of-month interactions.
  const horizonYear = year + 9;

  while (year <= horizonYear) {
    // Month field.
    if (!parsed.month.values.has(month)) {
      month += 1;
      day = 1;
      hour = minHour;
      minute = minMinute;
      while (month > 12) { month -= 12; year += 1; }
      continue;
    }

    // Day field (dom/dow union). Also handles day-of-month exceeding month length.
    const dim = daysInMonth(year, month);
    if (day > dim || !dayMatches(parsed, year, month, day)) {
      day += 1;
      hour = minHour;
      minute = minMinute;
      if (day > dim) {
        day = 1;
        month += 1;
        while (month > 12) { month -= 12; year += 1; }
      }
      continue;
    }

    // Hour field.
    if (!parsed.hour.values.has(hour)) {
      // Find next allowed hour today, else carry to next day.
      let nextHour = -1;
      for (let h = hour + 1; h <= 23; h++) {
        if (parsed.hour.values.has(h)) { nextHour = h; break; }
      }
      if (nextHour === -1) {
        day += 1;
        hour = minHour;
        minute = minMinute;
        if (day > dim) {
          day = 1;
          month += 1;
          while (month > 12) { month -= 12; year += 1; }
        }
      } else {
        hour = nextHour;
        minute = minMinute;
      }
      continue;
    }

    // Minute field.
    if (!parsed.minute.values.has(minute)) {
      let nextMin = -1;
      for (let m = minute + 1; m <= 59; m++) {
        if (parsed.minute.values.has(m)) { nextMin = m; break; }
      }
      if (nextMin === -1) {
        hour += 1;
        minute = minMinute;
        if (hour > 23) {
          hour = minHour;
          day += 1;
          if (day > dim) {
            day = 1;
            month += 1;
            while (month > 12) { month -= 12; year += 1; }
          }
        }
      } else {
        minute = nextMin;
      }
      continue;
    }

    // All fields satisfied.
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  }

  throw new Error("No matching time found within search horizon");
}

export { nextRun };
