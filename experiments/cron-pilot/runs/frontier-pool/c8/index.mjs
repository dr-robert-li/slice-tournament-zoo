export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Parse each field into sets of valid values
  const minutes = parseField(minuteStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const daysOfMonth = parseField(domStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const daysOfWeek = parseField(dowStr, 0, 6);

  // Start from the next minute
  let candidate = new Date(after);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search forward for up to 4 years to find a match
  const maxIterations = 4 * 365 * 24 * 60 + 100; // Account for leap days
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const month = candidate.getUTCMonth() + 1; // 1-12
    const dayOfMonth = candidate.getUTCDate();
    const dayOfWeek = candidate.getUTCDay(); // 0-6, 0 = Sunday
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();

    // Check if all fields match
    const minuteMatch = minutes.has(minute);
    const hourMatch = hours.has(hour);
    const monthMatch = months.has(month);

    // Day matching: both day-of-month and day-of-week are OR'd
    // (standard cron behavior when both are restricted)
    const domRestricted = domStr !== '*' && !domStr.includes('/');
    const dowRestricted = dowStr !== '*' && !dowStr.includes('/');

    let dayMatch;
    if (domRestricted && dowRestricted) {
      // Both restricted: match if EITHER matches
      dayMatch = (daysOfMonth.has(dayOfMonth) || daysOfWeek.has(dayOfWeek));
    } else if (domRestricted) {
      // Only dom restricted
      dayMatch = daysOfMonth.has(dayOfMonth);
    } else if (dowRestricted) {
      // Only dow restricted
      dayMatch = daysOfWeek.has(dayOfWeek);
    } else {
      // Neither restricted: always match
      dayMatch = true;
    }

    if (minuteMatch && hourMatch && monthMatch && dayMatch) {
      // Validate the date is actually valid (e.g., Feb 30 doesn't exist)
      if (candidate.getUTCDate() === dayOfMonth) {
        return candidate;
      }
    }

    // Move to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('No matching cron time found within 4 years');
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
    const [rangePart, stepStr] = field.split('/');
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
      } else {
        rangeMin = parseInt(rangePart, 10);
        rangeMax = max;
        if (isNaN(rangeMin)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
      }
    }

    for (let i = rangeMin; i <= rangeMax; i += step) {
      if (i >= min && i <= max) {
        result.add(i);
      }
    }
    return result;
  }

  // Handle lists and ranges
  const items = field.split(',');
  for (const item of items) {
    if (item.includes('-')) {
      const [startStr, endStr] = item.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${item}`);
      }
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else {
      const num = parseInt(item, 10);
      if (isNaN(num)) {
        throw new Error(`Invalid value: ${item}`);
      }
      if (num >= min && num <= max) {
        result.add(num);
      }
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values in field: ${field}`);
  }

  return result;
}
