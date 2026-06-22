export function nextRun(expr, after) {
  // Validate input date
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  // Parse and validate expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Expression must have exactly 5 fields");
  }

  const [minExpr, hourExpr, domExpr, monthExpr, dowExpr] = fields;

  // Parse each field into a Set
  const minSet = parseField(minExpr, 0, 59, "minute");
  const hourSet = parseField(hourExpr, 0, 23, "hour");
  const domSet = parseField(domExpr, 1, 31, "day-of-month");
  const monthSet = parseField(monthExpr, 1, 12, "month");
  const dowSet = parseField(dowExpr, 0, 6, "day-of-week");

  // Determine if dom/dow are restricted
  const domRestricted = domExpr !== "*";
  const dowRestricted = dowExpr !== "*";

  // Start from the next minute after `after`
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Termination guard: search within 9 years to handle leap year cycles (includes 2100 gap)
  const maxYear = candidate.getUTCFullYear() + 9;
  const maxMs = Date.UTC(maxYear, 0, 1, 0, 0);

  // Main cascade loop
  while (candidate.getTime() < maxMs) {
    const year = candidate.getUTCFullYear();
    const month = candidate.getUTCMonth() + 1; // 1-12
    const hour = candidate.getUTCHours();
    const minute = candidate.getUTCMinutes();

    // Check month
    if (!monthSet.has(month)) {
      // Jump to next month
      candidate = new Date(Date.UTC(year, month, 1, 0, 0));
      continue;
    }

    // Check day-of-month and day-of-week
    const day = candidate.getUTCDate();
    const dow = candidate.getUTCDay(); // 0-6, Sunday=0

    let dayMatches = false;
    if (domRestricted && dowRestricted) {
      // Union rule: matches if dom OR dow
      dayMatches = domSet.has(day) || dowSet.has(dow);
    } else if (domRestricted) {
      // Only dom restricted
      dayMatches = domSet.has(day);
    } else if (dowRestricted) {
      // Only dow restricted
      dayMatches = dowSet.has(dow);
    } else {
      // Both unrestricted
      dayMatches = true;
    }

    if (!dayMatches) {
      // Jump to next day
      candidate = new Date(Date.UTC(year, month - 1, day + 1, 0, 0));
      continue;
    }

    // Check hour
    if (!hourSet.has(hour)) {
      // Jump to next hour
      candidate = new Date(Date.UTC(year, month - 1, day, hour + 1, 0));
      continue;
    }

    // Check minute
    if (!minSet.has(minute)) {
      // Jump to next minute
      candidate = new Date(Date.UTC(year, month - 1, day, hour, minute + 1));
      continue;
    }

    // All fields match
    return candidate;
  }

  throw new Error("Schedule is impossible (no firing time found within search window)");
}

function parseField(expr, min, max, name) {
  // Handle list first: split by comma and parse each segment
  if (expr.includes(",")) {
    const segments = expr.split(",");
    const set = new Set();
    for (const segment of segments) {
      if (segment === "") {
        throw new Error(`Empty value in list for ${name}`);
      }
      // Recursively parse each segment (which might be *, */n, a-b, a-b/n, or a number)
      const segmentSet = parseSegment(segment, min, max, name);
      for (const val of segmentSet) {
        set.add(val);
      }
    }
    return set;
  }

  // No list, parse as a single segment
  return parseSegment(expr, min, max, name);
}

function parseSegment(expr, min, max, name) {
  if (expr === "*") {
    // All values in range
    const set = new Set();
    for (let i = min; i <= max; i++) {
      set.add(i);
    }
    return set;
  }

  // Handle step without range: */n
  if (expr.startsWith("*/")) {
    const stepStr = expr.slice(2);
    if (!isNumericToken(stepStr)) {
      throw new Error(`Invalid step in ${name}: ${expr}`);
    }
    const step = parseInt(stepStr, 10);
    if (step === 0 || step < 1) {
      throw new Error(`Invalid step in ${name}: ${expr}`);
    }
    const set = new Set();
    for (let i = min; i <= max; i += step) {
      set.add(i);
    }
    return set;
  }

  // Handle range with step: a-b/n
  if (expr.includes("/")) {
    const [range, stepStr] = expr.split("/");
    if (!isNumericToken(stepStr)) {
      throw new Error(`Invalid step in ${name}: ${expr}`);
    }
    const step = parseInt(stepStr, 10);
    if (step === 0 || step < 1) {
      throw new Error(`Invalid step in ${name}: ${expr}`);
    }
    const set = new Set();
    if (range === "*") {
      for (let i = min; i <= max; i += step) {
        set.add(i);
      }
    } else {
      const parts = range.split("-");
      if (parts.length !== 2) {
        throw new Error(`Invalid range in ${name}: ${expr}`);
      }
      const [startStr, endStr] = parts;
      if (!isNumericToken(startStr) || !isNumericToken(endStr)) {
        throw new Error(`Invalid range in ${name}: ${expr}`);
      }
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (start > end) {
        throw new Error(`Inverted range in ${name}: ${expr}`);
      }
      if (start < min || end > max) {
        throw new Error(`Out-of-bounds range in ${name}: ${expr}`);
      }
      for (let i = start; i <= end; i += step) {
        set.add(i);
      }
    }
    return set;
  }

  // Handle range: a-b
  if (expr.includes("-")) {
    const parts = expr.split("-");
    if (parts.length !== 2) {
      throw new Error(`Invalid range in ${name}: ${expr}`);
    }
    const [startStr, endStr] = parts;
    if (!isNumericToken(startStr) || !isNumericToken(endStr)) {
      throw new Error(`Invalid range in ${name}: ${expr}`);
    }
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (start > end) {
      throw new Error(`Inverted range in ${name}: ${expr}`);
    }
    if (start < min || end > max) {
      throw new Error(`Out-of-bounds range in ${name}: ${expr}`);
    }
    const set = new Set();
    for (let i = start; i <= end; i++) {
      set.add(i);
    }
    return set;
  }

  // Single value
  if (!isNumericToken(expr)) {
    throw new Error(`Non-numeric value in ${name}: ${expr}`);
  }
  const num = parseInt(expr, 10);
  if (num < min || num > max) {
    throw new Error(`Out-of-bounds value in ${name}: ${num}`);
  }
  return new Set([num]);
}

function isNumericToken(token) {
  return /^\d+$/.test(token);
}
