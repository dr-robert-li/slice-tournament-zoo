export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minuteField, hourField, domField, monthField, dowField] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minuteField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const doms = parseField(domField, 1, 31);
  const months = parseField(monthField, 1, 12);
  const dows = parseField(dowField, 0, 6);

  // Detect unsatisfiable patterns early
  if (minutes.size === 0 || hours.size === 0 || months.size === 0) {
    throw new Error("Unsatisfiable cron expression");
  }
  if (doms.size === 0 && dows.size === 0) {
    throw new Error("Unsatisfiable cron expression");
  }

  // Start searching from after + 1 minute, seconds zeroed
  const searchStart = new Date(after.getTime());
  searchStart.setUTCSeconds(0, 0);
  searchStart.setUTCMinutes(searchStart.getUTCMinutes() + 1);

  const maxIterations = 366 * 24 * 60; // roughly one year of minutes
  let current = new Date(searchStart.getTime());

  for (let i = 0; i < maxIterations; i++) {
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1; // 1-12
    const day = current.getUTCDate();
    const hour = current.getUTCHours();
    const minute = current.getUTCMinutes();
    const dow = current.getUTCDay(); // 0-6, Sunday=0

    // Check if current time matches all fields
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDayOfMonthOrWeek(day, dow, doms, dows)
    ) {
      return current;
    }

    // Advance to next minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error("No matching cron time found within search window");
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values: */n or a-b/n
  if (field.includes("/")) {
    const [rangePart, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0 || step === 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== "*") {
      if (rangePart.includes("-")) {
        const [startStr, endStr] = rangePart.split("-");
        rangeMin = parseInt(startStr, 10);
        rangeMax = parseInt(endStr, 10);

        if (isNaN(rangeMin) || isNaN(rangeMax)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
        if (rangeMin > rangeMax) {
          throw new Error(`Inverted range: ${rangePart}`);
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

  // Handle ranges: a-b
  if (field.includes("-")) {
    const parts = field.split(",");
    for (const part of parts) {
      if (part.includes("-")) {
        const [startStr, endStr] = part.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${part}`);
        }
        if (start > end) {
          throw new Error(`Inverted range: ${part}`);
        }

        for (let i = start; i <= end; i++) {
          if (i >= min && i <= max) {
            result.add(i);
          }
        }
      } else {
        const val = parseInt(part, 10);
        if (isNaN(val) || val < min || val > max) {
          throw new Error(`Invalid value: ${part}`);
        }
        result.add(val);
      }
    }
    return result;
  }

  // Handle comma-separated lists
  const parts = field.split(",");
  for (const part of parts) {
    const val = parseInt(part, 10);
    if (isNaN(val) || val < min || val > max) {
      throw new Error(`Invalid value: ${part}`);
    }
    result.add(val);
  }

  return result;
}

function matchesDayOfMonthOrWeek(day, dow, doms, dows) {
  // Standard cron: if both dom and dow are restricted (not *), match if EITHER matches
  // If at least one is * (contains all values), only check the restricted one
  const domRestricted = doms.size < 31; // not all days of month
  const dowRestricted = dows.size < 7; // not all days of week

  if (!domRestricted && !dowRestricted) {
    // Both are *, always match
    return true;
  }

  if (domRestricted && !dowRestricted) {
    // Only dom is restricted
    return doms.has(day);
  }

  if (!domRestricted && dowRestricted) {
    // Only dow is restricted
    return dows.has(dow);
  }

  // Both are restricted: match if either matches
  return doms.has(day) || dows.has(dow);
}
