export function nextRun(expr, after) {
  // Validate after parameter
  if (!(after instanceof Date)) {
    throw new Error("after must be a Date");
  }
  if (isNaN(after.getTime())) {
    throw new Error("after is an invalid Date");
  }

  // Parse cron expression
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("cron expression must have exactly 5 fields");
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Parse each field into a set of valid values
  let minutes, hours, daysOfMonth, months, daysOfWeek;
  try {
    minutes = parseField(minuteStr, 0, 59);
    hours = parseField(hourStr, 0, 23);
    daysOfMonth = parseField(domStr, 1, 31);
    months = parseField(monthStr, 1, 12);
    daysOfWeek = parseField(dowStr, 0, 6);
  } catch (e) {
    throw e;
  }

  // Normalize dow: accept 7 as Sunday (same as 0)
  if (daysOfWeek.has(7)) {
    daysOfWeek.delete(7);
    daysOfWeek.add(0);
  }

  // Track whether dom and dow are restricted (not *)
  const domRestricted = domStr !== "*";
  const dowRestricted = dowStr !== "*";

  // Start from the next minute after 'after'
  let current = new Date(after.getTime());
  // Floor to the minute, then add 1 minute to get strictly after
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Search up to 9 years in the future (covers century-boundary leap year edge cases)
  const maxTime = new Date(after.getTime() + 9 * 365.25 * 24 * 60 * 60 * 1000);

  while (current <= maxTime) {
    const minute = current.getUTCMinutes();
    const hour = current.getUTCHours();
    const dom = current.getUTCDate();
    const month = current.getUTCMonth() + 1; // JS months are 0-11
    const dow = current.getUTCDay(); // 0 = Sunday

    // Check minute and hour
    if (!minutes.has(minute) || !hours.has(hour) || !months.has(month)) {
      current.setUTCMinutes(current.getUTCMinutes() + 1);
      continue;
    }

    // Check day-of-month and day-of-week with union logic
    let dayMatches = false;
    if (domRestricted && dowRestricted) {
      // Both restricted: match if either dom OR dow matches
      dayMatches = daysOfMonth.has(dom) || daysOfWeek.has(dow);
    } else if (domRestricted) {
      // Only dom restricted
      dayMatches = daysOfMonth.has(dom);
    } else if (dowRestricted) {
      // Only dow restricted
      dayMatches = daysOfWeek.has(dow);
    } else {
      // Both unrestricted (both are *)
      dayMatches = true;
    }

    if (dayMatches) {
      return new Date(current.getTime());
    }

    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  // No match found within 5 years
  throw new Error("no matching execution time found within 5 years");
}

function parseField(fieldStr, min, max) {
  const values = new Set();

  // Handle */n (every n units)
  if (fieldStr.startsWith("*/")) {
    const stepStr = fieldStr.substring(2);
    if (!isStrictInteger(stepStr)) {
      throw new Error(`invalid step in field: ${fieldStr}`);
    }
    const step = parseInt(stepStr, 10);
    if (step <= 0) {
      throw new Error(`invalid step in field: ${fieldStr}`);
    }
    for (let i = min; i <= max; i += step) {
      values.add(i);
    }
    return values;
  }

  // Handle * (all values)
  if (fieldStr === "*") {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle comma-separated list or ranges
  const parts = fieldStr.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      // Handle n/step form (also covers a-b/step)
      const [rangePart, stepStr] = part.split("/");

      if (!isStrictInteger(stepStr)) {
        throw new Error(`invalid step in field: ${part}`);
      }
      const step = parseInt(stepStr, 10);
      if (step <= 0) {
        throw new Error(`invalid step in field: ${part}`);
      }

      if (rangePart.includes("-")) {
        // a-b/step form
        const [startStr, endStr] = rangePart.split("-");

        if (!isStrictInteger(startStr) || !isStrictInteger(endStr)) {
          throw new Error(`invalid range in field: ${part}`);
        }

        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (start > end) {
          throw new Error(`inverted range in field: ${part}`);
        }

        // For dow field, allow 7 as valid (will be normalized to 0 later)
        const effectiveMax = (max === 6 && (start === 7 || end === 7)) ? 7 : max;

        if (start < min || end > effectiveMax) {
          throw new Error(`out of range values in field: ${part}`);
        }

        for (let i = start; i <= end; i += step) {
          values.add(i);
        }
      } else {
        // n/step form (start at n, every step up to max)
        if (!isStrictInteger(rangePart)) {
          throw new Error(`invalid value in field: ${part}`);
        }

        let start = parseInt(rangePart, 10);

        // For dow field, allow 7 as valid (normalize to 0 for step operations)
        if (max === 6 && start === 7) {
          start = 0;
        }

        if (start < min || start > max) {
          throw new Error(`out of range value in field: ${part}`);
        }

        for (let i = start; i <= max; i += step) {
          values.add(i);
        }
      }
    } else if (part.includes("-")) {
      // Handle range (possibly with step)
      const [startStr, endStr] = part.split("-");

      if (!isStrictInteger(startStr) || !isStrictInteger(endStr)) {
        throw new Error(`invalid range in field: ${part}`);
      }

      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (start > end) {
        throw new Error(`inverted range in field: ${part}`);
      }

      // For dow field, allow 7 as valid (will be normalized to 0 later)
      const effectiveMax = (max === 6 && (start === 7 || end === 7)) ? 7 : max;

      if (start < min || end > effectiveMax) {
        throw new Error(`out of range values in field: ${part}`);
      }

      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else {
      // Single value
      if (!isStrictInteger(part)) {
        throw new Error(`invalid value in field: ${part}`);
      }

      const val = parseInt(part, 10);

      // For dow field, allow 7 as valid (will be normalized to 0 later)
      const effectiveMax = (max === 6 && val === 7) ? 7 : max;

      if (val < min || val > effectiveMax) {
        throw new Error(`out of range value in field: ${part}`);
      }
      values.add(val);
    }
  }

  return values;
}

function isStrictInteger(str) {
  if (typeof str !== 'string' || str.length === 0) return false;
  return /^\d+$/.test(str);
}
