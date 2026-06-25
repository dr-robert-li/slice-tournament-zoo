export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  // Parse and validate cron expression
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Parse each field
  const minutes = parseField(minuteStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const doms = parseField(domStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const dows = parseField(dowStr, 0, 7, true); // Support 7 as Sunday, with normalization

  if (!minutes || !hours || !doms || !months || !dows) {
    throw new Error('Invalid cron field');
  }

  // Determine if DOM and DOW are restricted (not a bare '*')
  const domRestricted = domStr !== '*';
  const dowRestricted = dowStr !== '*';

  // Start with the next minute
  const candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search up to 9 years in the future
  const maxIterations = 9 * 365.25 * 24 * 60; // roughly 9 years in minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    const minute = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const dom = candidate.getUTCDate();
    const month = candidate.getUTCMonth() + 1; // Convert 0-11 to 1-12
    const dow = candidate.getUTCDay(); // 0 = Sunday, 6 = Saturday

    // Check if this candidate matches the cron expression
    const minuteMatch = minutes.has(minute);
    const hourMatch = hours.has(hour);
    const monthMatch = months.has(month);

    // Day matching: DOM/DOW interaction
    let dayMatch;
    if (domRestricted && dowRestricted) {
      // Both restricted: match if EITHER DOM OR DOW matches
      dayMatch = doms.has(dom) || dows.has(dow);
    } else if (domRestricted) {
      // Only DOM restricted
      dayMatch = doms.has(dom);
    } else if (dowRestricted) {
      // Only DOW restricted
      dayMatch = dows.has(dow);
    } else {
      // Neither restricted, all days match
      dayMatch = true;
    }

    if (minuteMatch && hourMatch && monthMatch && dayMatch) {
      return candidate;
    }

    // Advance to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
    iterations++;
  }

  throw new Error('No valid cron execution time found within 9 years');
}

function parseField(field, min, max, normalizeDow = false) {
  const result = new Set();

  // Split on comma first to handle lists
  const items = field.split(',');

  for (const item of items) {
    const vals = parseToken(item.trim(), min, max);
    if (!vals) return null;
    for (const v of vals) {
      let val = v;
      // Normalize DOW: 7 -> 0 for Sunday
      if (normalizeDow && v === 7) {
        val = 0;
      }
      result.add(val);
    }
  }

  return result.size > 0 ? result : null;
}

function toInt(s) {
  // Strict integer parsing: only accept pure digits
  if (!/^\d+$/.test(s)) {
    return NaN;
  }
  return parseInt(s, 10);
}

function parseToken(token, min, max) {
  // Parse a single token (no commas)

  if (token === '*') {
    // Match all values in range
    const result = [];
    for (let i = min; i <= max; i++) {
      result.push(i);
    }
    return result;
  }

  // Check for step syntax: base/n where base is * or a-b or a
  const slashParts = token.split('/');
  if (slashParts.length > 2) {
    return null; // Invalid: too many slashes
  }

  let base, step = 1;
  if (slashParts.length === 2) {
    base = slashParts[0];
    step = toInt(slashParts[1]);
    if (isNaN(step) || step < 1) {
      return null;
    }
  } else {
    base = token;
  }

  // Parse the base part (either *, a-b, or a)
  let start, end;

  if (base === '*') {
    start = min;
    end = max;
  } else if (base.includes('-')) {
    // Range a-b
    const rangeParts = base.split('-');
    if (rangeParts.length !== 2) {
      return null;
    }
    start = toInt(rangeParts[0]);
    end = toInt(rangeParts[1]);
    if (isNaN(start) || isNaN(end)) {
      return null;
    }
  } else {
    // Single value a
    start = toInt(base);
    if (isNaN(start)) {
      return null;
    }
    if (slashParts.length === 1) {
      // No step, just a single value
      end = start;
    } else {
      // a/n: from a to max
      end = max;
    }
  }

  // Validate bounds
  if (start < min || end > max || start > end) {
    return null;
  }

  // Generate values with step
  const result = [];
  for (let i = start; i <= end; i += step) {
    result.push(i);
  }

  return result;
}
