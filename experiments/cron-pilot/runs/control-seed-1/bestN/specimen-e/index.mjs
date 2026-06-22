export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error("after must be a Date");
  }
  if (isNaN(after.getTime())) {
    throw new Error("after is an invalid date");
  }

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minuteField, hourField, domField, monthField, dowField] = parts;

  // Parse each field into a set of valid values
  let minutes, hours, doms, months, dows;
  try {
    minutes = parseField(minuteField, 0, 59);
    hours = parseField(hourField, 0, 23);
    doms = parseField(domField, 1, 31);
    months = parseField(monthField, 1, 12);
    dows = parseField(dowField, 0, 6);
  } catch (e) {
    throw new Error("Invalid cron field: " + e.message);
  }

  // Validate that parsed fields are not empty or contain zeros when they shouldn't
  if (!minutes || minutes.size === 0) {
    throw new Error("minute field produces no valid values");
  }
  if (!hours || hours.size === 0) {
    throw new Error("hour field produces no valid values");
  }
  if (!months || months.size === 0) {
    throw new Error("month field produces no valid values");
  }
  // Note: doms and dows can be wildcards, but if both are restricted and produce empty, that's bad
  if (domField !== "*" && dowField !== "*" && (!doms || doms.size === 0) && (!dows || dows.size === 0)) {
    throw new Error("both dom and dow fields produce no valid values");
  }

  // Start searching from one minute after 'after'
  const start = new Date(after.getTime());
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() + 1);

  // Brute force: try each minute up to a reasonable horizon (e.g., 4 years)
  const maxIterations = 4 * 365.25 * 24 * 60; // roughly 4 years of minutes
  for (let i = 0; i < maxIterations; i++) {
    const year = start.getUTCFullYear();
    const month = start.getUTCMonth() + 1; // 1-12
    const day = start.getUTCDate();
    const hour = start.getUTCHours();
    const minute = start.getUTCMinutes();
    const dayOfWeek = start.getUTCDay(); // 0=Sunday

    // Check if this minute matches the cron schedule
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      months.has(month) &&
      matchesDayOfMonthOrDayOfWeek(day, dayOfWeek, doms, dows, domField, dowField, year, month)
    ) {
      return new Date(start.getTime());
    }

    // Advance by one minute
    start.setUTCMinutes(start.getUTCMinutes() + 1);
  }

  throw new Error("No matching cron time found within reasonable horizon");
}

function parseField(field, minVal, maxVal) {
  if (field === "*") {
    return setRange(minVal, maxVal);
  }

  if (field.includes("/")) {
    // Handle step values: */n or a-b/n
    const [range, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    let result = new Set();
    if (range === "*") {
      // */n means every nth value starting from minVal
      for (let i = minVal; i <= maxVal; i += step) {
        result.add(i);
      }
    } else if (range.includes("-")) {
      // a-b/n
      const [startStr, endStr] = range.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${range}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: start (${start}) > end (${end})`);
      }
      for (let i = start; i <= end; i += step) {
        if (i >= minVal && i <= maxVal) {
          result.add(i);
        }
      }
    } else {
      // Single value with step? Not typical, but treat as that value
      const val = parseInt(range, 10);
      if (isNaN(val)) {
        throw new Error(`Invalid value: ${range}`);
      }
      if (val >= minVal && val <= maxVal) {
        result.add(val);
      }
    }
    return result;
  }

  if (field.includes(",")) {
    // Handle comma-separated list
    let result = new Set();
    for (const part of field.split(",")) {
      const subSet = parseField(part, minVal, maxVal);
      subSet.forEach(v => result.add(v));
    }
    return result;
  }

  if (field.includes("-")) {
    // Handle range
    const [startStr, endStr] = field.split("-");
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end)) {
      throw new Error(`Invalid range: ${field}`);
    }
    if (start > end) {
      throw new Error(`Invalid range: start (${start}) > end (${end})`);
    }
    return setRange(start, end);
  }

  // Single numeric value
  const val = parseInt(field, 10);
  if (isNaN(val)) {
    throw new Error(`Invalid value: ${field}`);
  }
  if (val < minVal || val > maxVal) {
    throw new Error(`Value ${val} out of range [${minVal}, ${maxVal}]`);
  }
  return new Set([val]);
}

function setRange(start, end) {
  const result = new Set();
  for (let i = start; i <= end; i++) {
    result.add(i);
  }
  return result;
}

function matchesDayOfMonthOrDayOfWeek(day, dayOfWeek, doms, dows, domField, dowField, year, month) {
  const domIsRestricted = domField !== "*";
  const dowIsRestricted = dowField !== "*";

  // Both are wildcards: always match
  if (!domIsRestricted && !dowIsRestricted) {
    return true;
  }

  // Only DOM is restricted
  if (domIsRestricted && !dowIsRestricted) {
    return doms.has(day) && isValidDayOfMonth(day, month, year);
  }

  // Only DOW is restricted
  if (!domIsRestricted && dowIsRestricted) {
    return dows.has(dayOfWeek);
  }

  // Both are restricted: match if EITHER condition is true (union)
  const domMatches = doms.has(day) && isValidDayOfMonth(day, month, year);
  const dowMatches = dows.has(dayOfWeek);
  return domMatches || dowMatches;
}

function isValidDayOfMonth(day, month, year) {
  // Quick validation: ensure day is within the valid range for this month/year
  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (isLeapYear(year)) {
    daysInMonth[1] = 29;
  }
  return day >= 1 && day <= daysInMonth[month - 1];
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
