export function nextRun(expr, after) {
  // Validate input
  if (typeof expr !== 'string') throw new Error('Expression must be a string');
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have 5 fields');
  }

  // Parse each field
  let [minuteSpec, hourSpec, domSpec, monthSpec, dowSpec] = fields;

  // Start from the next minute (cron fires at minute boundaries)
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Prevent infinite loops - limit iterations
  const maxIterations = 4 * 365 * 24 * 60; // ~4 years
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const minute = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const day = candidate.getUTCDate();
    const month = candidate.getUTCMonth() + 1; // 1-12
    const year = candidate.getUTCFullYear();
    const dow = candidate.getUTCDay(); // 0-6, Sunday=0

    // Check if current time matches the cron expression
    if (
      matchesField(minute, minuteSpec, 0, 59) &&
      matchesField(hour, hourSpec, 0, 23) &&
      matchesField(month, monthSpec, 1, 12) &&
      matchesDayFields(day, dow, domSpec, dowSpec)
    ) {
      return candidate;
    }

    // Move to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error('No matching time found within reasonable range');
}

function matchesField(value, spec, min, max) {
  if (spec === '*') return true;

  const parts = spec.split(',');
  for (const part of parts) {
    if (matchesPart(value, part, min, max)) {
      return true;
    }
  }
  return false;
}

function matchesPart(value, part, min, max) {
  // Handle step values: */n or a-b/n
  if (part.includes('/')) {
    const [rangePart, stepStr] = part.split('/');
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== '*') {
      if (rangePart.includes('-')) {
        [rangeMin, rangeMax] = parseRange(rangePart, min, max);
      } else {
        rangeMin = parseInt(rangePart, 10);
        rangeMax = parseInt(rangePart, 10);
      }
    }

    // Check if value falls in the step sequence
    if (value < rangeMin || value > rangeMax) return false;
    return (value - rangeMin) % step === 0;
  }

  // Handle ranges: a-b
  if (part.includes('-')) {
    const [rangeMin, rangeMax] = parseRange(part, min, max);
    return value >= rangeMin && value <= rangeMax;
  }

  // Handle single values
  const num = parseInt(part, 10);
  if (isNaN(num)) {
    throw new Error(`Invalid field value: ${part}`);
  }
  if (num < min || num > max) {
    throw new Error(`Field value ${num} out of range [${min}, ${max}]`);
  }
  return value === num;
}

function parseRange(range, min, max) {
  const [startStr, endStr] = range.split('-');
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);

  if (isNaN(start) || isNaN(end)) {
    throw new Error(`Invalid range: ${range}`);
  }
  if (start > end) {
    throw new Error(`Invalid range: start > end in ${range}`);
  }
  if (start < min || end > max) {
    throw new Error(`Range ${range} out of bounds [${min}, ${max}]`);
  }

  return [start, end];
}

function matchesDayFields(day, dow, domSpec, dowSpec) {
  // The tricky part: if both dom and dow are restricted (not *),
  // then the date matches if EITHER dom OR dow matches (OR logic)
  // If one is *, then only the other matters (AND logic)

  const domIsWildcard = domSpec === '*';
  const dowIsWildcard = dowSpec === '*';

  const domMatches = domIsWildcard || matchesField(day, domSpec, 1, 31);
  const dowMatches = dowIsWildcard || matchesField(dow, dowSpec, 0, 7); // Allow 0-7 for Sunday

  // Handle day-of-week wraparound: 7 is also Sunday
  if (dowSpec !== '*' && !dowIsWildcard) {
    // Need to check if dow specification uses 7 for Sunday
    if (dow === 0 && matchesField(7, dowSpec, 0, 7)) {
      return domMatches || true;
    }
  }

  // If both are wildcards, it matches
  if (domIsWildcard && dowIsWildcard) {
    return true;
  }

  // If only one is a wildcard, only that one needs to match
  if (domIsWildcard) {
    return dowMatches;
  }
  if (dowIsWildcard) {
    return domMatches;
  }

  // Both are specified: match if either matches (OR logic)
  return domMatches || dowMatches;
}
