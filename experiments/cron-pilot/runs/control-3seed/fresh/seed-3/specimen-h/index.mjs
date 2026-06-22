export function nextRun(expr, after) {
  // Validate input
  if (typeof expr !== 'string') {
    throw new Error('expr must be a string');
  }
  if (!(after instanceof Date)) {
    throw new Error('after must be a Date');
  }
  if (!Number.isFinite(after.getTime())) {
    throw new Error('after must be a valid Date');
  }

  // Parse cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('cron expression must have exactly 5 fields');
  }

  let [minuteStr, hourStr, domStr, monthStr, dowStr] = fields;

  // Parse each field
  let minutes = parseField(minuteStr, 0, 59);
  let hours = parseField(hourStr, 0, 23);
  let doms = parseField(domStr, 1, 31);
  let months = parseField(monthStr, 1, 12);
  let dows = parseField(dowStr, 0, 6);

  // Validate parsed fields
  if (!minutes || minutes.size === 0) {
    throw new Error('minute field produces no valid values');
  }
  if (!hours || hours.size === 0) {
    throw new Error('hour field produces no valid values');
  }
  if (!doms || doms.size === 0) {
    throw new Error('dom field produces no valid values');
  }
  if (!months || months.size === 0) {
    throw new Error('month field produces no valid values');
  }
  if (!dows || dows.size === 0) {
    throw new Error('dow field produces no valid values');
  }

  // Start search from the next minute
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search bound: ~4 years from now
  const maxTime = after.getTime() + 4 * 365.25 * 24 * 60 * 60 * 1000;

  while (candidate.getTime() < maxTime) {
    const minute = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const date = candidate.getUTCDate();
    const month = candidate.getUTCMonth() + 1; // JS months are 0-11
    const dow = candidate.getUTCDay(); // 0=Sunday, 6=Saturday

    const minuteMatch = minutes.has(minute);
    const hourMatch = hours.has(hour);
    const monthMatch = months.has(month);

    // DOM/DOW union: cron fires if EITHER dom OR dow matches (when not both *)
    const domWild = domStr === '*';
    const dowWild = dowStr === '*';
    let dayMatch;

    if (domWild && dowWild) {
      // Both wildcards: any day matches
      dayMatch = true;
    } else if (domWild) {
      // Only DOM is wildcard: use DOW
      dayMatch = dows.has(dow);
    } else if (dowWild) {
      // Only DOW is wildcard: use DOM
      dayMatch = doms.has(date);
    } else {
      // Both specified: union (fire if either matches)
      dayMatch = doms.has(date) || dows.has(dow);
    }

    if (minuteMatch && hourMatch && dayMatch && monthMatch) {
      return new Date(candidate.getTime());
    }

    // Advance one minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('no valid firing time found within search window');
}

function parseField(fieldStr, min, max) {
  const values = new Set();

  // Handle asterisk with optional step
  if (fieldStr === '*') {
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  if (fieldStr.startsWith('*/')) {
    const step = parseInt(fieldStr.slice(2), 10);
    if (!Number.isFinite(step) || step <= 0) {
      throw new Error(`invalid step in field: ${fieldStr}`);
    }
    if (step === 0) {
      throw new Error('step cannot be zero');
    }
    for (let i = min; i <= max; i += step) {
      values.add(i);
    }
    return values;
  }

  // Handle comma-separated list
  const parts = fieldStr.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      // Range or range with step
      const rangeParts = part.split('/');
      const range = rangeParts[0];
      const step = rangeParts.length > 1 ? parseInt(rangeParts[1], 10) : 1;

      if (!Number.isFinite(step) || step <= 0) {
        throw new Error(`invalid step in field: ${fieldStr}`);
      }

      const [startStr, endStr] = range.split('-');
      let start = parseInt(startStr, 10);
      let end = parseInt(endStr, 10);

      if (!Number.isFinite(start) || !Number.isFinite(end)) {
        throw new Error(`invalid range in field: ${fieldStr}`);
      }

      if (start > end) {
        throw new Error(`inverted range in field: ${fieldStr}`);
      }

      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else if (part.includes('/')) {
      // Step without explicit range (should be rare but valid)
      const [rangeStr, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);

      if (!Number.isFinite(step) || step <= 0) {
        throw new Error(`invalid step in field: ${fieldStr}`);
      }

      if (rangeStr === '*') {
        for (let i = min; i <= max; i += step) {
          values.add(i);
        }
      } else {
        throw new Error(`invalid field syntax: ${fieldStr}`);
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (!Number.isFinite(val)) {
        throw new Error(`invalid value in field: ${fieldStr}`);
      }
      if (val < min || val > max) {
        throw new Error(`value ${val} out of range [${min}, ${max}] in field: ${fieldStr}`);
      }
      values.add(val);
    }
  }

  return values;
}
