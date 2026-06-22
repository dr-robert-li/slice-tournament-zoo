export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid after date");
  }

  // Parse the cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minField, hourField, domField, monthField, dowField] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const daysOfMonth = parseField(domField, 1, 31);
  const months = parseField(monthField, 1, 12);
  const daysOfWeek = parseField(dowField, 0, 6);

  // Check if dom and dow are both restricted (for OR-union rule)
  const domRestricted = domField !== "*";
  const dowRestricted = dowField !== "*";

  // Start searching from the next minute
  const cursor = new Date(after.getTime());
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  // Day-by-day scan with a generous bound
  const maxDays = 9 * 365 + 2; // ~9 years
  let daysScanned = 0;

  while (daysScanned < maxDays) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1; // 1-12
    const day = cursor.getUTCDate();
    const dow = cursor.getUTCDay(); // 0-6, 0=Sunday

    daysScanned++;

    // Check if this day matches
    let dayMatches = false;

    if (domRestricted && dowRestricted) {
      // Both restricted: OR-union rule
      dayMatches =
        daysOfMonth.has(day) ||
        daysOfWeek.has(dow);
    } else if (domRestricted) {
      // Only dom restricted
      dayMatches = daysOfMonth.has(day);
    } else if (dowRestricted) {
      // Only dow restricted
      dayMatches = daysOfWeek.has(dow);
    } else {
      // Neither restricted (both are *)
      dayMatches = true;
    }

    // Check if month matches
    const monthMatches = months.has(month);

    if (dayMatches && monthMatches) {
      // Search for a matching time on this day
      for (const h of sortedArray(hours)) {
        for (const m of sortedArray(minutes)) {
          const candidate = new Date(
            Date.UTC(year, month - 1, day, h, m, 0)
          );
          if (candidate.getTime() > after.getTime()) {
            return candidate;
          }
        }
      }
    }

    // Move to the next day
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    cursor.setUTCHours(0, 0, 0, 0);
  }

  throw new Error("No matching fire time found within 9-year scan");
}

function parseField(field, min, max) {
  const values = new Set();

  if (field === "*") {
    // All values in range
    for (let i = min; i <= max; i++) {
      values.add(i);
    }
    return values;
  }

  // Handle step syntax: */n, a-b/n, a/n
  if (field.includes("/")) {
    const [rangePart, stepPart] = field.split("/");
    const step = parseInt(stepPart, 10);

    if (!Number.isInteger(step) || step <= 0) {
      throw new Error(`Invalid step: ${stepPart}`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== "*") {
      if (rangePart.includes("-")) {
        const [start, end] = rangePart.split("-");
        rangeMin = parseInt(start, 10);
        rangeMax = parseInt(end, 10);

        if (!Number.isInteger(rangeMin) || !Number.isInteger(rangeMax)) {
          throw new Error(
            `Invalid range: ${rangePart} (min=${min}, max=${max})`
          );
        }

        // Handle dow=7 as Sunday in ranges
        if (max === 6) {
          if (rangeMin === 7) rangeMin = 0;
          if (rangeMax === 7) rangeMax = 0;
        }

        if (rangeMin < min || rangeMax > max || rangeMin > rangeMax) {
          throw new Error(
            `Invalid range: ${rangePart} (min=${min}, max=${max})`
          );
        }
      } else {
        rangeMin = parseInt(rangePart, 10);
        if (!Number.isInteger(rangeMin)) {
          throw new Error(
            `Invalid start value: ${rangePart} (min=${min}, max=${max})`
          );
        }
        // Handle dow=7 as Sunday
        if (max === 6 && rangeMin === 7) {
          rangeMin = 0;
        }
        if (rangeMin < min || rangeMin > max) {
          throw new Error(
            `Invalid start value: ${rangePart} (min=${min}, max=${max})`
          );
        }
        rangeMax = max;
      }
    }

    for (let i = rangeMin; i <= rangeMax; i += step) {
      if (i >= min && i <= max) {
        values.add(i);
      }
    }

    return values;
  }

  // Handle list: a,b,c
  if (field.includes(",")) {
    const parts = field.split(",");
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-");
        const startVal = parseInt(start, 10);
        const endVal = parseInt(end, 10);

        if (
          !Number.isInteger(startVal) ||
          !Number.isInteger(endVal) ||
          startVal < min ||
          endVal > max ||
          startVal > endVal
        ) {
          throw new Error(
            `Invalid range in list: ${part} (min=${min}, max=${max})`
          );
        }

        for (let i = startVal; i <= endVal; i++) {
          values.add(i);
        }
      } else {
        const val = parseInt(part, 10);
        // Special case: dow=7 as Sunday (accept and map to 0)
        if (max === 6 && val === 7) {
          values.add(0);
        } else if (!Number.isInteger(val) || val < min || val > max) {
          throw new Error(
            `Invalid value in list: ${part} (min=${min}, max=${max})`
          );
        } else {
          values.add(val);
        }
      }
    }
    return values;
  }

  // Handle range: a-b
  if (field.includes("-")) {
    const [start, end] = field.split("-");
    const startVal = parseInt(start, 10);
    const endVal = parseInt(end, 10);

    if (!Number.isInteger(startVal) || !Number.isInteger(endVal)) {
      throw new Error(
        `Invalid range: ${field} (min=${min}, max=${max})`
      );
    }

    // Handle dow=7 as Sunday in ranges
    let adjustedStart = startVal;
    let adjustedEnd = endVal;
    if (max === 6) {
      if (adjustedStart === 7) adjustedStart = 0;
      if (adjustedEnd === 7) adjustedEnd = 0;
    }

    if (
      adjustedStart < min ||
      adjustedEnd > max ||
      adjustedStart > adjustedEnd
    ) {
      throw new Error(
        `Invalid range: ${field} (min=${min}, max=${max})`
      );
    }

    for (let i = adjustedStart; i <= adjustedEnd; i++) {
      values.add(i);
    }
    return values;
  }

  // Single value
  const val = parseInt(field, 10);

  // Special case: dow=7 as Sunday (accept and map to 0)
  if (max === 6 && val === 7) {
    values.add(0);
    return values;
  }

  if (!Number.isInteger(val) || val < min || val > max) {
    throw new Error(
      `Invalid value: ${field} (min=${min}, max=${max})`
    );
  }

  values.add(val);
  return values;
}

function sortedArray(set) {
  return Array.from(set).sort((a, b) => a - b);
}
