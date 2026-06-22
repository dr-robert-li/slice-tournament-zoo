export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("Invalid after date");
  }

  // Parse cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = fields;

  // Parse each field into allowed values
  const minute = parseField(minuteStr, 0, 59);
  const hour = parseField(hourStr, 0, 23);
  const dom = parseField(domStr, 1, 31);
  const month = parseField(monthStr, 1, 12);
  const dow = parseField(dowStr, 0, 6);

  // Determine if dom/dow are restricted (not wildcards)
  const domRestricted = domStr !== "*";
  const dowRestricted = dowStr !== "*";

  // Normalize "after" to next minute boundary with 0 seconds
  const candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Day-scan loop with infinite-loop guard
  const maxDaysToScan = 365 * 10; // ~10 years should cover leap year gaps
  for (let dayCount = 0; dayCount < maxDaysToScan; dayCount++) {
    const year = candidate.getUTCFullYear();
    const monthNum = candidate.getUTCMonth() + 1; // Convert to 1-indexed
    const dayNum = candidate.getUTCDate();
    const dowNum = candidate.getUTCDay();

    // Check if date matches
    const domMatch = dom.has(dayNum);
    const monthMatch = month.has(monthNum);
    const dowMatch = dow.has(dowNum);

    let dateMatches = false;
    if (domRestricted && dowRestricted) {
      // Union: either dom or dow must match (and month always required)
      dateMatches = monthMatch && (domMatch || dowMatch);
    } else {
      // Intersection: all must match (wildcards are always true)
      dateMatches = monthMatch && domMatch && dowMatch;
    }

    if (dateMatches) {
      // Find earliest matching time on this day
      const result = findEarliestTime(candidate, hour, minute);
      if (result !== null) {
        return result;
      }
    }

    // Advance to next day at 00:00
    candidate.setUTCDate(candidate.getUTCDate() + 1);
    candidate.setUTCHours(0, 0, 0, 0);
  }

  throw new Error("No matching execution time found within search limit");
}

/**
 * Parse a single cron field into a Set of allowed values
 */
function parseField(field, minVal, maxVal) {
  const allowed = new Set();

  if (field === "*") {
    // Wildcard: all values in range
    for (let i = minVal; i <= maxVal; i++) {
      allowed.add(i);
    }
    return allowed;
  }

  // Handle comma-separated parts
  const parts = field.split(",");
  for (const part of parts) {
    if (part === "") {
      throw new Error("Empty field component");
    }

    // Check for step (*/n or a-b/n or a/n)
    if (part.includes("/")) {
      const [rangePart, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);

      if (!Number.isInteger(step) || step <= 0) {
        throw new Error("Step must be a positive integer");
      }

      let rangeStart, rangeEnd;
      if (rangePart === "*") {
        rangeStart = minVal;
        rangeEnd = maxVal;
      } else if (rangePart.includes("-")) {
        [rangeStart, rangeEnd] = parseRange(rangePart, minVal, maxVal);
      } else {
        rangeStart = parseInt(rangePart, 10);
        rangeEnd = maxVal;
        if (!Number.isInteger(rangeStart) || rangeStart < minVal || rangeStart > maxVal) {
          throw new Error(`Value out of range: ${rangeStart}`);
        }
      }

      for (let i = rangeStart; i <= rangeEnd; i += step) {
        allowed.add(i);
      }
    } else if (part.includes("-")) {
      // Range without step
      const [rangeStart, rangeEnd] = parseRange(part, minVal, maxVal);
      for (let i = rangeStart; i <= rangeEnd; i++) {
        allowed.add(i);
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (!Number.isInteger(val) || val < minVal || val > maxVal) {
        throw new Error(`Value out of range: ${val}`);
      }
      allowed.add(val);
    }
  }

  if (allowed.size === 0) {
    throw new Error("Field resulted in no allowed values");
  }

  return allowed;
}

/**
 * Parse a range like "a-b" and return [start, end]
 */
function parseRange(rangePart, minVal, maxVal) {
  const parts = rangePart.split("-");
  if (parts.length !== 2) {
    throw new Error("Invalid range format");
  }

  const start = parseInt(parts[0], 10);
  const end = parseInt(parts[1], 10);

  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new Error("Range values must be integers");
  }

  if (start < minVal || start > maxVal || end < minVal || end > maxVal) {
    throw new Error("Range out of bounds");
  }

  if (start > end) {
    throw new Error("Inverted range");
  }

  return [start, end];
}

/**
 * Find the earliest matching time on a given day
 * Returns a Date if found, null if no match on this day
 */
function findEarliestTime(dayDate, allowedHours, allowedMinutes) {
  const floorHour = dayDate.getUTCHours();
  const floorMinute = dayDate.getUTCMinutes();

  // Convert Sets to sorted arrays for easier iteration
  const hours = Array.from(allowedHours).sort((a, b) => a - b);
  const minutes = Array.from(allowedMinutes).sort((a, b) => a - b);

  // Try floor hour first
  if (hours.includes(floorHour)) {
    // Find smallest minute >= floorMinute
    const minInFloor = minutes.find((m) => m >= floorMinute);
    if (minInFloor !== undefined) {
      const result = new Date(dayDate.getTime());
      result.setUTCHours(floorHour, minInFloor, 0, 0);
      return result;
    }
  }

  // Try later hours on the same day
  for (const h of hours) {
    if (h > floorHour) {
      // Take smallest minute
      const minForHour = minutes[0];
      const result = new Date(dayDate.getTime());
      result.setUTCHours(h, minForHour, 0, 0);
      return result;
    }
  }

  // No match on this day
  return null;
}
