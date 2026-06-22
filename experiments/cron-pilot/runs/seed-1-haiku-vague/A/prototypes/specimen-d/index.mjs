export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minStr, hourStr, domStr, monStr, dowStr] = fields;

  // Parse each field into a set of allowed values
  const minutes = parseField(minStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const daysOfMonth = parseField(domStr, 1, 31);
  const months = parseField(monStr, 1, 12);
  const daysOfWeek = parseField(dowStr, 0, 7); // 0 and 7 are both Sunday

  // Normalize day of week (7 -> 0)
  const normDow = new Set();
  for (const d of daysOfWeek) {
    normDow.add(d === 7 ? 0 : d);
  }

  // Start search from the next minute
  let candidate = new Date(after);
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Limit iterations to prevent infinite loops (e.g., 4 years worth of minutes)
  const maxIterations = 4 * 365 * 24 * 60;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1; // 1-12
    const day = candidate.getUTCDate();
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();
    const dow = candidate.getUTCDay(); // 0-6, 0 = Sunday

    // Check if this candidate matches all fields
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDayConstraint(day, dow, daysOfMonth, normDow)
    ) {
      return new Date(candidate);
    }

    // Advance to the next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("No matching cron time found");
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step syntax: */n or a-b/n
  if (field.includes("/")) {
    const [rangePart, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== "*") {
      if (rangePart.includes("-")) {
        const [start, end] = rangePart.split("-");
        rangeMin = parseInt(start, 10);
        rangeMax = parseInt(end, 10);

        if (isNaN(rangeMin) || isNaN(rangeMax)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
      } else {
        rangeMin = parseInt(rangePart, 10);
        rangeMax = max;

        if (isNaN(rangeMin)) {
          throw new Error(`Invalid value: ${rangePart}`);
        }
      }
    }

    for (let i = rangeMin; i <= rangeMax; i += step) {
      if (i >= min && i <= max) {
        result.add(i);
      }
    }

    return result;
  }

  // Handle comma-separated list or range
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [start, end] = part.split("-");
      const startVal = parseInt(start, 10);
      const endVal = parseInt(end, 10);

      if (isNaN(startVal) || isNaN(endVal)) {
        throw new Error(`Invalid range: ${part}`);
      }

      if (startVal > endVal) {
        throw new Error(`Invalid range: ${part} (start > end)`);
      }

      for (let i = startVal; i <= endVal; i++) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else {
      const val = parseInt(part, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value: ${part}`);
      }

      if (val >= min && val <= max) {
        result.add(val);
      } else {
        throw new Error(`Value ${val} out of range [${min}, ${max}]`);
      }
    }
  }

  return result;
}

function matchesDayConstraint(day, dow, daysOfMonth, daysOfWeek) {
  // Special handling for day-of-month and day-of-week
  // If both are restricted (not *), then the date matches if EITHER constraint is satisfied
  // If only one is restricted, that one must match
  // If both are *, any day matches

  const domRestricted = daysOfMonth.size < 31;
  const dowRestricted = daysOfWeek.size < 7;

  const domMatch = daysOfMonth.has(day);
  const dowMatch = daysOfWeek.has(dow);

  if (domRestricted && dowRestricted) {
    // Both restricted: match if either condition is met
    return domMatch || dowMatch;
  } else if (domRestricted) {
    // Only DOM restricted
    return domMatch;
  } else if (dowRestricted) {
    // Only DOW restricted
    return dowMatch;
  } else {
    // Neither restricted
    return true;
  }
}
