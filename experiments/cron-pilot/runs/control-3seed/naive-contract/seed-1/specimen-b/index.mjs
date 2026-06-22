export function nextRun(expr, after) {
  // Validate inputs
  if (typeof expr !== 'string') throw new Error('Expression must be a string');
  if (!(after instanceof Date)) throw new Error('after must be a Date');
  if (isNaN(after.getTime())) throw new Error('after is an invalid Date');

  // Parse the cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error('Cron expression must have 5 fields');

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const daysOfMonth = parseField(domExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const daysOfWeek = parseField(dowExpr, 0, 6);

  // Start from the next minute
  let date = new Date(after.getTime());
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  date.setUTCMinutes(date.getUTCMinutes() + 1);

  // Search for next matching time (with reasonable limit to prevent infinite loops)
  const maxIterations = 366 * 24 * 60; // roughly one year in minutes
  for (let i = 0; i < maxIterations; i++) {
    const minute = date.getUTCMinutes();
    const hour = date.getUTCHours();
    const dom = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const dow = date.getUTCDay();

    // Check if current time matches the cron expression
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDayOfMonthAndWeek(dom, dow, daysOfMonth, daysOfWeek)
    ) {
      return new Date(date.getTime());
    }

    // Advance to next minute
    date.setUTCMinutes(date.getUTCMinutes() + 1);
  }

  throw new Error('Could not find next run time within reasonable limit');
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values (e.g., */15, 0-30/5)
  if (field.includes('/')) {
    const [rangePart, stepPart] = field.split('/');
    const step = parseInt(stepPart, 10);
    if (isNaN(step) || step <= 0) throw new Error(`Invalid step: ${stepPart}`);

    if (rangePart === '*') {
      for (let i = min; i <= max; i += step) {
        result.add(i);
      }
    } else if (rangePart.includes('-')) {
      const [start, end] = rangePart.split('-').map((x) => parseInt(x, 10));
      if (isNaN(start) || isNaN(end)) throw new Error(`Invalid range: ${rangePart}`);
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) result.add(i);
      }
    } else {
      const start = parseInt(rangePart, 10);
      if (isNaN(start)) throw new Error(`Invalid value: ${rangePart}`);
      for (let i = start; i <= max; i += step) {
        if (i >= min && i <= max) result.add(i);
      }
    }
    return result;
  }

  // Handle ranges (e.g., 1-5)
  if (field.includes('-')) {
    const parts = field.split('-');
    if (parts.length !== 2) throw new Error(`Invalid range: ${field}`);
    const [start, end] = parts.map((x) => parseInt(x, 10));
    if (isNaN(start) || isNaN(end)) throw new Error(`Invalid range: ${field}`);
    for (let i = start; i <= end; i++) {
      if (i >= min && i <= max) result.add(i);
    }
    return result;
  }

  // Handle lists (e.g., 1,3,5)
  if (field.includes(',')) {
    field.split(',').forEach((part) => {
      const val = parseInt(part.trim(), 10);
      if (isNaN(val)) throw new Error(`Invalid value in list: ${part}`);
      if (val >= min && val <= max) result.add(val);
    });
    return result;
  }

  // Handle single values
  const val = parseInt(field, 10);
  if (isNaN(val)) throw new Error(`Invalid value: ${field}`);
  if (val >= min && val <= max) result.add(val);
  return result;
}

function matchesDayOfMonthAndWeek(dom, dow, daysOfMonth, daysOfWeek) {
  // In standard cron, if both dom and dow are restricted (not *),
  // the day matches if EITHER dom OR dow matches (union semantics).
  // If either is unrestricted (*), use only the restricted one.

  const domRestricted = daysOfMonth.size < 31;
  const dowRestricted = daysOfWeek.size < 7;

  if (!domRestricted && !dowRestricted) {
    // Both are *, so any day matches
    return true;
  }

  if (!domRestricted) {
    // Only dow is restricted
    return daysOfWeek.has(dow);
  }

  if (!dowRestricted) {
    // Only dom is restricted
    return daysOfMonth.has(dom);
  }

  // Both restricted: match if either dom or dow matches
  return daysOfMonth.has(dom) || daysOfWeek.has(dow);
}
