export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const daysOfMonth = parseField(domExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const daysOfWeek = parseField(dowExpr, 0, 6);

  // Start from the next minute after `after`
  let candidate = new Date(after);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Limit iterations to avoid infinite loops
  const maxIterations = 366 * 24 * 60 * 2; // ~1 year in minutes, doubled for safety
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const month = candidate.getUTCMonth() + 1; // 1-12
    const year = candidate.getUTCFullYear();
    const dayOfMonth = candidate.getUTCDate();
    const dayOfWeek = candidate.getUTCDay();
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();

    // Check minute and hour
    if (!minutes.has(minute) || !hours.has(hour)) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // Check month
    if (!months.has(month)) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // Check day: both day-of-month and day-of-week are OR'd together
    // If both are restricted (not *), a match occurs if EITHER matches
    // If one is * and the other is restricted, use the restricted one
    const domRestricted = domExpr !== '*';
    const dowRestricted = dowExpr !== '*';

    let dayMatches = false;
    if (!domRestricted && !dowRestricted) {
      // Both are *, so any day matches
      dayMatches = true;
    } else if (domRestricted && !dowRestricted) {
      // Only dom is restricted
      dayMatches = daysOfMonth.has(dayOfMonth);
    } else if (!domRestricted && dowRestricted) {
      // Only dow is restricted
      dayMatches = daysOfWeek.has(dayOfWeek);
    } else {
      // Both are restricted: OR logic (either matches)
      dayMatches = daysOfMonth.has(dayOfMonth) || daysOfWeek.has(dayOfWeek);
    }

    if (!dayMatches) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // All fields match
    return new Date(candidate);
  }

  throw new Error('No matching cron time found within reasonable range');
}

function parseField(fieldExpr, min, max) {
  const values = new Set();

  if (fieldExpr === '*') {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle step expressions like */15 or 10-20/2
  if (fieldExpr.includes('/')) {
    const [range, stepStr] = fieldExpr.split('/');
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step in field: ${fieldExpr}`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (range !== '*') {
      if (range.includes('-')) {
        const [minStr, maxStr] = range.split('-');
        rangeMin = parseInt(minStr, 10);
        rangeMax = parseInt(maxStr, 10);
        if (isNaN(rangeMin) || isNaN(rangeMax)) {
          throw new Error(`Invalid range in field: ${fieldExpr}`);
        }
      } else {
        rangeMin = parseInt(range, 10);
        rangeMax = rangeMin;
        if (isNaN(rangeMin)) {
          throw new Error(`Invalid value in field: ${fieldExpr}`);
        }
      }
    }

    for (let i = rangeMin; i <= rangeMax; i += step) {
      if (i >= min && i <= max) {
        values.add(i);
      }
    }
    return values;
  }

  // Handle lists and ranges
  const parts = fieldExpr.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [minStr, maxStr] = part.split('-');
      const rangeMin = parseInt(minStr, 10);
      const rangeMax = parseInt(maxStr, 10);
      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        throw new Error(`Invalid range in field: ${fieldExpr}`);
      }
      for (let i = rangeMin; i <= rangeMax; i++) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else {
      const val = parseInt(part, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value in field: ${fieldExpr}`);
      }
      if (val >= min && val <= max) {
        values.add(val);
      }
    }
  }

  return values;
}
