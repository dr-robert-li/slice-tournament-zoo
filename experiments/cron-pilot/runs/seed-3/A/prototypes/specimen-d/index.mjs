export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error('after must be a Date');
  }
  if (isNaN(after.getTime())) {
    throw new Error('after must be a valid Date');
  }

  // Parse the cron expression
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Parse each field into a sorted set of allowed values
  const minutes = parseField(minuteStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const doms = parseField(domStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const dows = parseField(dowStr, 0, 7); // 0 and 7 are both Sunday

  // Normalize dow: convert 7 to 0
  const dowNormalized = new Set();
  for (const dow of dows) {
    dowNormalized.add(dow === 7 ? 0 : dow);
  }

  // Start from the next minute
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0);
  candidate.setUTCMilliseconds(0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search limit: 4 years (to handle leap years and edge cases)
  const limit = new Date(after.getTime() + 4 * 365.25 * 24 * 60 * 60 * 1000);

  while (candidate.getTime() <= limit.getTime()) {
    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1; // 1-12
    const dom = candidate.getUTCDate(); // 1-31
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();
    const dow = candidate.getUTCDay(); // 0-6

    // Check if this minute matches all constraints
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      (matchesDomOrDow(dom, month, year, doms, dowNormalized))
    ) {
      return new Date(candidate.getTime());
    }

    // Advance to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('Could not find next run within 4 years');
}

function parseField(fieldStr, min, max) {
  const set = new Set();

  // Handle "*"
  if (fieldStr === '*') {
    for (let i = min; i <= max; i++) {
      set.add(i);
    }
    return set;
  }

  // Handle "*/n" (step from min to max)
  const stepMatch = fieldStr.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const step = parseInt(stepMatch[1], 10);
    for (let i = min; i <= max; i += step) {
      set.add(i);
    }
    return set;
  }

  // Handle comma-separated list (including ranges and steps)
  const parts = fieldStr.split(',');
  for (const part of parts) {
    // Handle "a-b/n" (range with step)
    const rangeStepMatch = part.match(/^(\d+)-(\d+)\/(\d+)$/);
    if (rangeStepMatch) {
      const start = parseInt(rangeStepMatch[1], 10);
      const end = parseInt(rangeStepMatch[2], 10);
      const step = parseInt(rangeStepMatch[3], 10);
      for (let i = start; i <= end; i += step) {
        set.add(i);
      }
      continue;
    }

    // Handle "a-b" (range)
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let i = start; i <= end; i++) {
        set.add(i);
      }
      continue;
    }

    // Handle single number
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      set.add(num);
    }
  }

  if (set.size === 0) {
    throw new Error(`Invalid field: ${fieldStr}`);
  }

  return set;
}

function matchesDomOrDow(dom, month, year, doms, dows) {
  // Special rule: if both dom and dow are restricted (not wildcards),
  // the date matches if EITHER dom OR dow matches.
  // A field is restricted if it doesn't contain all possible values.

  // Determine max day in month
  const maxDom = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Check if dom is restricted (i.e., not all days 1-31)
  let domIsRestricted = false;
  for (let d = 1; d <= maxDom; d++) {
    if (!doms.has(d)) {
      domIsRestricted = true;
      break;
    }
  }

  // Check if dow is restricted (i.e., not all days 0-6)
  let dowIsRestricted = false;
  for (let d = 0; d <= 6; d++) {
    if (!dows.has(d)) {
      dowIsRestricted = true;
      break;
    }
  }

  // Both restricted: match if either dom or dow matches
  if (domIsRestricted && dowIsRestricted) {
    const domMatch = doms.has(dom);
    const dowMatch = dows.has(new Date(Date.UTC(year, month - 1, dom)).getUTCDay());
    return domMatch || dowMatch;
  }

  // Only dom restricted: match if dom matches
  if (domIsRestricted) {
    return doms.has(dom);
  }

  // Only dow restricted: match if dow matches
  if (dowIsRestricted) {
    return dows.has(new Date(Date.UTC(year, month - 1, dom)).getUTCDay());
  }

  // Neither restricted: always match (wildcard on both)
  return true;
}
