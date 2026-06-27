export function nextRun(expr, after) {
  // Validate inputs
  if (typeof expr !== 'string') {
    throw new Error('Cron expression must be a string');
  }
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Reference time must be a valid Date');
  }

  // Parse the cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have 5 fields');
  }

  const [minuteExpr, hourExpr, dayExpr, monthExpr, dowExpr] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const days = parseField(dayExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const dows = parseField(dowExpr, 0, 6);

  // Start from the next minute
  let current = new Date(after.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Search for up to 4 years ahead (to handle leap year edge cases)
  const maxIterations = 366 * 24 * 60 * 4;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1; // 1-12
    const day = current.getUTCDate();
    const dow = current.getUTCDay(); // 0-6, 0=Sunday
    const hour = current.getUTCHours();
    const minute = current.getUTCMinutes();

    // Check if current time matches the cron expression
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month)
    ) {
      // Day matching: both day-of-month and day-of-week must be considered
      // If both are restricted (not *), then either can match
      // If only one is restricted, it must match
      const dayRestricted = !isUnrestricted(dayExpr, 1, 31);
      const dowRestricted = !isUnrestricted(dowExpr, 0, 6);

      let dayMatches = false;

      if (!dayRestricted && !dowRestricted) {
        // Both unrestricted: always matches
        dayMatches = true;
      } else if (dayRestricted && !dowRestricted) {
        // Only day-of-month restricted
        dayMatches = days.has(day);
      } else if (!dayRestricted && dowRestricted) {
        // Only day-of-week restricted
        dayMatches = dows.has(dow);
      } else {
        // Both restricted: either can match (OR logic)
        dayMatches = days.has(day) || dows.has(dow);
      }

      if (dayMatches) {
        return new Date(current.getTime());
      }
    }

    // Move to next minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error('No matching cron execution found within search window');
}

function parseField(expr, min, max) {
  const result = new Set();

  if (expr === '*') {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values: */n or a-b/n
  if (expr.includes('/')) {
    const [rangePart, stepStr] = expr.split('/');
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== '*') {
      if (rangePart.includes('-')) {
        const [startStr, endStr] = rangePart.split('-');
        rangeMin = parseInt(startStr, 10);
        rangeMax = parseInt(endStr, 10);

        if (isNaN(rangeMin) || isNaN(rangeMax)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }

        if (rangeMin < min || rangeMax > max || rangeMin > rangeMax) {
          throw new Error(`Range out of bounds or invalid: ${rangePart}`);
        }
      } else {
        const val = parseInt(rangePart, 10);
        if (isNaN(val)) {
          throw new Error(`Invalid value: ${rangePart}`);
        }
        if (val < min || val > max) {
          throw new Error(`Value out of bounds: ${val}`);
        }
        rangeMin = val;
        rangeMax = val;
      }
    }

    for (let i = rangeMin; i <= rangeMax; i += step) {
      result.add(i);
    }

    return result;
  }

  // Handle list values: a,b,c or ranges: a-b
  const parts = expr.split(',');

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }

      if (start < min || end > max || start > end) {
        throw new Error(`Range out of bounds or invalid: ${part}`);
      }

      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      const val = parseInt(part, 10);

      if (isNaN(val)) {
        throw new Error(`Invalid value: ${part}`);
      }

      if (val < min || val > max) {
        throw new Error(`Value out of bounds: ${val}`);
      }

      result.add(val);
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values in field: ${expr}`);
  }

  return result;
}

function isUnrestricted(expr, min, max) {
  if (expr === '*') {
    return true;
  }

  // Check if expression expands to all values in range
  try {
    const parsed = parseField(expr, min, max);
    if (parsed.size === max - min + 1) {
      let allPresent = true;
      for (let i = min; i <= max; i++) {
        if (!parsed.has(i)) {
          allPresent = false;
          break;
        }
      }
      return allPresent;
    }
  } catch {
    // If parsing fails, it's restricted
  }

  return false;
}
