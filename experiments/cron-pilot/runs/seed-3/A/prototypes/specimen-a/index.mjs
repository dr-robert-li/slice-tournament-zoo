export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error("after must be a Date");
  }
  if (!isFinite(after.getTime())) {
    throw new Error("after must be a valid Date");
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("cron expression must have exactly 5 fields");
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts;

  // Parse each field into a set of valid values
  const minutes = parseField(minuteStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const doms = parseField(domStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const dows = parseField(dowStr, 0, 6);

  if (
    !minutes ||
    !hours ||
    !doms ||
    !months ||
    !dows
  ) {
    throw new Error("invalid cron field");
  }

  // Start from the next minute after `after`
  const start = new Date(after.getTime());
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() + 1);

  // Brute-force minute stepping: advance up to 4 years worth of minutes
  const maxIterations = 4 * 365.25 * 24 * 60; // ~2,103,840 iterations max
  let current = new Date(start.getTime());

  for (let i = 0; i < maxIterations; i++) {
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth() + 1; // 1-12
    const dom = current.getUTCDate(); // 1-31
    const dow = current.getUTCDay(); // 0-6
    const hour = current.getUTCHours();
    const minute = current.getUTCMinutes();

    // Check if this minute matches all constraints
    // Month must match
    if (!months.has(month)) {
      // Skip to next month
      current.setUTCDate(1);
      current.setUTCMonth(current.getUTCMonth() + 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // DOM and DOW: if both are restricted (not *), use OR logic
    // Otherwise use AND logic
    const domRestricted = domStr !== "*";
    const dowRestricted = dowStr !== "*";

    let dayMatches = false;
    if (domRestricted && dowRestricted) {
      // Both specified: match if either DOM or DOW matches
      dayMatches = doms.has(dom) || dows.has(dow);
    } else if (domRestricted) {
      // Only DOM specified
      dayMatches = doms.has(dom);
    } else if (dowRestricted) {
      // Only DOW specified
      dayMatches = dows.has(dow);
    } else {
      // Neither specified (both *)
      dayMatches = true;
    }

    if (!dayMatches) {
      // Skip to next day
      current.setUTCDate(current.getUTCDate() + 1);
      current.setUTCHours(0, 0, 0, 0);
      continue;
    }

    // Hour and minute must match
    if (!hours.has(hour)) {
      // Skip to next hour
      current.setUTCHours(current.getUTCHours() + 1);
      current.setUTCMinutes(0, 0, 0);
      continue;
    }

    if (!minutes.has(minute)) {
      // Skip to next minute
      current.setUTCMinutes(current.getUTCMinutes() + 1);
      continue;
    }

    // All constraints satisfied
    return new Date(current.getTime());
  }

  throw new Error("no next run found within reasonable time");
}

function parseField(field, min, max) {
  if (field === "*") {
    const set = new Set();
    for (let i = min; i <= max; i++) {
      set.add(i);
    }
    return set;
  }

  const set = new Set();

  // Split by comma for multiple ranges/values
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      // Handle step syntax: */5 or 0-30/5
      const [range, step] = part.split("/");
      const stepNum = parseInt(step, 10);
      if (!isFinite(stepNum) || stepNum <= 0) {
        return null;
      }

      let start, end;
      if (range === "*") {
        start = min;
        end = max;
      } else if (range.includes("-")) {
        const [s, e] = range.split("-");
        start = parseInt(s, 10);
        end = parseInt(e, 10);
        if (!isFinite(start) || !isFinite(end)) {
          return null;
        }
      } else {
        start = parseInt(range, 10);
        end = max;
        if (!isFinite(start)) {
          return null;
        }
      }

      if (start < min || end > max || start > end) {
        return null;
      }

      for (let i = start; i <= end; i += stepNum) {
        set.add(i);
      }
    } else if (part.includes("-")) {
      // Handle range syntax: 0-5
      const [s, e] = part.split("-");
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);
      if (!isFinite(start) || !isFinite(end)) {
        return null;
      }
      if (start < min || end > max || start > end) {
        return null;
      }
      for (let i = start; i <= end; i++) {
        set.add(i);
      }
    } else {
      // Single value
      const val = parseInt(part, 10);
      if (!isFinite(val) || val < min || val > max) {
        return null;
      }
      set.add(val);
    }
  }

  return set.size > 0 ? set : null;
}
