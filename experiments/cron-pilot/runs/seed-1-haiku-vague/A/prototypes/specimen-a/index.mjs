export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error("after must be a Date");
  }

  // Parse the expression into 5 fields
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minuteExpr, hourExpr, domExpr, monthExpr, dowExpr] = parts;

  // Parse each field into a set of allowed values
  const allowedMinutes = parseField(minuteExpr, 0, 59);
  const allowedHours = parseField(hourExpr, 0, 23);
  const allowedDays = parseField(domExpr, 1, 31);
  const allowedMonths = parseField(monthExpr, 1, 12);
  const allowedDows = parseField(dowExpr, 0, 6);

  // Start checking from one minute after the given time
  let current = new Date(after.getTime());
  current.setUTCSeconds(0, 0);
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Brute-force iterate, checking each minute
  // Limit iterations to avoid infinite loops (e.g., for invalid expressions)
  const maxIterations = 4 * 365 * 24 * 60; // ~4 years of minutes
  for (let i = 0; i < maxIterations; i++) {
    const minute = current.getUTCMinutes();
    const hour = current.getUTCHours();
    const day = current.getUTCDate();
    const month = current.getUTCMonth() + 1;
    const dow = current.getUTCDay();

    const minuteMatch = allowedMinutes.has(minute);
    const hourMatch = allowedHours.has(hour);
    const monthMatch = allowedMonths.has(month);

    // Day-of-month and day-of-week: either both unrestricted, or at least one matches
    // Standard cron logic: if both are restricted (not *), use OR; otherwise use AND
    const domRestricted = domExpr !== "*";
    const dowRestricted = dowExpr !== "*";

    let dayMatch;
    if (domRestricted && dowRestricted) {
      // Both restricted: match if either matches
      dayMatch = (allowedDays.has(day) || allowedDows.has(dow));
    } else if (domRestricted) {
      // Only DOM restricted
      dayMatch = allowedDays.has(day);
    } else if (dowRestricted) {
      // Only DOW restricted
      dayMatch = allowedDows.has(dow);
    } else {
      // Neither restricted
      dayMatch = true;
    }

    if (minuteMatch && hourMatch && monthMatch && dayMatch) {
      return current;
    }

    // Move to next minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error("Could not find next run within 4 years");
}

function parseField(field, min, max) {
  const allowed = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      allowed.add(i);
    }
    return allowed;
  }

  // Handle step values (e.g., "*/5", "10-20/2")
  if (field.includes("/")) {
    const [rangePart, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step: ${stepStr}`);
    }

    let rangeMin = min;
    let rangeMax = max;

    if (rangePart !== "*") {
      if (rangePart.includes("-")) {
        const [minStr, maxStr] = rangePart.split("-");
        rangeMin = parseInt(minStr, 10);
        rangeMax = parseInt(maxStr, 10);
        if (isNaN(rangeMin) || isNaN(rangeMax)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
      } else {
        rangeMin = parseInt(rangePart, 10);
        rangeMax = rangeMin;
        if (isNaN(rangeMin)) {
          throw new Error(`Invalid number: ${rangePart}`);
        }
      }
    }

    for (let i = rangeMin; i <= rangeMax; i += step) {
      if (i >= min && i <= max) {
        allowed.add(i);
      }
    }
    return allowed;
  }

  // Handle lists and ranges (e.g., "1,3,5" or "1-5")
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [minStr, maxStr] = part.split("-");
      const rangeMin = parseInt(minStr, 10);
      const rangeMax = parseInt(maxStr, 10);
      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        throw new Error(`Invalid range: ${part}`);
      }
      for (let i = rangeMin; i <= rangeMax; i++) {
        if (i >= min && i <= max) {
          allowed.add(i);
        }
      }
    } else {
      const val = parseInt(part, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value: ${part}`);
      }
      if (val >= min && val <= max) {
        allowed.add(val);
      }
    }
  }

  return allowed;
}
