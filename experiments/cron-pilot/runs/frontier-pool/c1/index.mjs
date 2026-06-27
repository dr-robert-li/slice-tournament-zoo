export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date provided");
  }

  // Parse the cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have exactly 5 fields");
  }

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = fields;

  // Parse each field into a set of allowed values
  const minute = parseField(minuteStr, 0, 59);
  const hour = parseField(hourStr, 0, 23);
  const dom = parseField(domStr, 1, 31);
  const month = parseField(monthStr, 1, 12);
  const dow = parseField(dowStr, 0, 6);

  // Check if day fields are restricted (not *)
  const domRestricted = domStr !== "*";
  const dowRestricted = dowStr !== "*";

  // Start from the next minute after 'after'
  let candidate = new Date(after.getTime());
  candidate.setUTCMilliseconds(0);
  candidate.setUTCSeconds(0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search for the next matching time, bound to ~8 years (reasonable for unsatisfiable expressions)
  const maxIterations = 8 * 365.25 * 24 * 60; // roughly 8 years worth of minutes
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const m = candidate.getUTCMinutes();
    const h = candidate.getUTCHours();
    const d = candidate.getUTCDate();
    const mon = candidate.getUTCMonth() + 1; // getUTCMonth returns 0-11
    const dow_val = candidate.getUTCDay(); // 0=Sunday, 6=Saturday

    // Check minute, hour, month
    if (!minute.has(m) || !hour.has(h) || !month.has(mon)) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // Check day fields: apply Vixie rule
    let dayMatches;
    if (domRestricted && dowRestricted) {
      // Both restricted: day matches if EITHER dom OR dow matches
      dayMatches = dom.has(d) || dow.has(dow_val);
    } else {
      // At least one is unrestricted (*): both must match
      dayMatches = dom.has(d) && dow.has(dow_val);
    }

    if (dayMatches) {
      return new Date(candidate);
    }

    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error(
    "No matching cron time found within 8 years (possibly unsatisfiable expression)"
  );
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === "*") {
    // Match all values in range
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values (e.g., */5, 1-10/2)
  if (field.includes("/")) {
    const [rangePart, stepStr] = field.split("/");
    const step = parseInt(stepStr, 10);

    if (isNaN(step) || step <= 0) {
      throw new Error(`Invalid step value: ${stepStr}`);
    }

    let start = min;
    let end = max;

    if (rangePart !== "*") {
      if (rangePart.includes("-")) {
        const [startStr, endStr] = rangePart.split("-");
        start = parseInt(startStr, 10);
        end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }

        if (start > end) {
          throw new Error(`Invalid range (start > end): ${rangePart}`);
        }
      } else {
        // Single value with step (e.g., 5/10 means start at 5, step by 10)
        start = parseInt(rangePart, 10);
        if (isNaN(start)) {
          throw new Error(`Invalid range: ${rangePart}`);
        }
        end = max;
      }
    }

    for (let i = start; i <= end; i += step) {
      if (i >= min && i <= max) {
        result.add(i);
      }
    }
    return result;
  }

  // Handle list values (e.g., 1,3,5 or 1-5,10-15)
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      // Range (e.g., 1-5)
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }

      if (start > end) {
        throw new Error(`Invalid range (start > end): ${part}`);
      }

      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else {
      // Single value
      const val = parseInt(part, 10);

      if (isNaN(val)) {
        throw new Error(`Invalid value: ${part}`);
      }

      if (val < min || val > max) {
        throw new Error(
          `Value ${val} out of range [${min}, ${max}] for field`
        );
      }

      result.add(val);
    }
  }

  if (result.size === 0) {
    throw new Error(`Field produced no valid values: ${field}`);
  }

  return result;
}
