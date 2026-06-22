function isLeap(year) {
  return (year % 400 === 0) || (year % 4 === 0 && year % 100 !== 0);
}

function daysInMonth(year, month) {
  // month is 1-indexed (1=Jan, 12=Dec)
  if (month === 2) return isLeap(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

function parseField(token, min, max) {
  // Returns a sorted Set of valid values for this field
  const values = new Set();

  if (token === "*") {
    for (let i = min; i <= max; i++) values.add(i);
    return values;
  }

  const parts = token.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      // Handle step: either */n or a-b/n
      const [rangePart, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);
      if (!Number.isInteger(step) || step <= 0) {
        throw new Error(`Invalid step: ${stepStr}`);
      }

      let rangeMin = min;
      let rangeMax = max;

      if (rangePart !== "*") {
        if (!rangePart.includes("-")) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
        const [startStr, endStr] = rangePart.split("-");
        rangeMin = parseInt(startStr, 10);
        rangeMax = parseInt(endStr, 10);

        if (!Number.isInteger(rangeMin) || !Number.isInteger(rangeMax)) {
          throw new Error(`Invalid range bounds: ${rangePart}`);
        }
        if (rangeMin > rangeMax) {
          throw new Error(`Inverted range: ${rangePart}`);
        }
        if (rangeMin < min || rangeMax > max) {
          throw new Error(`Range out of bounds: ${rangePart}`);
        }
      }

      for (let i = rangeMin; i <= rangeMax; i += step) {
        values.add(i);
      }
    } else if (part.includes("-")) {
      // Handle range: a-b
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw new Error(`Invalid range bounds: ${part}`);
      }
      if (start > end) {
        throw new Error(`Inverted range: ${part}`);
      }
      if (start < min || end > max) {
        throw new Error(`Range out of bounds: ${part}`);
      }

      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (!Number.isInteger(val)) {
        throw new Error(`Invalid value: ${part}`);
      }
      if (val < min || val > max) {
        throw new Error(`Value out of range: ${part} (valid: ${min}-${max})`);
      }
      values.add(val);
    }
  }

  return values;
}

function parseExpr(expr) {
  if (typeof expr !== "string") {
    throw new Error("Expression must be a string");
  }

  const tokens = expr.trim().split(/\s+/);
  if (tokens.length !== 5) {
    throw new Error(`Expected 5 fields, got ${tokens.length}`);
  }

  const [minToken, hourToken, domToken, monthToken, dowToken] = tokens;

  // Capture raw tokens to detect if dom/dow are wildcards
  const domIsWildcard = domToken === "*";
  const dowIsWildcard = dowToken === "*";

  const minute = parseField(minToken, 0, 59);
  const hour = parseField(hourToken, 0, 23);
  const dom = parseField(domToken, 1, 31);
  const month = parseField(monthToken, 1, 12);
  let dow = parseField(dowToken, 0, 6);

  // Support dow=7 as Sunday (map to 0)
  if (dow.has(7)) {
    dow.delete(7);
    dow.add(0);
  }

  return {
    minute,
    hour,
    dom,
    month,
    dow,
    domIsWildcard,
    dowIsWildcard,
  };
}

function dayMatches(date, parsed) {
  const year = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1; // 1-indexed
  const d = date.getUTCDate();
  const dow = date.getUTCDay();

  // If both dom and dow are wildcards, any day matches
  if (parsed.domIsWildcard && parsed.dowIsWildcard) {
    return true;
  }

  // If only dom is restricted, use dom only
  if (!parsed.domIsWildcard && parsed.dowIsWildcard) {
    return parsed.dom.has(d);
  }

  // If only dow is restricted, use dow only
  if (parsed.domIsWildcard && !parsed.dowIsWildcard) {
    return parsed.dow.has(dow);
  }

  // Both are restricted: dom OR dow (union)
  return parsed.dom.has(d) || parsed.dow.has(dow);
}

export function nextRun(expr, after) {
  // Validate after
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date: after must be a valid Date");
  }

  const parsed = parseExpr(expr);

  // Start from strictly after the given time
  // We move to the next minute boundary and zero seconds
  const candidate = new Date(after.getTime());
  candidate.setUTCMilliseconds(0);
  candidate.setUTCSeconds(0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Bounded search: don't search more than 8 years ahead
  const maxYear = after.getUTCFullYear() + 8;

  // Component-carry loop: validate each field from top to bottom
  // If any field is invalid, step it and reset smaller fields
  while (candidate.getUTCFullYear() <= maxYear) {
    const year = candidate.getUTCFullYear();
    const m = candidate.getUTCMonth() + 1; // 1-indexed

    // Check if current month is valid
    if (!parsed.month.has(m)) {
      // Step to next valid month
      let nextMonth = m + 1;
      let nextYear = year;
      if (nextMonth > 12) {
        nextMonth = 1;
        nextYear += 1;
      }
      candidate.setUTCFullYear(nextYear);
      candidate.setUTCMonth(nextMonth - 1);
      candidate.setUTCDate(1);
      candidate.setUTCHours(0);
      candidate.setUTCMinutes(0);
      continue;
    }

    // Check if current day is valid (dom/dow union)
    if (!dayMatches(candidate, parsed)) {
      // Step day by +1
      candidate.setUTCDate(candidate.getUTCDate() + 1);
      candidate.setUTCHours(0);
      candidate.setUTCMinutes(0);
      continue;
    }

    // Check if current hour is valid
    const h = candidate.getUTCHours();
    if (!parsed.hour.has(h)) {
      // Step hour to next valid value
      const sortedHours = Array.from(parsed.hour).sort((a, b) => a - b);
      let nextHour = sortedHours.find((hour) => hour > h);
      if (nextHour === undefined) {
        // Wrap to next day
        nextHour = sortedHours[0];
        candidate.setUTCDate(candidate.getUTCDate() + 1);
      }
      candidate.setUTCHours(nextHour);
      candidate.setUTCMinutes(0);
      continue;
    }

    // Check if current minute is valid
    const mi = candidate.getUTCMinutes();
    if (!parsed.minute.has(mi)) {
      // Step minute to next valid value
      const sortedMinutes = Array.from(parsed.minute).sort((a, b) => a - b);
      let nextMinute = sortedMinutes.find((minute) => minute > mi);
      if (nextMinute === undefined) {
        // Wrap to next hour
        nextMinute = sortedMinutes[0];
        candidate.setUTCHours(candidate.getUTCHours() + 1);
      }
      candidate.setUTCMinutes(nextMinute);
      continue;
    }

    // All fields match — return this candidate
    return new Date(candidate.getTime());
  }

  throw new Error("No valid firing time found within 8-year horizon");
}
