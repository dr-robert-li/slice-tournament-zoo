export function nextRun(expr, after) {
  // Validate input date
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  // Parse cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field
  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const doms = parseField(domExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const dows = parseField(dowExpr, 0, 6);

  // Check if DOM and DOW are both restricted (not bare *)
  const domRestricted = domExpr !== '*';
  const dowRestricted = dowExpr !== '*';

  // Start from the next minute boundary
  const startTime = new Date(after.getTime());
  startTime.setUTCSeconds(0, 0);
  startTime.setUTCMinutes(startTime.getUTCMinutes() + 1);

  // Search for the next matching time (up to 5 years ahead)
  const maxIterations = 5 * 365 * 24 * 60;
  let iterations = 0;

  while (iterations < maxIterations) {
    const year = startTime.getUTCFullYear();
    const month = startTime.getUTCMonth() + 1; // getUTCMonth is 0-11
    const day = startTime.getUTCDate();
    const hour = startTime.getUTCHours();
    const minute = startTime.getUTCMinutes();

    iterations++;

    // Check if current time matches the cron expression
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDay(day, month, year, doms, dows, domRestricted, dowRestricted)
    ) {
      return new Date(startTime);
    }

    // Advance to next minute
    startTime.setUTCMinutes(startTime.getUTCMinutes() + 1);
  }

  throw new Error('No matching cron time found within 5 years');
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values (*/n or a-b/n)
  if (field.includes('/')) {
    const [rangePart, stepPart] = field.split('/');
    const step = parseInt(stepPart, 10);

    if (isNaN(step) || step < 1) {
      throw new Error(`Invalid step value: ${stepPart}`);
    }

    let start = min;
    let end = max;

    if (rangePart !== '*') {
      if (rangePart.includes('-')) {
        const [startStr, endStr] = rangePart.split('-');
        start = parseInt(startStr, 10);
        end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
        if (start > end) {
          throw new Error(`Invalid range: start > end in ${rangePart}`);
        }
      } else {
        throw new Error(`Invalid range syntax: ${rangePart}`);
      }
    }

    for (let i = start; i <= end; i += step) {
      if (i >= min && i <= max) {
        result.add(i);
      }
    }
    return result;
  }

  // Handle comma-separated values and ranges
  const parts = field.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: start > end in ${part}`);
      }
      if (start < min || end > max) {
        throw new Error(`Range ${part} out of bounds [${min}, ${max}]`);
      }

      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      const value = parseInt(part, 10);

      if (isNaN(value)) {
        throw new Error(`Invalid value: ${part}`);
      }
      if (value < min || value > max) {
        throw new Error(`Value ${value} out of bounds [${min}, ${max}]`);
      }

      result.add(value);
    }
  }

  return result;
}

function matchesDay(day, month, year, doms, dows, domRestricted, dowRestricted) {
  // Construct a Date to get the day of week
  // Use UTC constructor: Date.UTC(year, month-1, day)
  // Then read back with getUTC* to handle rollovers
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));

  // If the day rolled over to a different month/year (e.g., Feb 30 → Mar 2),
  // this day doesn't match the requested day-of-month
  if (date.getUTCMonth() + 1 !== month || date.getUTCFullYear() !== year) {
    return false;
  }

  const actualDay = date.getUTCDate();
  const dayOfWeek = date.getUTCDay(); // 0=Sunday, 6=Saturday

  // Apply DOM/DOW rule
  if (domRestricted && dowRestricted) {
    // Both restricted: match if either matches (OR)
    return doms.has(actualDay) || dows.has(dayOfWeek);
  } else if (domRestricted) {
    // Only DOM restricted
    return doms.has(actualDay);
  } else if (dowRestricted) {
    // Only DOW restricted
    return dows.has(dayOfWeek);
  } else {
    // Neither restricted (both *)
    return true;
  }
}
