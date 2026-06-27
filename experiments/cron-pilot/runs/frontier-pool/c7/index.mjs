export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression: expected 5 fields');
  }

  const [minuteStr, hourStr, dayStr, monthStr, dowStr] = parts;

  // Parse each field
  let minutes, hours, days, months, dows;
  try {
    minutes = parseField(minuteStr, 0, 59);
    hours = parseField(hourStr, 0, 23);
    days = parseField(dayStr, 1, 31);
    months = parseField(monthStr, 1, 12);
    dows = parseField(dowStr, 0, 6);
  } catch (e) {
    throw new Error(`Invalid cron expression: ${e.message}`);
  }

  // Start from the next minute
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Limit iterations to prevent infinite loops
  const maxIterations = 4 * 365 * 24 * 60; // ~4 years worth of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1; // 1-12
    const date = candidate.getUTCDate();
    const day = candidate.getUTCDay(); // 0-6, Sunday = 0
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();

    // Check if this candidate matches the cron expression
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDayAndDow(date, day, days, dows)
    ) {
      return candidate;
    }

    // Advance to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('No matching cron time found within reasonable timeframe');
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values like */15 or 10-20/2
  const parts = field.split('/');
  let rangePart = parts[0];
  let step = 1;

  if (parts.length === 2) {
    step = parseInt(parts[1], 10);
    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${parts[1]}`);
    }
  } else if (parts.length > 2) {
    throw new Error(`Invalid field: ${field}`);
  }

  // Parse the range part (could be * or a range or a list)
  let ranges;
  if (rangePart === '*') {
    ranges = [`${min}-${max}`];
  } else {
    ranges = rangePart.split(',');
  }

  for (const range of ranges) {
    if (range.includes('-')) {
      const [start, end] = range.split('-');
      const startVal = parseInt(start, 10);
      const endVal = parseInt(end, 10);

      if (isNaN(startVal) || isNaN(endVal)) {
        throw new Error(`Invalid range: ${range}`);
      }

      if (startVal < min || endVal > max || startVal > endVal) {
        throw new Error(`Range out of bounds: ${range}`);
      }

      for (let i = startVal; i <= endVal; i += step) {
        result.add(i);
      }
    } else {
      const val = parseInt(range, 10);
      if (isNaN(val) || val < min || val > max) {
        throw new Error(`Value out of bounds: ${range}`);
      }
      result.add(val);
    }
  }

  if (result.size === 0) {
    throw new Error(`Field resulted in no values: ${field}`);
  }

  return result;
}

function matchesDayAndDow(date, day, daysSet, dowsSet) {
  // Special cron logic: if both day-of-month and day-of-week are restricted
  // (neither is *), then the date matches if EITHER matches.
  // If one is *, then only the other must match.

  const dayRestricted = !daysSet.has(1) || !daysSet.has(31);
  const dowRestricted = !dowsSet.has(0) || !dowsSet.has(6);

  const dayMatches = daysSet.has(date);
  const dowMatches = dowsSet.has(day);

  if (dayRestricted && dowRestricted) {
    // Both restricted: match if either matches
    return dayMatches || dowMatches;
  }

  // At least one is unrestricted (*)
  // Match only if the restricted one(s) match
  if (dayRestricted) {
    return dayMatches;
  }
  if (dowRestricted) {
    return dowMatches;
  }

  // Both are * (all 7 days match)
  return true;
}
