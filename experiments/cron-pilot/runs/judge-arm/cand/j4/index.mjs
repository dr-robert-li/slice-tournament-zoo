export function nextRun(expr, after) {
  // Validate inputs
  if (typeof expr !== 'string') {
    throw new Error('Expression must be a string');
  }
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  // Parse expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minStr, hourStr, domStr, monthStr, dowStr] = fields;

  // Field bounds
  const bounds = {
    minute: [0, 59],
    hour: [0, 23],
    dom: [1, 31],
    month: [1, 12],
    dow: [0, 6],
  };

  // Parse each field into a set of allowed values
  const minutes = parseField(minStr, bounds.minute);
  const hours = parseField(hourStr, bounds.hour);
  const doms = parseField(domStr, bounds.dom);
  const months = parseField(monthStr, bounds.month);
  const dows = parseField(dowStr, bounds.dow);

  // Check if DOM and DOW are restricted (not '*')
  const domRestricted = domStr !== '*';
  const dowRestricted = dowStr !== '*';

  // Start from the next minute
  const start = new Date(after);
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() + 1);

  // Search up to ~5 years for the next matching time
  const maxIterations = 5 * 365.25 * 24 * 60; // ~5 years in minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const minute = start.getUTCMinutes();
    const hour = start.getUTCHours();
    const dom = start.getUTCDate();
    const month = start.getUTCMonth() + 1; // Convert 0-11 to 1-12
    const dow = start.getUTCDay(); // Already 0-6 with 0=Sunday

    // Check minute and hour
    if (!minutes.has(minute) || !hours.has(hour) || !months.has(month)) {
      start.setUTCMinutes(start.getUTCMinutes() + 1);
      continue;
    }

    // Check day logic (DOM/DOW interaction)
    let dayMatches = false;
    if (!domRestricted && !dowRestricted) {
      // Both '*' — every day matches
      dayMatches = true;
    } else if (domRestricted && !dowRestricted) {
      // Only DOM restricted
      dayMatches = doms.has(dom);
    } else if (!domRestricted && dowRestricted) {
      // Only DOW restricted
      dayMatches = dows.has(dow);
    } else {
      // Both restricted — match if either matches (OR semantics)
      dayMatches = doms.has(dom) || dows.has(dow);
    }

    if (dayMatches) {
      return new Date(start);
    }

    start.setUTCMinutes(start.getUTCMinutes() + 1);
  }

  throw new Error('No matching cron time found within 5 year horizon');
}

function parseField(fieldStr, [min, max]) {
  const result = new Set();

  if (fieldStr === '*') {
    // Match all values in range
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  const parts = fieldStr.split(',');
  for (const part of parts) {
    if (part.includes('/')) {
      // Step syntax: */n, a-b/n, or a/n
      const [rangePart, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);

      if (isNaN(step) || step <= 0) {
        throw new Error(`Invalid step value: ${stepStr}`);
      }

      let start, end;
      if (rangePart === '*') {
        start = min;
        end = max;
      } else if (rangePart.includes('-')) {
        const [s, e] = rangePart.split('-');
        start = parseInt(s, 10);
        end = parseInt(e, 10);
        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
        if (start > end) {
          throw new Error(`Invalid range: ${start} > ${end}`);
        }
      } else {
        // Single value with step (a/n means a to max with step n)
        start = parseInt(rangePart, 10);
        end = max;
        if (isNaN(start)) {
          throw new Error(`Invalid value: ${rangePart}`);
        }
      }

      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else if (part.includes('-')) {
      // Range syntax: a-b
      const [s, e] = part.split('-');
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: ${start} > ${end}`);
      }

      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value: ${part}`);
      }

      // Special case: allow 7 for Sunday in DOW field
      if (max === 6 && val === 7) {
        result.add(0);
      } else if (val >= min && val <= max) {
        result.add(val);
      } else {
        throw new Error(`Value out of range: ${val}`);
      }
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values in field: ${fieldStr}`);
  }

  return result;
}
