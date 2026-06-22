export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression: expected 5 fields");
  }

  const [minExpr, hourExpr, domExpr, monthExpr, dowExpr] = parts;

  // Parse each field into a set of valid values
  const minutes = parseField(minExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const daysOfMonth = parseField(domExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const daysOfWeek = parseField(dowExpr, 0, 6);

  if (!minutes || !hours || !daysOfMonth || !months || !daysOfWeek) {
    throw new Error("Invalid cron expression");
  }

  // Start from the next minute after 'after'
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Iterate until we find a matching time (max 4 years to prevent infinite loop)
  const maxIterations = 4 * 365 * 24 * 60;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const minute = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const day = candidate.getUTCDate();
    const month = candidate.getUTCMonth() + 1;
    const dow = candidate.getUTCDay();

    // Check if current time matches the cron expression
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDayOfMonthOrWeek(day, dow, daysOfMonth, daysOfWeek)
    ) {
      return new Date(candidate.getTime());
    }

    // Advance to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("No matching cron execution found within 4 years");
}

function parseField(expr, min, max) {
  const result = new Set();

  if (expr === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values like */n or a-b/n
  if (expr.includes("/")) {
    const [range, stepStr] = expr.split("/");
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) {
      return null;
    }

    let start = min;
    let end = max;

    if (range !== "*") {
      if (range.includes("-")) {
        const [startStr, endStr] = range.split("-");
        start = parseInt(startStr, 10);
        end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
          return null;
        }
      } else {
        start = parseInt(range, 10);
        end = start;
        if (isNaN(start) || start < min || start > max) {
          return null;
        }
      }
    }

    for (let i = start; i <= end; i += step) {
      result.add(i);
    }
    return result;
  }

  // Handle comma-separated values (including ranges)
  const items = expr.split(",");
  for (const item of items) {
    if (item.includes("-")) {
      // Range
      const [startStr, endStr] = item.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
        return null;
      }
      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      // Single value
      const val = parseInt(item, 10);
      if (isNaN(val) || val < min || val > max) {
        return null;
      }
      result.add(val);
    }
  }

  return result;
}

function matchesDayOfMonthOrWeek(day, dow, daysOfMonth, daysOfWeek) {
  // In standard cron, if both day-of-month and day-of-week are restricted
  // (not *), the job runs if EITHER matches (OR logic).
  // If only one is restricted, that one must match.

  const domRestricted = daysOfMonth.size < 31;
  const dowRestricted = daysOfWeek.size < 7;

  if (!domRestricted && !dowRestricted) {
    // Both are *, always match
    return true;
  }

  if (domRestricted && !dowRestricted) {
    // Only day-of-month is restricted
    return daysOfMonth.has(day);
  }

  if (!domRestricted && dowRestricted) {
    // Only day-of-week is restricted
    return daysOfWeek.has(dow);
  }

  // Both are restricted: match if EITHER matches
  return daysOfMonth.has(day) || daysOfWeek.has(dow);
}
