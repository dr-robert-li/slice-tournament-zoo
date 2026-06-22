export function nextRun(expr, after) {
  const parts = expr.split(" ");
  if (parts.length !== 5) {
    throw new Error("Invalid cron expression");
  }

  const [minStr, hourStr, dayStr, monthStr, dowStr] = parts;

  // Parse each cron field into a set of valid values
  const minutes = parseField(minStr, 0, 59);
  const hours = parseField(hourStr, 0, 23);
  const days = parseField(dayStr, 1, 31);
  const months = parseField(monthStr, 1, 12);
  const dows = parseField(dowStr, 0, 6); // 0=Sunday, 6=Saturday (standard cron)

  // Track whether day-of-month and day-of-week were explicitly specified
  const dayIsWildcard = dayStr === "*";
  const dowIsWildcard = dowStr === "*";

  // Start from the next minute after the given time
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search forward for up to 4 years
  const maxIterations = 4 * 365 * 24 * 60;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1; // getUTCMonth returns 0-11
    const day = candidate.getUTCDate();
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();
    const dow = candidate.getUTCDay(); // 0=Sunday

    // Check if minute, hour, and month match
    if (!minutes.has(minute) || !hours.has(hour) || !months.has(month)) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // Handle day-of-month and day-of-week logic
    let dayMatch = false;
    if (dayIsWildcard && dowIsWildcard) {
      // Both wildcards: match any day
      dayMatch = true;
    } else if (dayIsWildcard) {
      // Only dow is specified: match by dow
      dayMatch = dows.has(dow);
    } else if (dowIsWildcard) {
      // Only day is specified: match by day
      dayMatch = days.has(day);
    } else {
      // Both specified: match either (OR logic)
      dayMatch = days.has(day) || dows.has(dow);
    }

    if (dayMatch) {
      return candidate;
    }

    // Move to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("No matching cron time found within search limit");
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === "*") {
    // Match all values in range
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
  } else if (field.startsWith("*/")) {
    // Step values: */15 means every 15th
    const step = parseInt(field.slice(2), 10);
    for (let i = min; i <= max; i += step) {
      result.add(i);
    }
  } else if (field.includes(",")) {
    // Comma-separated list
    const parts = field.split(",");
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map((x) => parseInt(x, 10));
        for (let i = start; i <= end; i++) {
          result.add(i);
        }
      } else {
        result.add(parseInt(part, 10));
      }
    }
  } else if (field.includes("-")) {
    // Range: 1-5
    const [start, end] = field.split("-").map((x) => parseInt(x, 10));
    for (let i = start; i <= end; i++) {
      result.add(i);
    }
  } else {
    // Single value
    result.add(parseInt(field, 10));
  }

  return result;
}
