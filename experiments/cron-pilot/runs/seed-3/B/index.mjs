export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error('after must be a Date');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('cron expression must have 5 fields');
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const daysOfMonth = parseField(domExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const daysOfWeek = parseField(dowExpr, 0, 6);

  // Track which fields are unrestricted (the `*` case)
  const domUnrestricted = domExpr === '*';
  const dowUnrestricted = dowExpr === '*';

  // Start from the minute after `after`
  const start = new Date(after.getTime());
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() + 1);

  let current = new Date(start.getTime());

  // Iterate forward to find next matching time
  // Limit iterations to prevent infinite loops
  const maxIterations = 366 * 24 * 60; // one year worth of minutes
  for (let i = 0; i < maxIterations; i++) {
    const minute = current.getUTCMinutes();
    const hour = current.getUTCHours();
    const day = current.getUTCDate();
    const month = current.getUTCMonth() + 1;
    const dayOfWeek = current.getUTCDay();

    // Determine if day constraints are met
    let dayMatch;
    if (domUnrestricted && dowUnrestricted) {
      dayMatch = true; // Both are *, any day works
    } else if (domUnrestricted) {
      dayMatch = daysOfWeek.has(dayOfWeek); // Only dow matters
    } else if (dowUnrestricted) {
      dayMatch = daysOfMonth.has(day); // Only dom matters
    } else {
      dayMatch = daysOfMonth.has(day) || daysOfWeek.has(dayOfWeek); // Either constraint
    }

    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      dayMatch
    ) {
      return new Date(current.getTime());
    }

    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error('No next run found within reasonable time window');
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
    if (part.includes('/')) {
      // Handle step values: */5 or 10-20/2
      const [range, step] = part.split('/');
      const stepNum = parseInt(step, 10);

      if (range === '*') {
        for (let i = min; i <= max; i += stepNum) {
          values.add(i);
        }
      } else if (range.includes('-')) {
        const [start, end] = range.split('-').map(s => parseInt(s, 10));
        for (let i = start; i <= end; i += stepNum) {
          values.add(i);
        }
      } else {
        // Single value with step (e.g., "5/10")
        const start = parseInt(range, 10);
        for (let i = start; i <= max; i += stepNum) {
          values.add(i);
        }
      }
    } else if (part.includes('-')) {
      // Handle ranges: 1-5
      const [start, end] = part.split('-').map(s => parseInt(s, 10));
      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else {
      // Single value
      values.add(parseInt(part, 10));
    }
  }

  return values;
}
