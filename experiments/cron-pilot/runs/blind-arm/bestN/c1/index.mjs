export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  // Parse cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Invalid cron expression: expected 5 fields');
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field into a Set of allowed values
  const minuteSet = parseField(minuteExpr, 0, 59);
  const hourSet = parseField(hourExpr, 0, 23);
  const domSet = parseField(domExpr, 1, 31);
  const monthSet = parseField(monthExpr, 1, 12);
  const dowSet = parseField(dowExpr, 0, 6);

  // Determine if dom/dow are restricted (not '*')
  const domRestricted = domExpr !== '*';
  const dowRestricted = dowExpr !== '*';

  // Start search from the minute strictly after 'after'
  // Floor to minute boundary (zero seconds/ms) and add 1 minute
  const startMs = Math.floor(after.getTime() / 60000) * 60000 + 60000;
  let current = new Date(startMs);

  // Search up to ~5 years ahead
  const maxIterations = 5 * 365 * 24 * 60; // ~5 years in minutes
  for (let i = 0; i < maxIterations; i++) {
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1; // getUTCMonth() is 0-11
    const dom = current.getUTCDate();
    const dow = current.getUTCDay(); // 0=Sun, 6=Sat
    const hour = current.getUTCHours();
    const minute = current.getUTCMinutes();

    // Check if this minute matches the cron expression
    if (
      minuteSet.has(minute) &&
      hourSet.has(hour) &&
      monthSet.has(month) &&
      isValidDay(domSet, dowSet, dom, dow, domRestricted, dowRestricted)
    ) {
      return current;
    }

    // Advance to next minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error('No matching time found within 5 years');
}

function parseField(field, min, max) {
  const set = new Set();

  if (field === '*') {
    // All values in range
    for (let i = min; i <= max; i++) {
      set.add(i);
    }
    return set;
  }

  // Handle step notation (*/n or a-b/n)
  if (field.includes('/')) {
    const [rangePart, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    if (rangePart === '*') {
      // */n notation
      for (let i = min; i <= max; i += step) {
        set.add(i);
      }
    } else {
      // a-b/n notation
      const [startStr, endStr] = rangePart.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${rangePart}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: start > end (${start}-${end})`);
      }
      if (start < min || end > max) {
        throw new Error(`Range out of bounds: ${start}-${end} (valid: ${min}-${max})`);
      }

      for (let i = start; i <= end; i += step) {
        set.add(i);
      }
    }
    return set;
  }

  // Handle list (comma-separated) and range notation
  const terms = field.split(',');
  for (const term of terms) {
    if (term.includes('-')) {
      // Range a-b
      const [startStr, endStr] = term.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${term}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: start > end (${start}-${end})`);
      }
      if (start < min || end > max) {
        throw new Error(`Range out of bounds: ${start}-${end} (valid: ${min}-${max})`);
      }

      for (let i = start; i <= end; i++) {
        set.add(i);
      }
    } else {
      // Single value
      const value = parseInt(term, 10);
      if (isNaN(value)) {
        throw new Error(`Invalid value: ${term}`);
      }
      if (value < min || value > max) {
        throw new Error(`Value out of range: ${value} (valid: ${min}-${max})`);
      }
      set.add(value);
    }
  }

  return set;
}

function isValidDay(domSet, dowSet, dom, dow, domRestricted, dowRestricted) {
  if (domRestricted && dowRestricted) {
    // Both restricted: day matches if dom OR dow matches
    return domSet.has(dom) || dowSet.has(dow);
  } else {
    // At least one is '*': day matches if dom AND dow match
    // Since '*' produces a set with all values, this simplifies to AND
    return domSet.has(dom) && dowSet.has(dow);
  }
}
