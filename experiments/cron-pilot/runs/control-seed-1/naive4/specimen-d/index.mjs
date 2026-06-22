export function nextRun(expr, after) {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error("Invalid cron expression: must have 5 fields");
  }

  const [minField, hourField, dayField, monthField, dowField] = fields;

  // Parse each field into a set of valid values
  const minutes = parseField(minField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const days = parseField(dayField, 1, 31);
  const months = parseField(monthField, 1, 12);
  const dows = parseField(dowField, 0, 6);

  // Start searching from the next minute after 'after'
  let current = new Date(after.getTime());
  current.setUTCSeconds(0, 0); // clear seconds and milliseconds
  current.setUTCMinutes(current.getUTCMinutes() + 1);

  // Search for up to 4 years (safe upper bound)
  const maxIterations = 365 * 4 * 24 * 60;
  for (let i = 0; i < maxIterations; i++) {
    const month = current.getUTCMonth() + 1;
    const day = current.getUTCDate();
    const hour = current.getUTCHours();
    const minute = current.getUTCMinutes();
    const dow = current.getUTCDay();

    // Check if current time matches all fields
    if (
      minutes.has(minute) &&
      hours.has(hour) &&
      days.has(day) &&
      months.has(month) &&
      dows.has(dow)
    ) {
      return new Date(current.getTime());
    }

    // Advance by one minute
    current.setUTCMinutes(current.getUTCMinutes() + 1);
  }

  throw new Error("No matching time found within search window");
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

  if (field.startsWith("*/")) {
    // Step values: */n
    const step = parseInt(field.slice(2), 10);
    for (let i = min; i <= max; i += step) {
      result.add(i);
    }
    return result;
  }

  // Specific value(s)
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("-")) {
      // Range: a-b
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        result.add(i);
      }
    } else {
      // Single value
      result.add(parseInt(part, 10));
    }
  }

  return result;
}
