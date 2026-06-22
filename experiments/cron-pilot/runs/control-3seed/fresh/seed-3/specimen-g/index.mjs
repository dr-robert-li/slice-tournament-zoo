export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have 5 fields");
  }

  // Parse cron fields
  let [minExpr, hourExpr, domExpr, monExpr, dowExpr] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minExpr, 0, 59, "minute");
  const hours = parseField(hourExpr, 0, 23, "hour");
  const doms = domExpr === "*" ? null : parseField(domExpr, 1, 31, "day-of-month");
  const months = parseField(monExpr, 1, 12, "month");
  const dows = dowExpr === "*" ? null : parseField(dowExpr, 0, 6, "day-of-week");

  // Start from the next minute after `after`
  let current = new Date(after.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Increment and search for up to 4 years (safeguard against infinite loops)
  const startYear = current.getUTCFullYear();
  const maxIterations = 366 * 4 * 24 * 60; // 4 years of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1; // 1-12
    const dom = current.getUTCDate();
    const dow = current.getUTCDay(); // 0-6, 0 = Sunday
    const hour = current.getUTCHours();
    const minute = current.getUTCMinutes();

    // Check if all fields match
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchDayFields(dom, dow, doms, dows)
    ) {
      return new Date(current.getTime());
    }

    // Increment by minute and carry over fields
    current.setUTCMinutes(minute + 1);

    // Handle rollover
    if (current.getUTCMinutes() === 0) {
      // Minute rolled over, hour incremented
      if (current.getUTCHours() === 0) {
        // Hour rolled over, date incremented
        if (current.getUTCDate() === 1) {
          // Date rolled over to 1, month incremented
          if (current.getUTCMonth() === 0) {
            // Month rolled over to Jan, year incremented (OK, just continue)
          }
        }
      }
    }

    // Safeguard: if we've gone more than 4 years ahead, something is wrong
    if (year - startYear > 4) {
      throw new Error("No valid cron match found within 4 years");
    }
  }

  throw new Error("No valid cron match found (too many iterations)");
}

function matchDayFields(dom, dow, domSet, dowSet) {
  // DOM/DOW union logic:
  // - If both are null (both *): any day matches
  // - If only DOM is restricted: only DOM matters
  // - If only DOW is restricted: only DOW matters
  // - If both are restricted: either matches (OR/union)
  if (domSet === null && dowSet === null) {
    return true; // Both are *, match any day
  }
  if (domSet === null) {
    return dowSet.has(dow); // Only DOW restricted
  }
  if (dowSet === null) {
    return domSet.has(dom); // Only DOM restricted
  }
  // Both restricted: union (either DOM or DOW matches)
  return domSet.has(dom) || dowSet.has(dow);
}

function parseField(expr, min, max, fieldName) {
  const result = new Set();

  if (expr === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step without range: */n
  if (expr.startsWith("*/")) {
    const step = parseInt(expr.substring(2), 10);
    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step in ${fieldName}: ${expr}`);
    }
    for (let i = min; i <= max; i += step) {
      result.add(i);
    }
    return result;
  }

  // Handle ranges and lists
  const parts = expr.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      // Range or range with step
      const [rangePart, stepPart] = part.split("/");
      const [rangeStart, rangeEnd] = rangePart.split("-");

      const start = parseInt(rangeStart, 10);
      const end = parseInt(rangeEnd, 10);
      const step = stepPart ? parseInt(stepPart, 10) : 1;

      if (isNaN(start) || isNaN(end) || isNaN(step)) {
        throw new Error(`Invalid range in ${fieldName}: ${part}`);
      }

      if (step <= 0) {
        throw new Error(`Invalid step in ${fieldName}: ${part}`);
      }

      // Check for inverted range
      if (start > end) {
        throw new Error(`Inverted range in ${fieldName}: ${part}`);
      }

      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else if (part.includes("/")) {
      // Step without explicit range
      const [basePart, stepPart] = part.split("/");
      const step = parseInt(stepPart, 10);

      if (isNaN(step) || step <= 0) {
        throw new Error(`Invalid step in ${fieldName}: ${part}`);
      }

      if (basePart === "*") {
        for (let i = min; i <= max; i += step) {
          result.add(i);
        }
      } else {
        // Parse base as a single value
        const base = parseInt(basePart, 10);
        if (isNaN(base)) {
          throw new Error(`Invalid value in ${fieldName}: ${part}`);
        }
        for (let i = base; i <= max; i += step) {
          if (i >= min) {
            result.add(i);
          }
        }
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value in ${fieldName}: ${part}`);
      }
      if (val < min || val > max) {
        throw new Error(`Value out of range in ${fieldName}: ${val}`);
      }
      result.add(val);
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values in ${fieldName}: ${expr}`);
  }

  return result;
}
