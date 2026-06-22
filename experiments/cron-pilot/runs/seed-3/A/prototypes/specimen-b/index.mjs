export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error("after must be a Date");
  }
  if (isNaN(after.getTime())) {
    throw new Error("after is an invalid Date");
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("cron expression must have exactly 5 fields");
  }

  const [minField, hourField, domField, monField, dowField] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const doms = parseField(domField, 1, 31);
  const months = parseField(monField, 1, 12);
  const dows = parseField(dowField, 0, 6);

  if (
    !minutes ||
    !hours ||
    !doms ||
    !months ||
    !dows ||
    minutes.size === 0 ||
    hours.size === 0 ||
    doms.size === 0 ||
    months.size === 0 ||
    dows.size === 0
  ) {
    throw new Error("invalid cron field");
  }

  // Start from the next minute
  let candidate = new Date(after.getTime());
  candidate.setUTCSeconds(0, 0);
  candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);

  // Clamp iteration to avoid infinite loops (max 4 years forward)
  const maxIterations = 4 * 365 * 24 * 60;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    const min = candidate.getUTCMinutes();
    const hour = candidate.getUTCHours();
    const dom = candidate.getUTCDate();
    const mon = candidate.getUTCMonth() + 1;
    const dow = candidate.getUTCDay();

    // Check if this candidate matches all fields
    if (
      minutes.has(min) &&
      hours.has(hour) &&
      months.has(mon) &&
      matchesDayFields(dom, dow, doms, dows)
    ) {
      return new Date(candidate.getTime());
    }

    // Increment to the next minute
    candidate.setUTCMinutes(candidate.getUTCMinutes() + 1);
  }

  throw new Error("no matching cron time found within reasonable bounds");
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === "*") {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step values: */n or a-b/n
  if (field.includes("/")) {
    const [range, step] = field.split("/");
    const stepVal = parseInt(step, 10);
    if (isNaN(stepVal) || stepVal <= 0) {
      return null;
    }

    let start = min,
      end = max;

    if (range !== "*") {
      if (range.includes("-")) {
        const [s, e] = range.split("-");
        start = parseInt(s, 10);
        end = parseInt(e, 10);
        if (isNaN(start) || isNaN(end) || start > end) {
          return null;
        }
      } else {
        const val = parseInt(range, 10);
        if (isNaN(val)) {
          return null;
        }
        start = val;
        end = val;
      }
    }

    for (let i = start; i <= end; i += stepVal) {
      result.add(i);
    }
    return result;
  }

  // Handle lists and ranges: a,b,c or a-b
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      const [s, e] = part.split("-");
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);
      if (isNaN(start) || isNaN(end) || start > end || start < min || end > max) {
        return null;
      }
      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      const val = parseInt(part, 10);
      if (isNaN(val) || val < min || val > max) {
        return null;
      }
      result.add(val);
    }
  }

  return result;
}

function matchesDayFields(dom, dow, doms, dows) {
  // In standard cron, day-of-month and day-of-week are OR'ed if both are restricted
  // (not *). If either is *, they work as usual.
  const domRestricted = doms.size < 31;
  const dowRestricted = dows.size < 7;

  if (!domRestricted && !dowRestricted) {
    // Both are *, always match
    return true;
  }

  if (domRestricted && !dowRestricted) {
    // Only dom is restricted
    return doms.has(dom);
  }

  if (!domRestricted && dowRestricted) {
    // Only dow is restricted
    return dows.has(dow);
  }

  // Both are restricted: OR them
  return doms.has(dom) || dows.has(dow);
}
