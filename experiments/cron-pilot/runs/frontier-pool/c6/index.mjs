export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  // Parse the cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteField, hourField, domField, monthField, dowField] = fields;

  // Track if DOM/DOW are wildcards for the interaction rule
  const domStar = domField === '*';
  const dowStar = dowField === '*';

  // Parse each field into a Set of allowed values
  const minutes = parseField(minuteField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const daysOfMonth = parseField(domField, 1, 31);
  const months = parseField(monthField, 1, 12);
  const daysOfWeek = parseField(dowField, 0, 6);

  // Start from the next minute after `after`
  const cursor = new Date(after.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  const maxDate = new Date(after.getTime());
  maxDate.setUTCFullYear(maxDate.getUTCFullYear() + 10);

  // Iterate day by day
  while (cursor < maxDate) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1; // 1-12
    const dayOfMonth = cursor.getUTCDate();
    const dayOfWeek = cursor.getUTCDay(); // 0-6, 0=Sunday

    // Check if this day matches the month and DOM/DOW rules
    if (
      months.has(month) &&
      dayMatches(dayOfMonth, dayOfWeek, daysOfMonth, daysOfWeek, domStar, dowStar)
    ) {
      // Try to find a matching time on this day
      for (const hour of Array.from(hours).sort((a, b) => a - b)) {
        for (const minute of Array.from(minutes).sort((a, b) => a - b)) {
          const candidate = new Date(Date.UTC(year, month - 1, dayOfMonth, hour, minute, 0, 0));

          // Return the first candidate strictly after `after`
          if (candidate > after) {
            return candidate;
          }
        }
      }
    }

    // Move to the next day at 00:00
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    cursor.setUTCHours(0, 0, 0, 0);
  }

  throw new Error('No matching cron time found within 5 years');
}

function parseField(field, min, max) {
  const values = new Set();

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  const parts = field.split(',');
  for (const part of parts) {
    // Handle step notation: */n or a-b/n or a/n
    if (part.includes('/')) {
      const stepParts = part.split('/');
      if (stepParts.length !== 2) {
        throw new Error(`Malformed field: ${part}`);
      }
      const [range, stepStr] = stepParts;

      // Validate stepStr is a non-negative integer
      if (!/^\d+$/.test(stepStr)) {
        throw new Error(`Malformed step: ${stepStr}`);
      }
      const step = parseInt(stepStr, 10);
      if (step <= 0) {
        throw new Error(`Invalid step value: ${stepStr}`);
      }

      let rangeMin, rangeMax;
      if (range === '*') {
        rangeMin = min;
        rangeMax = max;
      } else if (range.includes('-')) {
        const rangeParts = range.split('-');
        if (rangeParts.length !== 2 || !rangeParts[0] || !rangeParts[1]) {
          throw new Error(`Malformed range: ${range}`);
        }
        const [minStr, maxStr] = rangeParts;
        if (!/^\d+$/.test(minStr) || !/^\d+$/.test(maxStr)) {
          throw new Error(`Malformed range: ${range}`);
        }
        rangeMin = parseInt(minStr, 10);
        rangeMax = parseInt(maxStr, 10);
        if (rangeMin > rangeMax) {
          throw new Error(`Invalid range: ${rangeMin} > ${rangeMax}`);
        }
      } else {
        if (!/^\d+$/.test(range)) {
          throw new Error(`Malformed value: ${range}`);
        }
        rangeMin = parseInt(range, 10);
        rangeMax = max;
      }

      for (let i = rangeMin; i <= rangeMax; i += step) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else if (part.includes('-')) {
      // Handle range notation: a-b
      const rangeParts = part.split('-');
      if (rangeParts.length !== 2 || !rangeParts[0] || !rangeParts[1]) {
        throw new Error(`Malformed range: ${part}`);
      }
      const [minStr, maxStr] = rangeParts;
      if (!/^\d+$/.test(minStr) || !/^\d+$/.test(maxStr)) {
        throw new Error(`Malformed range: ${part}`);
      }
      const rangeMin = parseInt(minStr, 10);
      const rangeMax = parseInt(maxStr, 10);

      if (rangeMin > rangeMax) {
        throw new Error(`Invalid range: ${rangeMin} > ${rangeMax}`);
      }

      for (let i = rangeMin; i <= rangeMax; i++) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else {
      // Single value
      if (!/^\d+$/.test(part)) {
        throw new Error(`Malformed value: ${part}`);
      }
      const val = parseInt(part, 10);
      if (val < min || val > max) {
        throw new Error(`Value ${val} out of range [${min}, ${max}]`);
      }
      values.add(val);
    }
  }

  if (values.size === 0) {
    throw new Error(`No valid values for field: ${field}`);
  }

  return values;
}

function dayMatches(dayOfMonth, dayOfWeek, daysOfMonth, daysOfWeek, domStar, dowStar) {
  const domMatch = daysOfMonth.has(dayOfMonth);
  const dowMatch = daysOfWeek.has(dayOfWeek);

  // DOM/DOW interaction rule:
  // If either is * (both fields are unrestricted in that dimension), use AND.
  // If both are restricted (neither is *), use OR (Vixie-cron rule).
  if (domStar || dowStar) {
    return domMatch && dowMatch;
  } else {
    return domMatch || dowMatch;
  }
}
