export function nextRun(expr, after) {
  if (!(after instanceof Date)) throw new Error("after must be a Date");
  if (isNaN(after.getTime())) throw new Error("after is an invalid date");

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error("cron expression must have 5 fields");

  const [minExpr, hourExpr, domExpr, monExpr, dowExpr] = parts;

  // Parse each field
  const minutes = parseField(minExpr, 0, 59);
  const hours = parseField(hourExpr, 0, 23);
  const doms = parseField(domExpr, 1, 31);
  const months = parseField(monExpr, 1, 12);
  const dows = parseField(dowExpr, 0, 6);

  // Start from the next minute
  let year = after.getUTCFullYear();
  let month = after.getUTCMonth() + 1; // 1-indexed
  let day = after.getUTCDate();
  let hour = after.getUTCHours();
  let minute = after.getUTCMinutes() + 1;

  // Normalize starting point
  if (minute >= 60) {
    minute = 0;
    hour += 1;
  }
  if (hour >= 24) {
    hour = 0;
    day += 1;
  }

  // Handle day overflow
  if (day > daysInMonth(year, month)) {
    day = 1;
    month += 1;
  }
  if (month > 12) {
    month = 1;
    year += 1;
  }

  // Now iterate to find the next valid minute
  // Max iterations: a few years worth of minutes (bounded)
  for (let iterations = 0; iterations < 1000000; iterations++) {
    // Check if month matches
    if (!months.has(month)) {
      // Carry to next month
      month += 1;
      if (month > 12) {
        month = 1;
        year += 1;
      }
      day = 1;
      hour = 0;
      minute = 0;
      continue;
    }

    // Check if day matches (dom/dow union logic)
    // Standard cron: if both dom and dow are restricted (not *), use OR
    // Otherwise, if one is *, must match the other
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const dow = date.getUTCDay();
    const domMatch = doms.has(day);
    const dowMatch = dows.has(dow);

    // Check if doms and dows are both unrestricted
    const domUnrestricted = doms.size === 31;
    const dowUnrestricted = dows.size === 7;

    let dayMatch;
    if (domUnrestricted && dowUnrestricted) {
      dayMatch = true; // both * means every day
    } else if (domUnrestricted) {
      dayMatch = dowMatch; // only dow restricted
    } else if (dowUnrestricted) {
      dayMatch = domMatch; // only dom restricted
    } else {
      dayMatch = domMatch || dowMatch; // both restricted: union
    }

    if (!dayMatch) {
      // Carry to next day
      day += 1;
      if (day > daysInMonth(year, month)) {
        day = 1;
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
      hour = 0;
      minute = 0;
      continue;
    }

    // Check if hour matches
    if (!hours.has(hour)) {
      // Carry to next hour
      hour += 1;
      if (hour >= 24) {
        hour = 0;
        day += 1;
        if (day > daysInMonth(year, month)) {
          day = 1;
          month += 1;
          if (month > 12) {
            month = 1;
            year += 1;
          }
        }
      }
      minute = 0;
      continue;
    }

    // Check if minute matches
    if (!minutes.has(minute)) {
      // Carry to next minute
      minute += 1;
      if (minute >= 60) {
        minute = 0;
        hour += 1;
        if (hour >= 24) {
          hour = 0;
          day += 1;
          if (day > daysInMonth(year, month)) {
            day = 1;
            month += 1;
            if (month > 12) {
              month = 1;
              year += 1;
            }
          }
        }
      }
      continue;
    }

    // All fields match
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  }

  throw new Error("no valid cron time found");
}

function parseField(field, min, max) {
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
      // Step values
      const [range, stepStr] = part.split("/");
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) throw new Error(`invalid step: ${stepStr}`);

      let start, end;
      if (range === "*") {
        start = min;
        end = max;
      } else if (range.includes("-")) {
        const [startStr, endStr] = range.split("-");
        start = parseInt(startStr, 10);
        end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end)) throw new Error(`invalid range: ${range}`);
        if (start > end) throw new Error(`inverted range: ${range}`);
      } else {
        start = parseInt(range, 10);
        end = start;
        if (isNaN(start)) throw new Error(`invalid value: ${range}`);
      }

      if (start < min || end > max) throw new Error(`range out of bounds: ${part}`);

      for (let i = start; i <= end; i += step) {
        result.add(i);
      }
    } else if (part.includes("-")) {
      // Ranges
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) throw new Error(`invalid range: ${part}`);
      if (start > end) throw new Error(`inverted range: ${part}`);
      if (start < min || end > max) throw new Error(`range out of bounds: ${part}`);
      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      // Single values
      const val = parseInt(part, 10);
      if (isNaN(val)) throw new Error(`invalid value: ${part}`);
      if (val < min || val > max) throw new Error(`value out of bounds: ${part}`);
      result.add(val);
    }
  }

  return result;
}

function daysInMonth(year, month) {
  // month is 1-indexed
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
