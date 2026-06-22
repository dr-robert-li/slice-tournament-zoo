export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minExpr, hourExpr, domExpr, monExpr, dowExpr] = fields;

  // Parse each field
  const minutes = parseField(minExpr, 0, 59, "minute");
  const hours = parseField(hourExpr, 0, 23, "hour");
  const doms = parseField(domExpr, 1, 31, "day-of-month");
  const months = parseField(monExpr, 1, 12, "month");
  let dows = parseField(dowExpr, 0, 7, "day-of-week");

  // Normalize dow: 7 = Sunday (same as 0)
  dows = new Set([...dows].map(d => d === 7 ? 0 : d));

  // Check if this schedule can ever fire
  // If dom is restricted and is set to 31, check that at least one month with 31 days is allowed
  // If mon is restricted and only has months with <31 days, and dom is restricted to 31, it never fires
  const domRestricted = domExpr !== "*";
  const dowRestricted = dowExpr !== "*";
  const monRestricted = monExpr !== "*";

  // Start from the next minute boundary (strictly after `after`)
  let t = new Date(Math.floor(after.getTime() / 60000) * 60000 + 60000);

  // Set a reasonable horizon to prevent infinite loops (5 years ahead)
  const horizonTime = after.getTime() + (5 * 365.25 * 24 * 60 * 60 * 1000);

  while (t.getTime() < horizonTime) {
    const year = t.getUTCFullYear();
    const month = t.getUTCMonth() + 1; // 1-12
    const dom = t.getUTCDate();
    const dow = t.getUTCDay(); // 0-6
    const hour = t.getUTCHours();
    const minute = t.getUTCMinutes();

    // Check month
    if (!months.has(month)) {
      // Move to the first day of the next allowed month at 00:00
      const nextMonth = [...months].sort((a, b) => a - b).find(m => m > month);
      if (nextMonth) {
        t = new Date(Date.UTC(year, nextMonth - 1, 1, 0, 0, 0));
      } else {
        // No more allowed months this year, go to first allowed month next year
        t = new Date(Date.UTC(year + 1, [...months].sort((a, b) => a - b)[0] - 1, 1, 0, 0, 0));
      }
      continue;
    }

    // Check day (dom/dow interaction)
    if (!dayMatches(dom, dow, doms, dows, domRestricted, dowRestricted)) {
      // Move to next day at 00:00
      t = new Date(Date.UTC(year, month - 1, dom + 1, 0, 0, 0));
      // Date.UTC auto-normalizes: if dom+1 > days in month, it rolls over to next month
      continue;
    }

    // Check hour
    if (!hours.has(hour)) {
      const nextHour = [...hours].sort((a, b) => a - b).find(h => h > hour);
      if (nextHour !== undefined) {
        t = new Date(Date.UTC(year, month - 1, dom, nextHour, 0, 0));
      } else {
        // No more allowed hours today, go to first allowed hour next day
        t = new Date(Date.UTC(year, month - 1, dom + 1, Math.min(...hours), 0, 0));
      }
      continue;
    }

    // Check minute
    if (!minutes.has(minute)) {
      const nextMinute = [...minutes].sort((a, b) => a - b).find(m => m > minute);
      if (nextMinute !== undefined) {
        t = new Date(Date.UTC(year, month - 1, dom, hour, nextMinute, 0));
      } else {
        // No more allowed minutes this hour, go to first allowed minute next hour
        t = new Date(Date.UTC(year, month - 1, dom, hour + 1, Math.min(...minutes), 0));
      }
      continue;
    }

    // All fields match
    return new Date(t);
  }

  throw new Error("Cron expression never fires within the next 5 years");
}

function parseField(expr, min, max, fieldName) {
  if (expr === "*") {
    const result = new Set();
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  const result = new Set();

  // Handle step with range: a-b/n or */n
  const stepMatch = expr.match(/^(.+?)\/(\d+)$/);
  if (stepMatch) {
    const rangeExpr = stepMatch[1];
    const step = parseInt(stepMatch[2], 10);

    if (step <= 0) {
      throw new Error(`Invalid step: ${step}`);
    }

    let rangeMin, rangeMax;

    if (rangeExpr === "*") {
      rangeMin = min;
      rangeMax = max;
    } else {
      const rangeParts = rangeExpr.split("-");
      if (rangeParts.length !== 2) {
        throw new Error(`Invalid range: ${rangeExpr}`);
      }
      rangeMin = parseInt(rangeParts[0], 10);
      rangeMax = parseInt(rangeParts[1], 10);

      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        throw new Error(`Invalid range values: ${rangeExpr}`);
      }

      if (rangeMin > rangeMax) {
        throw new Error(`Invalid range: ${rangeMin} > ${rangeMax}`);
      }
    }

    if (rangeMin < min || rangeMax > max) {
      throw new Error(`Range out of bounds [${min}, ${max}]: ${expr}`);
    }

    for (let i = rangeMin; i <= rangeMax; i += step) {
      result.add(i);
    }

    return result;
  }

  // Handle comma-separated values and ranges
  const parts = expr.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const rangeParts = part.split("-");
      if (rangeParts.length !== 2) {
        throw new Error(`Invalid range: ${part}`);
      }
      const rangeMin = parseInt(rangeParts[0], 10);
      const rangeMax = parseInt(rangeParts[1], 10);

      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        throw new Error(`Invalid range values: ${part}`);
      }

      if (rangeMin > rangeMax) {
        throw new Error(`Invalid range: ${rangeMin} > ${rangeMax}`);
      }

      if (rangeMin < min || rangeMax > max) {
        throw new Error(`Range out of bounds [${min}, ${max}]: ${part}`);
      }

      for (let i = rangeMin; i <= rangeMax; i++) {
        result.add(i);
      }
    } else {
      const value = parseInt(part, 10);

      if (isNaN(value)) {
        throw new Error(`Invalid value: ${part}`);
      }

      if (value < min || value > max) {
        throw new Error(`Value out of bounds [${min}, ${max}]: ${value}`);
      }

      result.add(value);
    }
  }

  return result;
}

function dayMatches(dom, dow, allowedDoms, allowedDows, domRestricted, dowRestricted) {
  // If both dom and dow are restricted (neither is *), then a day matches if dom matches OR dow matches
  // If only dom is restricted, dow is ignored
  // If only dow is restricted, dom is ignored
  // If both are *, every day matches

  if (!domRestricted && !dowRestricted) {
    // Both are *, so every day matches
    return true;
  }

  if (domRestricted && !dowRestricted) {
    // Only dom is restricted
    return allowedDoms.has(dom);
  }

  if (!domRestricted && dowRestricted) {
    // Only dow is restricted
    return allowedDows.has(dow);
  }

  // Both are restricted: dom OR dow
  return allowedDoms.has(dom) || allowedDows.has(dow);
}
