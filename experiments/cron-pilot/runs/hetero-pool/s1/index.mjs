export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('Invalid date');
  }

  if (typeof expr !== 'string') {
    throw new Error('Expression must be a string');
  }

  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Cron expression must have 5 fields, got ${fields.length}`);
  }

  const [minuteField, hourField, domField, monthField, dowField] = fields;

  // Parse a single cron field into a sorted array of valid integers
  function parseField(field, min, max) {
    const result = new Set();

    const parts = field.split(',');
    for (const part of parts) {
      if (part === '*') {
        for (let i = min; i <= max; i++) result.add(i);
      } else if (part.includes('/')) {
        const [range, stepStr] = part.split('/');
        const step = parseInt(stepStr, 10);
        if (isNaN(step) || step <= 0) throw new Error(`Invalid step in: ${part}`);

        let start = min;
        let end = max;

        if (range === '*') {
          start = min;
          end = max;
        } else if (range.includes('-')) {
          const [a, b] = range.split('-').map(Number);
          if (isNaN(a) || isNaN(b)) throw new Error(`Invalid range in: ${part}`);
          start = a;
          end = b;
        } else {
          start = parseInt(range, 10);
          if (isNaN(start)) throw new Error(`Invalid value in: ${part}`);
          end = max;
        }

        if (start < min || end > max || start > end) {
          throw new Error(`Out of range in: ${part} (expected ${min}-${max})`);
        }

        for (let i = start; i <= end; i += step) result.add(i);
      } else if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        if (isNaN(a) || isNaN(b)) throw new Error(`Invalid range: ${part}`);
        if (a < min || b > max || a > b) throw new Error(`Out of range: ${part} (expected ${min}-${max})`);
        for (let i = a; i <= b; i++) result.add(i);
      } else {
        const val = parseInt(part, 10);
        if (isNaN(val)) throw new Error(`Invalid value: ${part}`);
        if (val < min || val > max) throw new Error(`Value ${val} out of range (expected ${min}-${max})`);
        result.add(val);
      }
    }

    return [...result].sort((a, b) => a - b);
  }

  // Parse all fields
  // month: 1-12, minute: 0-59, hour: 0-23, dom: 1-31, dow: 0-6
  const minutes = parseField(minuteField, 0, 59);
  const hours = parseField(hourField, 0, 23);
  const doms = parseField(domField, 1, 31);
  const months = parseField(monthField, 1, 12);
  const dows = parseField(dowField, 0, 6);

  // Determine if dom and dow are restricted (not wildcards)
  // Standard cron: if both dom and dow are restricted, fire when EITHER matches
  // If only one is restricted, use that one
  // Detect wildcard by checking if the original field is '*' (not a step, not a list, just *)
  const domIsWild = domField.trim() === '*';
  const dowIsWild = dowField.trim() === '*';

  function daysInMonth(year, month) {
    // month is 1-based
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function dayMatches(year, month, day) {
    // month is 1-based
    const date = new Date(Date.UTC(year, month - 1, day));
    const dow = date.getUTCDay();

    if (domIsWild && dowIsWild) return true;
    if (domIsWild) return dows.includes(dow);
    if (dowIsWild) return doms.includes(day);
    // Both restricted: either matches
    return doms.includes(day) || dows.includes(dow);
  }

  // Start searching from one minute after `after`
  // We work in UTC
  let t = new Date(after.getTime());
  // Advance by one minute, zeroing seconds and ms
  t.setUTCSeconds(0, 0);
  t = new Date(t.getTime() + 60000);

  // Safety: cap search at 4 years to avoid infinite loop on impossible expressions
  const limit = new Date(after.getTime() + 4 * 366 * 24 * 60 * 60 * 1000);

  while (t <= limit) {
    const year = t.getUTCFullYear();
    const month = t.getUTCMonth() + 1; // 1-based
    const day = t.getUTCDate();
    const hour = t.getUTCHours();
    const minute = t.getUTCMinutes();

    // Check month
    if (!months.includes(month)) {
      // Jump to first day of next valid month
      const nextMonth = months.find(m => m > month);
      if (nextMonth !== undefined) {
        t = new Date(Date.UTC(year, nextMonth - 1, 1, 0, 0, 0));
      } else {
        t = new Date(Date.UTC(year + 1, months[0] - 1, 1, 0, 0, 0));
      }
      continue;
    }

    // Check day (dom/dow)
    if (!dayMatches(year, month, day)) {
      // Jump to next day
      t = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
      continue;
    }

    // Check hour
    if (!hours.includes(hour)) {
      const nextHour = hours.find(h => h > hour);
      if (nextHour !== undefined) {
        t = new Date(Date.UTC(year, month - 1, day, nextHour, 0, 0));
      } else {
        // Next day
        t = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
      }
      continue;
    }

    // Check minute
    if (!minutes.includes(minute)) {
      const nextMinute = minutes.find(m => m > minute);
      if (nextMinute !== undefined) {
        t = new Date(Date.UTC(year, month - 1, day, hour, nextMinute, 0));
      } else {
        // Next hour
        t = new Date(Date.UTC(year, month - 1, day, hour + 1, 0, 0));
      }
      continue;
    }

    // All fields match
    return t;
  }

  throw new Error('No next run found within 4 years — expression may be unsatisfiable');
}
