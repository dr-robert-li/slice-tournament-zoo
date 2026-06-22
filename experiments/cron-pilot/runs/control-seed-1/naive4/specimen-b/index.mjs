export function nextRun(expr, after) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression: expected 5 fields');
  }

  const [minuteStr, hourStr, dayStr, monthStr, dowStr] = parts;

  // Parse cron fields into allowed values
  const minutes = parseCronField(minuteStr, 0, 59);
  const hours = parseCronField(hourStr, 0, 23);
  const days = parseCronField(dayStr, 1, 31);
  const months = parseCronField(monthStr, 1, 12);
  const dows = parseCronField(dowStr, 0, 6); // 0 = Sunday, 1 = Monday, etc.

  // Start from the minute after 'after'
  const start = new Date(after.getTime());
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() + 1);

  // Try to find next matching datetime (limit search to prevent infinite loop)
  for (let attempt = 0; attempt < 366 * 24 * 60; attempt++) {
    const y = start.getUTCFullYear();
    const mo = start.getUTCMonth() + 1;
    const d = start.getUTCDate();
    const h = start.getUTCHours();
    const mi = start.getUTCMinutes();
    const dow = start.getUTCDay();

    if (
      minutes.has(mi) &&
      hours.has(h) &&
      days.has(d) &&
      months.has(mo) &&
      dows.has(dow)
    ) {
      return new Date(start.getTime());
    }

    // Increment by 1 minute
    start.setUTCMinutes(start.getUTCMinutes() + 1);
  }

  throw new Error('No matching cron time found within search window');
}

function parseCronField(field, min, max) {
  const values = new Set();

  if (field === '*') {
    // All values in range
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
  } else if (field.includes('/')) {
    // Handle step values: */n, min-max/n, or n/step
    const [rangePart, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);

    if (rangePart === '*') {
      // */step: start from min, increment by step
      for (let i = min; i <= max; i += step) {
        values.add(i);
      }
    } else if (rangePart.includes('-')) {
      // min-max/step
      const [startStr, endStr] = rangePart.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      for (let i = start; i <= end; i += step) {
        values.add(i);
      }
    } else {
      // n/step: start from n, increment by step
      const start = parseInt(rangePart, 10);
      for (let i = start; i <= max; i += step) {
        values.add(i);
      }
    }
  } else if (field.includes('-')) {
    // Range: min-max
    const [startStr, endStr] = field.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    for (let i = start; i <= end; i++) {
      values.add(i);
    }
  } else if (field.includes(',')) {
    // List: val1,val2,val3
    const parts = field.split(',');
    for (const part of parts) {
      const val = parseInt(part, 10);
      if (val >= min && val <= max) {
        values.add(val);
      }
    }
  } else {
    // Single value
    const val = parseInt(field, 10);
    if (val >= min && val <= max) {
      values.add(val);
    }
  }

  return values;
}
