export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error("Invalid date");
  }

  // Parse expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Cron expression must have 5 fields");
  }

  const [minField, hrField, domField, monField, dowField] = fields;

  // Parse each field into a set of allowed values
  const minutes = parseField(minField, 0, 59, "minute");
  const hours = parseField(hrField, 0, 23, "hour");
  const doms = parseField(domField, 1, 31, "day of month");
  const months = parseField(monField, 1, 12, "month");
  const dows = parseField(dowField, 0, 7, "day of week"); // Allow 7 for Sunday

  // Normalize dow: convert 7 to 0 (Sunday)
  const normalizedDows = new Set();
  for (const d of dows) {
    normalizedDows.add(d === 7 ? 0 : d);
  }

  // Track if fields were literally "*" for DOM/DOW rule
  const domIsStar = domField === "*";
  const dowIsStar = dowField === "*";

  // Start: floor to minute, then add 1 minute
  const candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Search for up to ~10 years (generous cap for leap-day edge cases)
  const maxIterations = 10 * 365 * 24 * 60 + 1000;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const m = candidate.getUTCMinutes();
    const h = candidate.getUTCHours();
    const d = candidate.getUTCDate();
    const mon = candidate.getUTCMonth() + 1; // getUTCMonth is 0-11
    const dow = candidate.getUTCDay(); // 0=Sunday, 6=Saturday

    // Check minute, hour, month
    if (!minutes.has(m) || !hours.has(h) || !months.has(mon)) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // DOM/DOW interaction: the OR rule
    let dayMatch = false;
    if (domIsStar && dowIsStar) {
      // Both "*" — every day
      dayMatch = true;
    } else if (domIsStar) {
      // Only DOW restricted
      dayMatch = normalizedDows.has(dow);
    } else if (dowIsStar) {
      // Only DOM restricted
      dayMatch = doms.has(d);
    } else {
      // Both restricted — union (OR)
      dayMatch = doms.has(d) || normalizedDows.has(dow);
    }

    if (!dayMatch) {
      candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
      continue;
    }

    // All checks passed
    return candidate;
  }

  throw new Error("No matching cron execution within search window");
}

function parseField(field, min, max, name) {
  const result = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step with no range: */n
  if (field.startsWith("*/")) {
    const step = parseNumber(field.slice(2), name);
    if (step <= 0) {
      throw new Error(`Invalid step for ${name}`);
    }
    for (let i = min; i <= max; i += step) {
      result.add(i);
    }
    return result;
  }

  // Handle comma-separated values/ranges
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      // Range with step: a-b/n or a/n
      const [rangeStr, stepStr] = part.split("/");
      const step = parseNumber(stepStr, name);
      if (step <= 0) {
        throw new Error(`Invalid step for ${name}`);
      }

      if (rangeStr.includes("-")) {
        // a-b/n
        const [aStr, bStr] = rangeStr.split("-");
        const a = parseNumber(aStr, name);
        const b = parseNumber(bStr, name);
        if (a > b) {
          throw new Error(`Invalid range ${a}-${b} for ${name}`);
        }
        for (let i = a; i <= b; i += step) {
          if (i >= min && i <= max) {
            result.add(i);
          }
        }
      } else {
        // a/n
        const a = parseNumber(rangeStr, name);
        for (let i = a; i <= max; i += step) {
          if (i >= min) {
            result.add(i);
          }
        }
      }
    } else if (part.includes("-")) {
      // Range: a-b
      const [aStr, bStr] = part.split("-");
      const a = parseNumber(aStr, name);
      const b = parseNumber(bStr, name);
      if (a > b) {
        throw new Error(`Invalid range ${a}-${b} for ${name}`);
      }
      for (let i = a; i <= b; i++) {
        if (i >= min && i <= max) {
          result.add(i);
        }
      }
    } else {
      // Single value
      const val = parseNumber(part, name);
      if (val < min || val > max) {
        throw new Error(`Value ${val} out of range [${min}, ${max}] for ${name}`);
      }
      result.add(val);
    }
  }

  if (result.size === 0) {
    throw new Error(`No valid values for ${name}`);
  }

  return result;
}

function parseNumber(str, context) {
  const val = parseInt(str, 10);
  if (isNaN(val) || String(val) !== str) {
    throw new Error(`Non-numeric value '${str}' in ${context}`);
  }
  return val;
}
