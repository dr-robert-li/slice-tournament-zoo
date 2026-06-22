export function nextRun(expr, after) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression: expected 5 fields');
  }

  const [minPart, hourPart, dayPart, monthPart, dowPart] = parts;

  // Parse each cron field into a set of valid values
  const minutes = parseField(minPart, 0, 59);
  const hours = parseField(hourPart, 0, 23);
  const days = parseField(dayPart, 1, 31);
  const months = parseField(monthPart, 1, 12);
  const dows = parseField(dowPart, 0, 6);

  // Start searching from one minute after the given time
  let current = new Date(after.getTime());
  current.setUTCSeconds(0);
  current.setUTCMilliseconds(0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Search up to 4 years ahead to avoid infinite loops
  const maxTime = after.getTime() + 4 * 365 * 24 * 60 * 60 * 1000;

  while (current.getTime() < maxTime) {
    const minute = current.getUTCMinutes();
    const hour = current.getUTCHours();
    const day = current.getUTCDate();
    const month = current.getUTCMonth() + 1;
    const dow = current.getUTCDay();

    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      days.has(day) &&
      months.has(month) &&
      dows.has(dow)
    ) {
      return new Date(current.getTime());
    }

    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error('No matching time found within search window');
}

function parseField(field, min, max) {
  const values = new Set();

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle */n (every n)
  if (field.startsWith('*/')) {
    const step = parseInt(field.substring(2), 10);
    for (let i = min; i <= max; i += step) {
      values.add(i);
    }
    return values;
  }

  // Handle comma-separated values
  const parts = field.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      // Handle range (e.g., 1-5)
      const [start, end] = part.split('-').map(v => parseInt(v, 10));
      for (let i = start; i <= end; i++) {
        values.add(i);
      }
    } else if (part.includes('/')) {
      // Handle range with step (e.g., 0-59/15)
      const [range, step] = part.split('/');
      const stepVal = parseInt(step, 10);
      if (range === '*') {
        for (let i = min; i <= max; i += stepVal) {
          values.add(i);
        }
      } else {
        const [start, end] = range.split('-').map(v => parseInt(v, 10));
        for (let i = start; i <= end; i += stepVal) {
          values.add(i);
        }
      }
    } else {
      // Single value
      values.add(parseInt(part, 10));
    }
  }

  return values;
}
