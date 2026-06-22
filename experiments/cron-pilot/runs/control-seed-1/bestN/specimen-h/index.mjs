// nextRun: Parse a 5-field cron expression and find the next firing time after a given date.
// Strategy: set-iterate - parse each field into an explicit sorted set of allowed values,
// then advance by jumping to the next allowed value per field.

export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Invalid cron expression: expected 5 fields");
  }

  const [minExpr, hourExpr, domExpr, monExpr, dowExpr] = fields;

  // Parse each field into a sorted set of valid values
  let minutes, hours, doms, months, dows;
  try {
    minutes = parseField(minExpr, 0, 59);
    hours = parseField(hourExpr, 0, 23);
    doms = parseField(domExpr, 1, 31);
    months = parseField(monExpr, 1, 12);
    dows = parseField(dowExpr, 0, 6);
  } catch (e) {
    throw new Error(`Invalid cron expression: ${e.message}`);
  }

  if (minutes.size === 0 || hours.size === 0 || doms.size === 0 || months.size === 0 || dows.size === 0) {
    throw new Error("Invalid cron expression: empty field set");
  }

  // Start from the next minute
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search forward, with a reasonable limit to avoid infinite loops
  // Five years of minutes should be enough for any reasonable cron
  const maxIterations = 5 * 365 * 24 * 60;
  for (let i = 0; i < maxIterations; i++) {
    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1; // 1-12
    let day = candidate.getUTCDate(); // 1-31
    const hour = candidate.getUTCHours(); // 0-23
    const minute = candidate.getUTCMinutes(); // 0-59
    const dow = candidate.getUTCDay(); // 0-6, Sunday=0

    // If the day doesn't exist in this month (e.g., Feb 30), skip to the next month
    if (!isValidDate(year, month, day)) {
      candidate.setUTCMonth(candidate.getUTCMonth() + 1);
      candidate.setUTCDate(1);
      candidate.setUTCHours(0);
      candidate.setUTCMinutes(0);
      continue;
    }

    const minMatch = minutes.has(minute);
    const hourMatch = hours.has(hour);
    const monMatch = months.has(month);

    // Day matching: match if EITHER dom matches AND month matches, OR dow matches
    // cron spec: if both dom and dow are restricted, match if either matches
    const domRestricted = domExpr !== "*";
    const dowRestricted = dowExpr !== "*";

    let dayMatch;
    if (domRestricted && dowRestricted) {
      // Both restricted: match if either dom or dow matches
      const domOk = doms.has(day) && monMatch;
      const dowOk = dows.has(dow);
      dayMatch = domOk || dowOk;
    } else if (domRestricted) {
      // Only dom restricted
      dayMatch = doms.has(day) && monMatch;
    } else if (dowRestricted) {
      // Only dow restricted
      dayMatch = dows.has(dow);
    } else {
      // Neither restricted (both *)
      dayMatch = true;
    }

    if (minMatch && hourMatch && dayMatch) {
      return new Date(candidate.getTime());
    }

    // Advance to the next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("No next run found within reasonable time frame");
}

// Parse a single cron field into a sorted Set of valid values.
function parseField(expr, min, max) {
  if (expr === "*") {
    return new Set(range(min, max + 1));
  }

  const result = new Set();

  // Split by comma for list
  const parts = expr.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      // Step: */s or a-b/s
      const [range_part, step_str] = part.split("/");
      const step = parseInt(step_str, 10);

      if (isNaN(step) || step <= 0) {
        throw new Error(`Invalid step value: ${step_str}`);
      }

      let start = min;
      let end = max;

      if (range_part !== "*") {
        if (range_part.includes("-")) {
          const [s, e] = range_part.split("-");
          start = parseInt(s, 10);
          end = parseInt(e, 10);

          if (isNaN(start) || isNaN(end)) {
            throw new Error("Invalid range");
          }

          if (start > end) {
            throw new Error("Invalid range: start greater than end");
          }
        } else {
          start = parseInt(range_part, 10);
          end = start;

          if (isNaN(start)) {
            throw new Error("Invalid value");
          }
        }
      }

      // Validate bounds
      if (start < min || end > max) {
        throw new Error(`Value out of range ${min} to ${max}`);
      }

      // Generate values with step
      for (let v = start; v <= end; v += step) {
        result.add(v);
      }
    } else if (part.includes("-")) {
      // Range: a-b
      const [s, e] = part.split("-");
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error("Invalid range");
      }

      if (start > end) {
        throw new Error("Invalid range: start greater than end");
      }

      if (start < min || end > max) {
        throw new Error(`Value out of range ${min} to ${max}`);
      }

      for (let v = start; v <= end; v++) {
        result.add(v);
      }
    } else {
      // Single value
      const val = parseInt(part, 10);

      if (isNaN(val)) {
        throw new Error(`Invalid value: ${part}`);
      }

      if (val < min || val > max) {
        throw new Error(`Value out of range ${min} to ${max}`);
      }

      result.add(val);
    }
  }

  return result;
}

// Generate a range [start, end)
function range(start, end) {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(i);
  }
  return result;
}

// Check if a date is valid in the Gregorian calendar
function isValidDate(year, month, day) {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // Check for leap year
  if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
    daysInMonth[1] = 29;
  }

  return day <= daysInMonth[month - 1];
}
