export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Cron expression must have 5 fields");
  }

  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Parse each field into a set of allowed values
  const minutes = parseField(minStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const months = parseField(monthStr, 1, 12);
  const daysOfWeek = parseField(dowStr, 0, 7); // 7 is also Sunday
  const daysOfMonth = parseField(domStr, 1, 31); // Will be validated per month

  // Normalize day-of-week: 7 becomes 0 (Sunday)
  const normalizedDow = new Set();
  for (const dow of daysOfWeek) {
    normalizedDow.add(dow === 7 ? 0 : dow);
  }

  // Check if dom and dow are wildcards
  const domIsWildcard = domStr === "*";
  const dowIsWildcard = dowStr === "*";

  // Start from the next minute after 'after'
  let current = new Date(after.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  let maxIterations = 366 * 24 * 60 * 2; // Safety limit
  while (maxIterations-- > 0) {
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1; // 1-12
    const dayOfMonth = current.getUTCDate(); // 1-31
    const dayOfWeek = current.getUTCDay(); // 0-6
    const hour = current.getUTCHours(); // 0-23
    const minute = current.getUTCMinutes(); // 0-59

    // Check if minute matches
    if (!minutes.has(minute)) {
      current.setUTCMinutes(minute + 1);
      continue;
    }

    // Check if hour matches
    if (!hours.has(hour)) {
      current.setUTCHours(hour + 1, 0);
      continue;
    }

    // Check if month matches
    if (!months.has(month)) {
      // Advance to next month
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      current.setUTCFullYear(nextYear, nextMonth - 1, 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Get max day for current month
    const maxDayInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    // Check day-of-month and day-of-week together
    const domMatches = daysOfMonth.has(dayOfMonth) && dayOfMonth <= maxDayInMonth;
    const dowMatches = normalizedDow.has(dayOfWeek);

    // Apply day matching logic based on which fields are wildcards
    let dayMatches = false;
    if (domIsWildcard && dowIsWildcard) {
      dayMatches = true; // Both wildcards - any day matches
    } else if (domIsWildcard) {
      dayMatches = dowMatches; // Only dow constraint applies
    } else if (dowIsWildcard) {
      dayMatches = domMatches; // Only dom constraint applies
    } else {
      dayMatches = domMatches || dowMatches; // Both specified - OR logic
    }

    if (!dayMatches) {
      // Advance to next day
      current.setUTCDate(dayOfMonth + 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // All constraints match
    return new Date(current.getTime());
  }

  throw new Error("No next run found within reasonable timeframe");
}

function parseField(field, min, max) {
  const values = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle step values: */n or a-b/n
  if (field.includes("/")) {
    const [rangePart, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    let start = min;
    let end = max;

    if (rangePart !== "*") {
      if (rangePart.includes("-")) {
        const [startStr, endStr] = rangePart.split("-");
        start = parseInt(startStr, 10);
        end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
      } else {
        start = parseInt(rangePart, 10);
        end = start;
        if (isNaN(start)) {
          throw new Error(`Invalid value: ${rangePart}`);
        }
      }
    }

    for (let i = start; i <= end; i += step) {
      if (i >= min && i <= max) {
        values.add(i);
      }
    }
    return values;
  }

  // Handle comma-separated values or ranges
  const items = field.split(",");
  for (const item of items) {
    if (item.includes("-")) {
      const [startStr, endStr] = item.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${item}`);
      }
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else {
      const val = parseInt(item, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value: ${item}`);
      }
      if (val < min || val > max) {
        throw new Error(`Value out of range: ${val}`);
      }
      values.add(val);
    }
  }

  return values;
}
