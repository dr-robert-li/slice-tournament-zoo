export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after)) {
    throw new Error("Invalid date");
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression: must have 5 fields");
  }

  const [minuteStr, hourStr, dayStr, monthStr, dowStr] = parts;

  // Parse each field into a set of valid values
  let minutes = parseField(minuteStr, 0, 59);
  let hours = parseField(hourStr, 0, 23);
  let days = parseField(dayStr, 1, 31);
  let months = parseField(monthStr, 1, 12);
  let dows = parseField(dowStr, 0, 6);

  if (!minutes || !hours || !days || !months || !dows) {
    throw new Error("Invalid cron field");
  }

  // Determine if day-of-month or day-of-week are restricted
  const dayRestricted = dayStr !== "*";
  const dowRestricted = dowStr !== "*";

  // Start from the next minute after 'after'
  let date = new Date(after);
  date.setUTCSeconds(0, 0);
  date.setUTCMinutes(date.getUTCMinutes() + 1);

  // Search for the next valid time (with a reasonable upper bound to prevent infinite loops)
  const maxIterations = 4 * 365 * 24 * 60; // ~4 years worth of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const minute = date.getUTCMinutes();
    const hour = date.getUTCHours();
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // UTC month is 0-indexed
    const dow = date.getUTCDay(); // 0 = Sunday

    const minuteOk = minutes.has(minute);
    const hourOk = hours.has(hour);
    const monthOk = months.has(month);

    // Day matching logic:
    // - If both day-of-month and day-of-week are restricted: OR (either can match)
    // - If only day-of-month is restricted: must match day-of-month
    // - If only day-of-week is restricted: must match day-of-week
    let dayMatchOk;
    if (dayRestricted && dowRestricted) {
      // Both restricted: OR logic
      dayMatchOk = days.has(day) || dows.has(dow);
    } else if (dayRestricted) {
      // Only day-of-month restricted
      dayMatchOk = days.has(day);
    } else if (dowRestricted) {
      // Only day-of-week restricted
      dayMatchOk = dows.has(dow);
    } else {
      // Neither restricted (both are *)
      dayMatchOk = true;
    }

    if (minuteOk && hourOk && monthOk && dayMatchOk) {
      return new Date(date);
    }

    // Move to next minute
    date.setUTCMinutes(date.getUTCMinutes() + 1);
  }

  throw new Error("No valid cron time found within search limit");
}

function parseField(field, min, max) {
  const values = new Set();

  if (field === "*") {
    // Match all values in range
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle step syntax (*/n or a-b/n)
  if (field.includes("/")) {
    const [rangePart, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      return null;
    }

    let start, end;

    if (rangePart === "*") {
      start = min;
      end = max;
    } else if (rangePart.includes("-")) {
      const [startStr, endStr] = rangePart.split("-");
      start = parseInt(startStr, 10);
      end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) {
        return null;
      }
    } else {
      start = parseInt(rangePart, 10);
      end = max;
      if (isNaN(start)) {
        return null;
      }
    }

    if (start < min || end > max || start > end) {
      return null;
    }

    for (let i = start; i <= end; i += step) {
      values.add(i);
    }

    return values;
  }

  // Handle list syntax (a,b,c or a-b,c-d)
  if (field.includes(",")) {
    const items = field.split(",");
    for (const item of items) {
      if (item.includes("-")) {
        const [startStr, endStr] = item.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
          return null;
        }
        for (let i = start; i <= end; i++) {
          values.add(i);
        }
      } else {
        const val = parseInt(item, 10);
        if (isNaN(val) || val < min || val > max) {
          return null;
        }
        values.add(val);
      }
    }
    return values;
  }

  // Handle range syntax (a-b)
  if (field.includes("-")) {
    const [startStr, endStr] = field.split("-");
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
      return null;
    }
    for (let i = start; i <= end; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle single value
  const val = parseInt(field, 10);
  if (isNaN(val) || val < min || val > max) {
    return null;
  }
  values.add(val);
  return values;
}
