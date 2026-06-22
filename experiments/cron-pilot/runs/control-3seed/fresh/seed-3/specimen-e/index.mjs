export function nextRun(expr, after) {
  // Validate inputs
  if (!(after instanceof Date)) {
    throw new Error("after must be a Date");
  }
  if (!isFinite(after.getTime())) {
    throw new Error("after is invalid");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have 5 fields");
  }

  // Parse each field into a Set of valid values
  const ranges = [
    { min: 0, max: 59 }, // minute
    { min: 0, max: 23 }, // hour
    { min: 1, max: 31 }, // day of month
    { min: 1, max: 12 }, // month
    { min: 0, max: 6 }   // day of week
  ];
  const [minuteSet, hourSet, domSet, monthSet, dowSet] = fields.map((field, i) =>
    parseField(field, ranges[i])
  );

  // Track if dom/dow are explicitly set (not *)
  const domWildcard = fields[2] === "*";
  const dowWildcard = fields[4] === "*";

  // Start from the next minute
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Maximum iterations to prevent infinite loops
  const maxIterations = 366 * 24 * 60; // ~1 year
  let iterations = 0;

  while (iterations++ < maxIterations) {
    const minute = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const day = candidate.getUTCDate();
    const month = candidate.getUTCMonth() + 1;
    const dow = candidate.getUTCDay();

    // Check dom/dow matching based on standard cron semantics:
    // If both dom and dow are wildcards: any day matches
    // If only dom is wildcard: dow must match
    // If only dow is wildcard: dom must match
    // If neither is wildcard: dom OR dow (union)
    let dayMatches;
    if (domWildcard && dowWildcard) {
      dayMatches = true;
    } else if (domWildcard) {
      dayMatches = dowSet.has(dow);
    } else if (dowWildcard) {
      dayMatches = domSet.has(day);
    } else {
      dayMatches = domSet.has(day) || dowSet.has(dow);
    }

    if (
      minuteSet.has(minute) &&
      hourSet.has(hour) &&
      monthSet.has(month) &&
      dayMatches
    ) {
      return new Date(candidate.getTime());
    }

    // Advance to next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("No matching cron time found within a year");
}

function parseField(field, range) {
  const result = new Set();

  if (field === "*") {
    // All values in range
    for (let i = range.min; i <= range.max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step syntax: */n or a-b/n
  if (field.includes("/")) {
    const [basePart, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);

    if (step <= 0) {
      throw new Error("Step must be positive");
    }

    if (basePart === "*") {
      // */n
      for (let i = range.min; i <= range.max; i += step) {
        result.add(i);
      }
    } else if (basePart.includes("-")) {
      // a-b/n
      const [startStr, endStr] = basePart.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error("Invalid range in step");
      }

      if (start > end) {
        throw new Error("Inverted range");
      }

      if (start < range.min || end > range.max) {
        throw new Error("Range out of bounds");
      }

      for (let i = start; i <= end; i += step) {
        result.add(i);
      }
    } else {
      throw new Error("Invalid step syntax");
    }

    return result;
  }

  // Handle list syntax: a,b,c
  if (field.includes(",")) {
    const items = field.split(",");
    for (const item of items) {
      const itemTrimmed = item.trim();
      if (itemTrimmed.includes("-")) {
        // Range within list
        const [startStr, endStr] = itemTrimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) {
          throw new Error("Invalid value in list");
        }

        if (start > end) {
          throw new Error("Inverted range");
        }

        if (start < range.min || end > range.max) {
          throw new Error("Range out of bounds");
        }

        for (let i = start; i <= end; i++) {
          result.add(i);
        }
      } else {
        // Single value
        const val = parseInt(itemTrimmed, 10);
        if (isNaN(val)) {
          throw new Error("Invalid value in list");
        }
        if (val < range.min || val > range.max) {
          throw new Error("Value out of bounds");
        }
        result.add(val);
      }
    }
    return result;
  }

  // Handle range syntax: a-b
  if (field.includes("-")) {
    const [startStr, endStr] = field.split("-");
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    if (isNaN(start) || isNaN(end)) {
      throw new Error("Invalid range");
    }

    if (start > end) {
      throw new Error("Inverted range");
    }

    if (start < range.min || end > range.max) {
      throw new Error("Range out of bounds");
    }

    for (let i = start; i <= end; i++) {
      result.add(i);
    }
    return result;
  }

  // Single value
  const val = parseInt(field, 10);
  if (isNaN(val)) {
    throw new Error("Invalid cron field value");
  }
  if (val < range.min || val > range.max) {
    throw new Error("Value out of bounds");
  }
  result.add(val);
  return result;
}
