export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have 5 fields");
  }

  const [minuteExpr, hourExpr, dayExpr, monthExpr, dowExpr] = fields;

  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const daysOfMonth = parseField(dayExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const daysOfWeek = parseField(dowExpr, 0, 6);

  if (!minutes || !hours || !daysOfMonth || !months || !daysOfWeek) {
    throw new Error("Invalid cron expression");
  }

  // Start from the next minute
  const current = new Date(after.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Limit iterations to prevent infinite loops
  const maxIterations = 4 * 365 * 24 * 60; // ~4 years of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1; // 1-12
    const date = current.getUTCDate();
    const day = current.getUTCDay(); // 0-6
    const hour = current.getUTCHours();
    const minute = current.getUTCMinutes();

    // Check if current time matches all cron fields
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDayOfMonthOrWeek(date, day, daysOfMonth, daysOfWeek)
    ) {
      return new Date(current.getTime());
    }

    // Advance to next minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error("Could not find next run");
}

function parseField(fieldStr, min, max) {
  const result = new Set();

  if (fieldStr === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values like */5 or 10-30/5
  let baseStr = fieldStr;
  let step = 1;
  if (fieldStr.includes("/")) {
    const parts = fieldStr.split("/");
    if (parts.length !== 2) {
      return null;
    }
    baseStr = parts[0];
    step = parseInt(parts[1], 10);
    if (isNaN(step) || step <= 0) {
      return null;
    }
  }

  // Handle comma-separated values
  const ranges = baseStr.split(",");
  for (const range of ranges) {
    const trimmed = range.trim();

    if (trimmed === "*") {
      for (let i = min; i <= max; i += step) {
        result.add(i);
      }
    } else if (trimmed.includes("-")) {
      // Handle range like 1-5 or 1-5/2
      const parts = trimmed.split("-");
      if (parts.length !== 2) {
        return null;
      }
      const start = parseInt(parts[0].trim(), 10);
      const end = parseInt(parts[1].trim(), 10);

      if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
        return null;
      }

      for (let i = start; i <= end; i += step) {
        result.add(i);
      }
    } else {
      // Single value
      const val = parseInt(trimmed, 10);
      if (isNaN(val) || val < min || val > max) {
        return null;
      }
      result.add(val);
    }
  }

  return result.size > 0 ? result : null;
}

function matchesDayOfMonthOrWeek(dateOfMonth, dayOfWeek, daysOfMonth, daysOfWeek) {
  // In standard cron, if both day-of-month and day-of-week are restricted (not *),
  // the job runs if EITHER matches (OR logic). Otherwise, both must match (AND logic).
  const domRestricted = daysOfMonth.size < 31;
  const dowRestricted = daysOfWeek.size < 7;

  if (domRestricted && dowRestricted) {
    // Both restricted: OR logic
    return daysOfMonth.has(dateOfMonth) || daysOfWeek.has(dayOfWeek);
  } else {
    // At least one is unrestricted: AND logic (both must match)
    return daysOfMonth.has(dateOfMonth) && daysOfWeek.has(dayOfWeek);
  }
}
