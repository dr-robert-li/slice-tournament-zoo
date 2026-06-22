export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Expression must have exactly 5 fields");
  }

  const [minField, hourField, domField, monthField, dowField] = fields;

  // Parse each field into a set of allowed values
  const minutes = parseField(minField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const daysOfMonth = parseField(domField, 1, 31);
  const months = parseField(monthField, 1, 12);
  const daysOfWeek = parseField(dowField, 0, 7); // Allow 7 for Sunday

  // Normalize day-of-week: 7 = Sunday = 0
  if (daysOfWeek.has(7)) {
    daysOfWeek.delete(7);
    daysOfWeek.add(0);
  }

  // Check if fields are restricted (not bare "*")
  const domRestricted = domField !== "*";
  const dowRestricted = dowField !== "*";

  // Floor to the start of the next minute after 'after'
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Bounded search: up to 4 years
  const maxIterations = 4 * 365 * 24 * 60 + 24;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const y = candidate.getUTCFullYear();
    const mo = candidate.getUTCMonth() + 1; // 1-12
    const d = candidate.getUTCDate();
    const h = candidate.getUTCHours();
    const mi = candidate.getUTCMinutes();

    // 1. Check month
    if (!months.has(mo)) {
      // Jump to first day of next allowed month
      const nextMonth = getNextAllowed(mo, months, 1, 12);
      if (nextMonth === null) {
        // Wrap to next year
        candidate.setUTCDate(1);
        candidate.setUTCMonth(0);
        candidate.setUTCFullYear(y + 1);
        candidate.setUTCHours(0);
        candidate.setUTCMinutes(0);
      } else {
        candidate.setUTCDate(1);
        candidate.setUTCMonth(nextMonth - 1);
        candidate.setUTCHours(0);
        candidate.setUTCMinutes(0);
      }
      continue;
    }

    // 2. Check day (dom/dow)
    const domOk = daysOfMonth.has(d);
    const dowOk = daysOfWeek.has(candidate.getUTCDay());
    let dayMatches;
    if (domRestricted && dowRestricted) {
      dayMatches = domOk || dowOk;
    } else if (domRestricted) {
      dayMatches = domOk;
    } else if (dowRestricted) {
      dayMatches = dowOk;
    } else {
      dayMatches = true;
    }

    if (!dayMatches) {
      // Advance to next day
      candidate.setUTCDate(d + 1);
      candidate.setUTCHours(0);
      candidate.setUTCMinutes(0);
      continue;
    }

    // 3. Check hour
    if (!hours.has(h)) {
      const nextHour = getNextAllowed(h, hours, 0, 23);
      if (nextHour === null) {
        // Carry to next day
        candidate.setUTCDate(d + 1);
        candidate.setUTCHours(0);
        candidate.setUTCMinutes(0);
      } else {
        candidate.setUTCHours(nextHour);
        candidate.setUTCMinutes(0);
      }
      continue;
    }

    // 4. Check minute
    if (!minutes.has(mi)) {
      const nextMin = getNextAllowed(mi, minutes, 0, 59);
      if (nextMin === null) {
        // Carry to next hour
        candidate.setUTCHours(h + 1);
        candidate.setUTCMinutes(0);
      } else {
        candidate.setUTCMinutes(nextMin);
      }
      continue;
    }

    // All constraints satisfied
    return candidate;
  }

  throw new Error("No valid cron firing time found within bounds");
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle list first: split on comma and recursively parse each term
  if (field.includes(",")) {
    for (const part of field.split(",")) {
      for (const v of parseField(part, min, max)) {
        result.add(v);
      }
    }
    return result;
  }

  // Handle step (*/n or start-end/n or start/n)
  if (field.includes("/")) {
    const parts = field.split("/");
    if (parts.length !== 2) {
      throw new Error("Invalid step syntax");
    }
    const rangePart = parts[0];
    const stepStr = parts[1];
    const step = toInt(stepStr);
    if (step <= 0) {
      throw new Error("Step must be a positive integer");
    }

    let rangeStart = min;
    let rangeEnd = max;

    if (rangePart !== "*") {
      if (rangePart.includes("-")) {
        const [start, end] = rangePart.split("-");
        rangeStart = toInt(start);
        rangeEnd = toInt(end);
      } else {
        rangeStart = toInt(rangePart);
        rangeEnd = max;
      }
    }
    if (rangeStart > rangeEnd) {
      throw new Error("Inverted range");
    }
    if (rangeStart < min || rangeEnd > max) {
      throw new Error("Range out of bounds");
    }

    for (let i = rangeStart; i <= rangeEnd; i += step) {
      result.add(i);
    }
    return result;
  }


  // Handle range (a-b)
  if (field.includes("-")) {
    const [start, end] = field.split("-");
    const startNum = toInt(start);
    const endNum = toInt(end);
    if (startNum > endNum) {
      throw new Error("Inverted range");
    }
    if (startNum < min || endNum > max) {
      throw new Error("Range out of bounds");
    }
    for (let i = startNum; i <= endNum; i++) {
      result.add(i);
    }
    return result;
  }

  // Single value
  const num = toInt(field);
  if (num < min || num > max) {
    throw new Error("Value out of bounds");
  }
  result.add(num);
  return result;
}

function toInt(s) {
  if (!/^\d+$/.test(s)) throw new Error("Malformed number");
  return parseInt(s, 10);
}

function getNextAllowed(current, allowed, min, max) {
  for (let i = current + 1; i <= max; i++) {
    if (allowed.has(i)) {
      return i;
    }
  }
  return null;
}
