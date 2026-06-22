export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Invalid cron expression: expected 5 fields');
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = fields;

  // Parse each field into sets of valid values
  const minutes = parseField(minuteStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const doms = parseField(domStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const dows = parseField(dowStr, 0, 6);

  if (!minutes || !hours || !doms || !months || !dows) {
    throw new Error('Invalid cron field');
  }

  // Start searching from the next minute
  const search = new Date(after.getTime());
  search.setUTCSeconds(0, 0);
  search.setUTCMinutes(search.getUTCMinutes() + 1);

  // Limit search to prevent infinite loops
  const maxIterations = 4 * 365 * 24 * 60; // ~4 years worth of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const y = search.getUTCFullYear();
    const mo = search.getUTCMonth() + 1; // 1-12
    const d = search.getUTCDate();
    const h = search.getUTCHours();
    const mi = search.getUTCMinutes();
    const dow = search.getUTCDay(); // 0-6

    // Check if current time matches all fields
    if (
      minutes.has(mi) &&
      hours.has(h) &&
      months.has(mo) &&
      matchesDayConstraint(d, mo, y, doms, dows, dow)
    ) {
      return new Date(search.getTime());
    }

    // Advance to next minute
    search.setUTCMinutes(search.getUTCMinutes() + 1);
  }

  throw new Error('No next run found within search limit');
}

function parseField(field, min, max) {
  const values = new Set();

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle step syntax: */n or a-b/n
  if (field.includes('/')) {
    const [rangePart, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      return null;
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== '*') {
      if (rangePart.includes('-')) {
        const [minStr, maxStr] = rangePart.split('-');
        rangeMin = parseInt(minStr, 10);
        rangeMax = parseInt(maxStr, 10);
        if (isNaN(rangeMin) || isNaN(rangeMax)) {
          return null;
        }
      } else {
        rangeMin = parseInt(rangePart, 10);
        rangeMax = rangeMin;
        if (isNaN(rangeMin)) {
          return null;
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

  // Handle list or range syntax
  const parts = field.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [minStr, maxStr] = part.split('-');
      const rangeMin = parseInt(minStr, 10);
      const rangeMax = parseInt(maxStr, 10);

      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        return null;
      }

      for (let i = rangeMin; i <= rangeMax; i++) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else {
      const val = parseInt(part, 10);
      if (isNaN(val) || val < min || val > max) {
        return null;
      }
      values.add(val);
    }
  }

  return values;
}

function matchesDayConstraint(day, month, year, doms, dows, dow) {
  const domMatch = doms.has(day);
  const dowMatch = dows.has(dow);

  // If both dom and dow are restricted (not full range), use OR logic
  // If either is unrestricted (*), use the other
  const domRestricted = doms.size < 31;
  const dowRestricted = dows.size < 7;

  if (domRestricted && dowRestricted) {
    return domMatch || dowMatch;
  }
  if (domRestricted) {
    return domMatch;
  }
  if (dowRestricted) {
    return dowMatch;
  }

  // Both unrestricted
  return true;
}
