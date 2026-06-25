export function nextRun(expr, after) {
  // Validate after is a valid Date
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid after date');
  }

  // Parse the cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = fields;

  // Parse each field into a set of allowed values
  const minutes = parseField(minuteStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const daysOfMonth = parseField(domStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const daysOfWeek = parseField(dowStr, 0, 6);

  // Check if dom/dow are restricted (not literal *)
  const domRestricted = domStr !== '*';
  const dowRestricted = dowStr !== '*';

  // Start from the next minute (floor to minute, then add 1 minute)
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Safety cap: search up to ~8 years ahead
  const maxYear = after.getUTCFullYear() + 8;

  while (candidate.getUTCFullYear() <= maxYear) {
    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1; // 1-12
    const day = candidate.getUTCDate();
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();
    const dow = candidate.getUTCDay(); // 0=Sunday

    // Check minute
    if (!minutes.has(minute)) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // Check hour
    if (!hours.has(hour)) {
      candidate.setUTCHours(candidate.getUTCHours() + 1);
      candidate.setUTCMinutes(0);
      continue;
    }

    // Check month
    if (!months.has(month)) {
      candidate.setUTCMonth(candidate.getUTCMonth() + 1);
      candidate.setUTCDate(1);
      candidate.setUTCHours(0);
      candidate.setUTCMinutes(0);
      continue;
    }

    // Check day: dom/dow interaction
    const dayMatches = isDayMatch(day, dow, daysOfMonth, daysOfWeek, domRestricted, dowRestricted);
    if (!dayMatches) {
      candidate.setUTCDate(candidate.getUTCDate() + 1);
      candidate.setUTCHours(0);
      candidate.setUTCMinutes(0);
      continue;
    }

    // All fields match
    return new Date(candidate.getTime());
  }

  throw new Error('No matching cron time found within search horizon');
}

function parseField(fieldStr, min, max) {
  const result = new Set();

  if (fieldStr === '*') {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step: */n or a-b/n
  if (fieldStr.includes('/')) {
    const [rangePart, stepPart] = fieldStr.split('/');
    const step = parseInt(stepPart, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepPart}`);
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
        if (rangeMin > rangeMax) {
          throw new Error(`Invalid range: ${rangeMin}-${rangeMax}`);
        }
      } else {
        rangeMin = parseInt(rangePart, 10);
        rangeMax = rangeMin;

        if (isNaN(rangeMin)) {
          throw new Error(`Invalid value: ${rangePart}`);
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

  // Handle list: a,b,c or ranges: a-b
  const parts = fieldStr.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }
      if (start < min || start > max || end < min || end > max) {
        throw new Error(`Range out of bounds: ${part}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: ${start}-${end}`);
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
        throw new Error(`Value out of bounds: ${value}`);
      }

      result.add(value);
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values in field: ${fieldStr}`);
  }

  return result;
}

function isDayMatch(day, dow, daysOfMonth, daysOfWeek, domRestricted, dowRestricted) {
  // If both dom and dow are restricted (neither is *), match if EITHER matches
  if (domRestricted && dowRestricted) {
    return daysOfMonth.has(day) || daysOfWeek.has(dow);
  }

  // If only dom is restricted, use dom
  if (domRestricted) {
    return daysOfMonth.has(day);
  }

  // If only dow is restricted, use dow
  if (dowRestricted) {
    return daysOfWeek.has(dow);
  }

  // If both are *, every day matches
  return true;
}
