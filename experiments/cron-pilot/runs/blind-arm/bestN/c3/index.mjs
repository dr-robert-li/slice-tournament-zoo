export function nextRun(expr, after) {
  // Validate inputs
  if (typeof expr !== 'string') {
    throw new TypeError('expr must be a string');
  }
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new TypeError('after must be a valid Date');
  }

  // Parse cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field into a Set of valid values
  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const doms = parseField(domExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const dows = parseField(dowExpr, 0, 6);

  // Check if DOM and DOW are both restricted (not literally "*")
  const domRestricted = domExpr !== '*';
  const dowRestricted = dowExpr !== '*';

  // Start with the next minute boundary after `after`
  const afterTime = after.getTime();
  const afterMs = new Date(afterTime);
  afterMs.setUTCMilliseconds(0);
  afterMs.setUTCSeconds(0);
  let candidateTime = afterMs.getTime() + 60000; // Add 1 minute

  // Search up to ~8 years ahead to handle leap year edge cases
  const maxSearchMs = candidateTime + (8 * 365.25 * 24 * 60 * 60 * 1000);

  while (candidateTime < maxSearchMs) {
    const candidate = new Date(candidateTime);

    const month = candidate.getUTCMonth() + 1; // 1-12
    const dom = candidate.getUTCDate(); // 1-31
    const dow = candidate.getUTCDay(); // 0-6, 0=Sunday
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();

    // Check if month matches
    if (!months.has(month)) {
      // Skip to next month
      candidate.setUTCDate(1);
      candidate.setUTCMonth(candidate.getUTCMonth() + 1);
      candidate.setUTCHours(0);
      candidate.setUTCMinutes(0);
      candidateTime = candidate.getTime();
      continue;
    }

    // Check DOM/DOW rule: if both restricted, use OR; otherwise use the restricted one
    let dayMatches = false;
    if (domRestricted && dowRestricted) {
      dayMatches = doms.has(dom) || dows.has(dow);
    } else if (domRestricted) {
      dayMatches = doms.has(dom);
    } else if (dowRestricted) {
      dayMatches = dows.has(dow);
    } else {
      dayMatches = true; // both "*"
    }

    if (!dayMatches) {
      // Move to next day
      candidateTime += 86400000;
      continue;
    }

    // Day matches; check hour and minute
    if (!hours.has(hour) || !minutes.has(minute)) {
      // Move to next minute
      candidateTime += 60000;
      continue;
    }

    // All fields match
    return new Date(candidateTime);
  }

  throw new Error('No valid cron firing time found within search horizon');
}

function parseField(fieldExpr, minVal, maxVal) {
  const result = new Set();

  if (fieldExpr === '*') {
    // Match all values in range
    for (let i = minVal; i <= maxVal; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step expressions: */n or a-b/n
  const stepMatch = fieldExpr.match(/^(.+)\/(\d+)$/);
  if (stepMatch) {
    const baseExpr = stepMatch[1];
    const step = parseInt(stepMatch[2], 10);

    if (step <= 0) {
      throw new Error(`Invalid step value: ${step}`);
    }

    let start = minVal;
    let end = maxVal;

    if (baseExpr !== '*') {
      // Range like a-b/n
      const rangeParts = baseExpr.split('-');
      if (rangeParts.length === 2) {
        if (!/^\d+$/.test(rangeParts[0]) || !/^\d+$/.test(rangeParts[1])) {
          throw new Error(`Invalid range in step expression: ${fieldExpr}`);
        }
        start = parseInt(rangeParts[0], 10);
        end = parseInt(rangeParts[1], 10);
        if (start > end) {
          throw new Error(`Invalid range: ${start} > ${end}`);
        }
      } else if (rangeParts.length === 1) {
        // Single value with step, treat as a-maxVal/step
        if (!/^\d+$/.test(rangeParts[0])) {
          throw new Error(`Invalid value in step expression: ${fieldExpr}`);
        }
        start = parseInt(rangeParts[0], 10);
        end = maxVal;
      } else {
        throw new Error(`Invalid step expression: ${fieldExpr}`);
      }
    }

    if (start < minVal || start > maxVal || end < minVal || end > maxVal) {
      throw new Error(`Range out of bounds [${minVal}, ${maxVal}]: ${fieldExpr}`);
    }

    for (let i = start; i <= end; i += step) {
      result.add(i);
    }

    return result;
  }

  // Handle lists and ranges
  const parts = fieldExpr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();

    if (trimmed.includes('-')) {
      // Range: a-b
      const rangeParts = trimmed.split('-');
      if (rangeParts.length !== 2) {
        throw new Error(`Invalid range: ${trimmed}`);
      }

      // Validate tokens are pure digits
      if (!/^\d+$/.test(rangeParts[0]) || !/^\d+$/.test(rangeParts[1])) {
        throw new Error(`Invalid range values: ${trimmed}`);
      }

      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);

      if (start > end) {
        throw new Error(`Invalid range: ${start} > ${end}`);
      }
      if (start < minVal || end > maxVal) {
        throw new Error(`Range out of bounds [${minVal}, ${maxVal}]: ${trimmed}`);
      }

      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      // Single value
      if (!/^\d+$/.test(trimmed)) {
        throw new Error(`Invalid value: ${trimmed}`);
      }

      const val = parseInt(trimmed, 10);
      if (val < minVal || val > maxVal) {
        throw new Error(`Value out of bounds [${minVal}, ${maxVal}]: ${val}`);
      }
      result.add(val);
    }
  }

  return result;
}
