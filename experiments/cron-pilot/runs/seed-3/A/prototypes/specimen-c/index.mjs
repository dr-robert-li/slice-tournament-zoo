export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid 'after' date");
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = parts;

  // Parse each field
  const minutes = parseField(minuteExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const doms = parseField(domExpr, 1, 31);
  const months = parseField(monthExpr, 1, 12);
  const dows = parseField(dowExpr, 0, 6);

  // Validate parsing
  if (!minutes || !hours || !doms || !months || !dows) {
    throw new Error("Invalid cron expression");
  }

  // Start from the next minute
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Day-by-day scan strategy
  const maxIterations = 4 * 366; // ~4 years worth of days
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1;
    const day = candidate.getUTCDate();
    const dow = candidate.getUTCDay();

    // Check if this day matches the month and (dom OR dow) criteria
    if (!months.has(month)) {
      // Move to next month
      candidate.setUTCDate(1);
      candidate.setUTCMonth(candidate.getUTCMonth() + 1);
      candidate.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // DOM/DOW union logic: if both fields are restricted (not *), use OR; otherwise AND
    const domRestricted = domExpr !== "*";
    const dowRestricted = dowExpr !== "*";

    let dayMatches = false;
    if (!domRestricted && !dowRestricted) {
      // Both * - every day
      dayMatches = true;
    } else if (domRestricted && !dowRestricted) {
      // Only DOM restricted
      dayMatches = doms.has(day);
    } else if (!domRestricted && dowRestricted) {
      // Only DOW restricted
      dayMatches = dows.has(dow);
    } else {
      // Both restricted - OR logic (standard cron behavior)
      dayMatches = doms.has(day) || dows.has(dow);
    }

    if (!dayMatches) {
      // Move to next day
      candidate.setUTCDate(candidate.getUTCDate() + 1);
      candidate.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Day matches! Now find the first matching hour:minute
    candidate.setUTCHours(0, 0, 0, 0);

    for (const hour of Array.from(hours).sort((a, b) => a - b)) {
      for (const minute of Array.from(minutes).sort((a, b) => a - b)) {
        candidate.setUTCHours(hour, minute, 0, 0);

        // Make sure this is strictly after 'after'
        if (candidate.getTime() > after.getTime()) {
          return new Date(candidate.getTime());
        }
      }
    }

    // Move to next day
    candidate.setUTCDate(candidate.getUTCDate() + 1);
    candidate.setUTCHours(0, 0, 0, 0);
  }

  throw new Error("No matching cron time found within reasonable range");
}

function parseField(field, min, max) {
  const result = new Set();

  // Handle *
  if (field === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle */step
  if (field.startsWith("*/")) {
    const step = parseInt(field.slice(2), 10);
    if (isNaN(step) || step <= 0) {
      return null;
    }
    for (let i = min; i <= max; i += step) {
      result.add(i);
    }
    return result;
  }

  // Handle comma-separated values or ranges
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      // Handle range/step: a-b/step or */step
      const [rangePart, stepPart] = part.split("/");
      const step = parseInt(stepPart, 10);
      if (isNaN(step) || step <= 0) {
        return null;
      }

      let rangeMin = min;
      let rangeMax = max;

      if (rangePart !== "*") {
        if (rangePart.includes("-")) {
          const [a, b] = rangePart.split("-");
          rangeMin = parseInt(a, 10);
          rangeMax = parseInt(b, 10);
        } else {
          rangeMin = parseInt(rangePart, 10);
          rangeMax = rangeMin;
        }
      }

      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        return null;
      }

      for (let i = rangeMin; i <= rangeMax; i += step) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else if (part.includes("-")) {
      // Handle range: a-b
      const [a, b] = part.split("-");
      const rangeMin = parseInt(a, 10);
      const rangeMax = parseInt(b, 10);
      if (isNaN(rangeMin) || isNaN(rangeMax) || rangeMin > rangeMax) {
        return null;
      }
      for (let i = rangeMin; i <= rangeMax; i++) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (isNaN(val) || val < min || val > max) {
        return null;
      }
      result.add(val);
    }
  }

  return result.size > 0 ? result : null;
}
