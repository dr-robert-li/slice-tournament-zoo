export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error('Invalid date');
  }

  if (Number.isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteField, hourField, domField, monthField, dowField] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minuteField, 0, 59, 'minute');
  const hours = parseField(hourField, 0, 23, 'hour');
  const daysOfMonth = parseField(domField, 1, 31, 'day of month');
  const months = parseField(monthField, 1, 12, 'month');
  const daysOfWeek = parseField(dowField, 0, 6, 'day of week');

  // Start from one minute after `after`
  let candidate = new Date(after);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Limit iterations to prevent infinite loops
  // Allow up to 10 years of minutes to handle edge cases like Feb 29 recurrence
  const maxIterations = 10 * 366 * 24 * 60;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const minute = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const day = candidate.getUTCDate();
    const month = candidate.getUTCMonth() + 1; // 1-indexed
    const dow = candidate.getUTCDay(); // 0-6, 0=Sunday

    const isLastDayOfMonth = day === getDaysInMonth(candidate.getUTCFullYear(), month);

    // Check if current time matches all constraints
    const minuteMatch = minutes.has(minute);
    const hourMatch = hours.has(hour);
    const monthMatch = months.has(month);

    // Day-of-month and day-of-week interaction:
    // If both are restricted (not *), then either one can match.
    // If one is *, only the other matters.
    const domRestricted = !domField.includes('*');
    const dowRestricted = !dowField.includes('*');

    let dayMatch;
    const daysInCurrentMonth = getDaysInMonth(candidate.getUTCFullYear(), month);
    const isDayInMonth = day <= daysInCurrentMonth;
    const isDayInCronSet = daysOfMonth.has(day) || (daysOfMonth.has(32) && day === daysInCurrentMonth);

    if (domRestricted && dowRestricted) {
      // Both restricted: match if either matches
      dayMatch = (isDayInMonth && isDayInCronSet) || daysOfWeek.has(dow);
    } else if (domRestricted) {
      // Only DOM restricted
      dayMatch = isDayInMonth && isDayInCronSet;
    } else if (dowRestricted) {
      // Only DOW restricted
      dayMatch = daysOfWeek.has(dow);
    } else {
      // Both unrestricted (*)
      dayMatch = true;
    }

    if (minuteMatch && hourMatch && monthMatch && dayMatch) {
      return candidate;
    }

    // Increment by one minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('Could not find next run time within reasonable time range');
}

function parseField(field, min, max, name) {
  const values = new Set();

  if (field === '*') {
    // All values in range
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  if (field.includes('/')) {
    // Step values: */n or a-b/n
    const [rangePart, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value in field: ${field}`);
    }

    let rangeStart = min;
    let rangeEnd = max;

    if (rangePart !== '*') {
      if (rangePart.includes('-')) {
        [rangeStart, rangeEnd] = parseRange(rangePart, min, max);
      } else {
        rangeStart = parseInt(rangePart, 10);
        rangeEnd = rangeStart;
      }
    }

    for (let i = rangeStart; i <= rangeEnd; i += step) {
      if (i >= min && i <= max) {
        values.add(i);
      }
    }

    return values;
  }

  if (field.includes(',')) {
    // List of values or ranges
    const parts = field.split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = parseRange(part, min, max);
        for (let i = start; i <= end; i++) {
          values.add(i);
        }
      } else {
        const val = parseInt(part, 10);
        if (isNaN(val) || val < min || val > max) {
          throw new Error(`Invalid value ${val} in field: ${field}`);
        }
        values.add(val);
      }
    }
    return values;
  }

  if (field.includes('-')) {
    // Range
    const [start, end] = parseRange(field, min, max);
    for (let i = start; i <= end; i++) {
      values.add(i);
    }
    return values;
  }

  // Single value
  const val = parseInt(field, 10);
  if (isNaN(val) || val < min || val > max) {
    throw new Error(`Invalid value ${val} in field: ${field}`);
  }
  values.add(val);
  return values;
}

function parseRange(range, min, max) {
  const [startStr, endStr] = range.split('-');
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);

  if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
    throw new Error(`Invalid range: ${range}`);
  }

  return [start, end];
}

function getDaysInMonth(year, month) {
  if (month === 2) {
    // February: check for leap year
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      return 29;
    }
    return 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}
