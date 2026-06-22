export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minuteField, hourField, domField, monthField, dowField] = fields;

  // Parse each field
  const minutes = parseField(minuteField, 0, 59, "minute");
  const hours = parseField(hourField, 0, 23, "hour");
  const doms = parseField(domField, 1, 31, "day-of-month");
  const months = parseField(monthField, 1, 12, "month");
  const dows = parseField(dowField, 0, 6, "day-of-week");

  // Start searching from one minute after 'after'
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Scan forward for up to ~4 years to find a matching datetime
  const maxIterations = 366 * 4 * 24 * 60; // rough upper bound
  for (let i = 0; i < maxIterations; i++) {
    const y = candidate.getUTCFullYear();
    const mo = candidate.getUTCMonth() + 1;
    const d = candidate.getUTCDate();
    const h = candidate.getUTCHours();
    const mi = candidate.getUTCMinutes();

    // Check if current time matches
    if (
      minutes.has(mi) &&
      hours.has(h) &&
      months.has(mo) &&
      dayMatches(d, mo, y, doms, dows)
    ) {
      return new Date(candidate.getTime());
    }

    // Advance to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("No matching cron time found within search window");
}

function parseField(field, min, max, name) {
  const result = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      // Handle step syntax: "*/n" or "a-b/n"
      const [range, step] = part.split("/");
      const stepVal = parseInt(step, 10);
      if (!Number.isInteger(stepVal) || stepVal <= 0) {
        throw new Error(`Invalid step value in ${name} field: ${step}`);
      }

      let rangeMin = min;
      let rangeMax = max;

      if (range !== "*") {
        if (range.includes("-")) {
          const [a, b] = range.split("-").map((x) => parseInt(x, 10));
          if (!Number.isInteger(a) || !Number.isInteger(b)) {
            throw new Error(`Invalid range in ${name} field: ${range}`);
          }
          if (a > b) {
            throw new Error(`Invalid range (inverted) in ${name} field: ${range}`);
          }
          rangeMin = a;
          rangeMax = b;
        } else {
          throw new Error(`Invalid step syntax in ${name} field: ${part}`);
        }
      }

      for (let i = rangeMin; i <= rangeMax; i += stepVal) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else if (part.includes("-")) {
      // Handle range syntax: "a-b"
      const [a, b] = part.split("-").map((x) => parseInt(x, 10));
      if (!Number.isInteger(a) || !Number.isInteger(b)) {
        throw new Error(`Invalid range in ${name} field: ${part}`);
      }
      if (a > b) {
        throw new Error(`Invalid range (inverted) in ${name} field: ${part}`);
      }
      for (let i = a; i <= b; i++) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (!Number.isInteger(val) || val < min || val > max) {
        throw new Error(`Invalid value in ${name} field: ${part}`);
      }
      result.add(val);
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values in ${name} field`);
  }

  return result;
}

function dayMatches(day, month, year, doms, dows) {
  // If both DOM and DOW are restricted (not "*"), use OR logic (union)
  // If one is "*", use the other
  // If both are "*", any day matches

  const domRestricted = doms.size < 31;
  const dowRestricted = dows.size < 7;

  if (!domRestricted && !dowRestricted) {
    // Both are "*"
    return true;
  }

  const dayOfMonth = day;
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  if (domRestricted && dowRestricted) {
    // Both restricted: use OR
    return doms.has(dayOfMonth) || dows.has(dayOfWeek);
  } else if (domRestricted) {
    // Only DOM restricted
    return doms.has(dayOfMonth);
  } else {
    // Only DOW restricted
    return dows.has(dayOfWeek);
  }
}
