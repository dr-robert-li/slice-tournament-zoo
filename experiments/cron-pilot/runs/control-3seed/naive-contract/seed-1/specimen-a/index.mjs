export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression');
  }

  const [minExpr, hourExpr, domExpr, monExpr, dowExpr] = parts;

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
      if (part.includes('/')) {
        const [range, step] = part.split('/');
        const stepVal = parseInt(step, 10);
        if (isNaN(stepVal) || stepVal <= 0) throw new Error('Invalid step');

        let rangeMin = min;
        let rangeMax = max;

        if (range !== '*') {
          if (range.includes('-')) {
            const [s, e] = range.split('-');
            rangeMin = parseInt(s, 10);
            rangeMax = parseInt(e, 10);
            if (isNaN(rangeMin) || isNaN(rangeMax)) throw new Error('Invalid range');
          } else {
            rangeMin = parseInt(range, 10);
            if (isNaN(rangeMin)) throw new Error('Invalid range');
          }
        }

        for (let i = rangeMin; i <= rangeMax; i += stepVal) {
          if (i >= min && i <= max) {
            values.add(i);
          }
        }
      } else if (part.includes('-')) {
        const [s, e] = part.split('-');
        const start = parseInt(s, 10);
        const end = parseInt(e, 10);
        if (isNaN(start) || isNaN(end)) throw new Error('Invalid range');
        for (let i = start; i <= end; i++) {
          if (i >= min && i <= max) {
            values.add(i);
          }
        }
      } else {
        const val = parseInt(part, 10);
        if (isNaN(val) || val < min || val > max) throw new Error('Invalid value');
        values.add(val);
      }
    }

    return values;
  }

  let minutes, hours, doms, months, dows;
  try {
    minutes = parseField(minExpr, 0, 59);
    hours = parseField(hourExpr, 0, 23);
    doms = parseField(domExpr, 1, 31);
    months = parseField(monExpr, 1, 12);
    dows = parseField(dowExpr, 0, 6);
  } catch (e) {
    throw new Error('Invalid cron expression: ' + e.message);
  }

  // Start from the next minute
  const candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  const maxIterations = 366 * 24 * 60; // 1 year of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1;
    const day = candidate.getUTCDate();
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();
    const dow = candidate.getUTCDay();

    // Check if current time matches
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month)
    ) {
      // Handle DOM/DOW logic: match if (DOM matches) OR (DOW matches)
      // But only if at least one is restricted (not *)
      const domRestricted = domExpr !== '*';
      const dowRestricted = dowExpr !== '*';

      let domMatches = doms.has(day);
      let dowMatches = dows.has(dow);

      if (domRestricted && dowRestricted) {
        // Both restricted: match if either matches
        if (domMatches || dowMatches) {
          return new Date(candidate.getTime());
        }
      } else if (domRestricted) {
        // Only DOM restricted
        if (domMatches) {
          return new Date(candidate.getTime());
        }
      } else if (dowRestricted) {
        // Only DOW restricted
        if (dowMatches) {
          return new Date(candidate.getTime());
        }
      } else {
        // Neither restricted (both *)
        return new Date(candidate.getTime());
      }
    }

    // Advance to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('No next run found within reasonable time range');
}
