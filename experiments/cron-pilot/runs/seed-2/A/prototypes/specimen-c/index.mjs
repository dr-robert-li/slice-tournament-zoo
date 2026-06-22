export function nextRun(expr, after) {
  // Validate input
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid after date');
  }

  // Parse cron expression
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error('Cron expression must have 5 fields');
  }

  const [minuteField, hourField, domField, monthField, dowField] = fields;

  // Parse each field (dow allows 0-7, we'll normalize 7 later)
  let minutes = parseField(minuteField, 0, 59);
  let hours = parseField(hourField, 0, 23);
  let doms = parseField(domField, 1, 31);
  let months = parseField(monthField, 1, 12);
  let dows = parseField(dowField, 0, 7);

  // Handle dow = 7 as Sunday (same as 0)
  if (dows.has(7)) {
    dows.delete(7);
    dows.add(0);
  }

  // Detect which day fields are restricted (raw field is not exactly "*")
  const domRestricted = domField !== '*';
  const dowRestricted = dowField !== '*';

  // Start cursor at the next minute boundary after `after`
  let cursor = new Date(Math.floor(after.getTime() / 60000) * 60000 + 60000);

  // Scan for up to ~10 years (to handle leap-year gaps like 2096->2104)
  const maxDays = 365 * 10;
  let daysScanned = 0;

  while (daysScanned < maxDays) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1; // 1-12
    const dom = cursor.getUTCDate();
    const dow = cursor.getUTCDay(); // 0=Sun, 6=Sat

    // Check month
    if (!months.has(month)) {
      // Move to next day at 00:00
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(0, 0, 0, 0);
      daysScanned++;
      continue;
    }

    // Check day: use OR if both dom and dow are restricted, else use the restricted one
    let dayMatches = false;
    if (domRestricted && dowRestricted) {
      // Both restricted: OR condition
      dayMatches = doms.has(dom) || dows.has(dow);
    } else if (domRestricted) {
      // Only dom restricted
      dayMatches = doms.has(dom);
    } else if (dowRestricted) {
      // Only dow restricted
      dayMatches = dows.has(dow);
    } else {
      // Neither restricted: all days match
      dayMatches = true;
    }

    if (!dayMatches) {
      // Move to next day at 00:00
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      cursor.setUTCHours(0, 0, 0, 0);
      daysScanned++;
      continue;
    }

    // Day matches; now find the first matching hour:minute on this day
    // Check all hours from current hour onwards, then hours earlier in later days
    let found = false;
    for (let h of [...hours].sort((a, b) => a - b)) {
      for (let m of [...minutes].sort((a, b) => a - b)) {
        // Check if this time is strictly after `after`
        const testCursor = new Date(cursor);
        testCursor.setUTCHours(h, m, 0, 0);

        if (testCursor.getTime() > after.getTime() && testCursor.getUTCDate() === dom) {
          // Found a match on this day
          return testCursor;
        }
      }
    }

    // No matching time on this day, move to next day at 00:00
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    cursor.setUTCHours(0, 0, 0, 0);
    daysScanned++;
  }

  throw new Error('No matching execution time found within reasonable future');
}

function parseField(field, min, max) {
  const result = new Set();

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      result.add(i);
    }
    return result;
  }

  // Handle step syntax: */n or a-b/n or a/n
  let stepParts = field.split('/');
  if (stepParts.length > 2) {
    throw new Error('Invalid step syntax');
  }

  const step = stepParts.length === 2 ? parseInt(stepParts[1]) : 1;
  if (step <= 0) {
    throw new Error('Step must be positive');
  }

  const basePart = stepParts[0];
  let rangeMin = min;
  let rangeMax = max;

  if (basePart !== '*') {
    // It's a range or list
    if (basePart.includes('-')) {
      // Range: a-b
      const rangeParts = basePart.split('-');
      if (rangeParts.length !== 2) {
        throw new Error('Invalid range syntax');
      }
      rangeMin = parseInt(rangeParts[0]);
      rangeMax = parseInt(rangeParts[1]);
      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        throw new Error('Invalid range values');
      }
      if (rangeMin > rangeMax) {
        throw new Error('Invalid range: start > end');
      }
      if (rangeMin < min || rangeMax > max) {
        throw new Error(`Range out of bounds [${min}, ${max}]`);
      }
    } else if (basePart.includes(',')) {
      // List
      const items = basePart.split(',');
      for (const item of items) {
        if (item.includes('-')) {
          // Range within list
          const rangeParts = item.split('-');
          if (rangeParts.length !== 2) {
            throw new Error('Invalid range syntax');
          }
          let rMin = parseInt(rangeParts[0]);
          let rMax = parseInt(rangeParts[1]);
          if (isNaN(rMin) || isNaN(rMax)) {
            throw new Error('Invalid range values');
          }
          if (rMin > rMax) {
            throw new Error('Invalid range: start > end');
          }
          if (rMin < min || rMax > max) {
            throw new Error(`Range out of bounds [${min}, ${max}]`);
          }
          for (let i = rMin; i <= rMax; i++) {
            result.add(i);
          }
        } else {
          const val = parseInt(item);
          if (isNaN(val) || val < min || val > max) {
            throw new Error(`Value out of bounds [${min}, ${max}]`);
          }
          result.add(val);
        }
      }
      return result;
    } else {
      // Single value
      const val = parseInt(basePart);
      if (isNaN(val) || val < min || val > max) {
        throw new Error(`Value out of bounds [${min}, ${max}]`);
      }
      rangeMin = val;
      rangeMax = val;
    }
  }

  // Apply step to the range
  for (let i = rangeMin; i <= rangeMax; i += step) {
    result.add(i);
  }

  return result;
}
