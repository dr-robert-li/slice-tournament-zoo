export function nextRun(expr, after) {
  if (!expr || typeof expr !== 'string') {
    throw new Error('Invalid cron expression: must be a non-empty string');
  }
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid reference date: must be a valid Date');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Invalid cron expression: expected 5 fields, got ${fields.length}`);
  }

  const [minuteField, hourField, dayField, monthField, dowField] = fields;

  // Parse each field into allowed values
  const minutes = parseField(minuteField, 0, 59, 'minute');
  const hours = parseField(hourField, 0, 23, 'hour');
  const days = parseField(dayField, 1, 31, 'day-of-month');
  const months = parseField(monthField, 1, 12, 'month');
  const dows = parseField(dowField, 0, 6, 'day-of-week');

  // Start from the next minute
  let current = new Date(after.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Iterate to find the next matching time
  // Limit iterations to prevent infinite loops (max ~1 year of minutes)
  const maxIterations = 600000;
  for (let i = 0; i < maxIterations; i++) {
    const minute = current.getUTCMinutes();
    const hour = current.getUTCHours();
    const day = current.getUTCDate();
    const month = current.getUTCMonth() + 1; // 1-12
    const dow = current.getUTCDay(); // 0-6, 0 = Sunday

    const minuteMatch = minutes.has(minute);
    const hourMatch = hours.has(hour);
    const monthMatch = months.has(month);

    // Day matching: either day-of-month OR day-of-week can match
    // If both are restricted (not *), then either matching satisfies
    const dayRestricted = days.size < 31;
    const dowRestricted = dows.size < 7;

    let dayMatch = false;
    if (dayRestricted || dowRestricted) {
      if (dayRestricted) dayMatch = dayMatch || days.has(day);
      if (dowRestricted) dayMatch = dayMatch || dows.has(dow);
      // If both are restricted, either one must match
      if (dayRestricted && dowRestricted) {
        dayMatch = days.has(day) || dows.has(dow);
      }
    } else {
      // Both are unrestricted (*)
      dayMatch = true;
    }

    if (minuteMatch && hourMatch && dayMatch && monthMatch) {
      return current;
    }

    // Move to next minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error('Could not find next run within reasonable time');
}

/**
 * Parse a cron field and return a Set of valid values.
 * Handles: asterisk, ranges (a-b), steps (times/n, a-b/n), lists (comma-separated)
 */
function parseField(fieldStr, min, max, fieldName) {
  const result = new Set();

  if (fieldStr === '*') {
    // All values in range
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step syntax like */5 or 10-20/2
  let parts = fieldStr;
  let step = 1;

  if (fieldStr.includes('/')) {
    const slashIdx = fieldStr.indexOf('/');
    const rangePart = fieldStr.substring(0, slashIdx);
    const stepPart = fieldStr.substring(slashIdx + 1);
    parts = rangePart;
    step = parseInt(stepPart, 10);
    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value in ${fieldName}: ${stepPart}`);
    }
  }

  // Now process the range/list part
  const expressions = parts.split(',');

  for (let expr of expressions) {
    expr = expr.trim();

    if (expr === '*') {
      // Asterisk in a list context: e.g., */5 means all values with step
      for (let i = min; i <= max; i += step) {
        result.add(i);
      }
    } else if (expr.includes('-')) {
      // Range: a-b
      const dashIdx = expr.indexOf('-');
      const startStr = expr.substring(0, dashIdx);
      const endStr = expr.substring(dashIdx + 1);
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range in ${fieldName}: ${expr}`);
      }
      if (start < min || start > max || end < min || end > max) {
        throw new Error(`Range out of bounds in ${fieldName}: ${expr}`);
      }
      if (start > end) {
        throw new Error(`Invalid range in ${fieldName}: start > end (${expr})`);
      }

      // Add values with step
      for (let i = start; i <= end; i += step) {
        result.add(i);
      }
    } else {
      // Single value
      const val = parseInt(expr, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value in ${fieldName}: ${expr}`);
      }
      if (val < min || val > max) {
        throw new Error(`Value out of range in ${fieldName}: ${val}`);
      }
      // Single values don't use step in standard cron, but we add it directly
      result.add(val);
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values for ${fieldName}`);
  }

  return result;
}
