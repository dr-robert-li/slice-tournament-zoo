/**
 * nextRun(expr, after): Date
 * Compute the next UTC firing time of a cron expression strictly after a given time.
 * Strategy: day-scan with clean separation of date and time matching.
 */

function parseField(field, min, max) {
  if (field === '*') {
    const result = [];
    for (let i = min; i <= max; i++) {
      result.push(i);
    }
    return result;
  }

  const values = new Set();
  const parts = field.split(',');

  for (const part of parts) {
    if (part.includes('/')) {
      const [range, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) {
        throw new Error(`Invalid step: ${stepStr}`);
      }

      let rangeMin = min;
      let rangeMax = max;

      if (range !== '*') {
        const [startStr, endStr] = range.split('-');
        rangeMin = parseInt(startStr, 10);
        if (endStr !== undefined) {
          rangeMax = parseInt(endStr, 10);
        } else {
          rangeMax = rangeMin;
        }
      }

      if (isNaN(rangeMin) || isNaN(rangeMax)) {
        throw new Error(`Invalid range: ${range}`);
      }
      if (rangeMin > rangeMax) {
        throw new Error(`Invalid range: ${rangeMin}-${rangeMax}`);
      }

      for (let i = rangeMin; i <= rangeMax; i += step) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: ${start}-${end}`);
      }

      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) {
          values.add(i);
        }
      }
    } else {
      const val = parseInt(part, 10);
      if (isNaN(val) || val < min || val > max) {
        throw new Error(`Invalid value: ${part} (expected ${min}–${max})`);
      }
      values.add(val);
    }
  }

  return Array.from(values).sort((a, b) => a - b);
}

function parseCron(expr) {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Cron expression must have 5 fields, got ${fields.length}`);
  }

  const [minStr, hourStr, domStr, monthStr, dowStr] = fields;

  return {
    minutes: parseField(minStr, 0, 59),
    hours: parseField(hourStr, 0, 23),
    daysOfMonth: parseField(domStr, 1, 31),
    months: parseField(monthStr, 1, 12),
    daysOfWeek: parseField(dowStr, 0, 6),
    domIsWildcard: domStr === '*',
    dowIsWildcard: dowStr === '*',
  };
}

function getDaysInMonth(year, month) {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function dateMatches(year, month, day, cron) {
  if (!cron.months.includes(month)) {
    return false;
  }

  const daysInMonth = getDaysInMonth(year, month);
  if (day > daysInMonth) {
    return false;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  const dow = date.getUTCDay();

  const domMatches = cron.daysOfMonth.includes(day);
  const dowMatches = cron.daysOfWeek.includes(dow);

  // Standard cron semantics: if both dom and dow are wildcards, match all days
  // If both are restricted, use union (OR) semantics
  // If only one is restricted, only that one matters
  if (cron.domIsWildcard && cron.dowIsWildcard) {
    return true;
  }

  if (!cron.domIsWildcard && !cron.dowIsWildcard) {
    return domMatches || dowMatches;
  }

  if (cron.domIsWildcard) {
    return dowMatches;
  }

  return domMatches;
}

function findNextTimeOnDay(year, month, day, afterHour, afterMinute, cron) {
  const candidates = [];

  for (const hour of cron.hours) {
    for (const minute of cron.minutes) {
      if (hour > afterHour || (hour === afterHour && minute > afterMinute)) {
        candidates.push({ hour, minute });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => a.hour - b.hour || a.minute - b.minute);
  return candidates[0];
}

export function nextRun(expr, after) {
  if (!(after instanceof Date)) {
    throw new Error('after must be a Date');
  }

  if (isNaN(after.getTime())) {
    throw new Error('after is an invalid Date');
  }

  const cron = parseCron(expr);

  let year = after.getUTCFullYear();
  let month = after.getUTCMonth() + 1;
  let day = after.getUTCDate();
  let hour = after.getUTCHours();
  let minute = after.getUTCMinutes();

  let isFirstDay = true;

  for (let iterations = 0; iterations < 367 * 24 * 60; iterations++) {
    if (dateMatches(year, month, day, cron)) {
      let afterHour = isFirstDay ? hour : -1;
      let afterMinute = isFirstDay ? minute : -1;

      const timeMatch = findNextTimeOnDay(year, month, day, afterHour, afterMinute, cron);

      if (timeMatch !== null) {
        return new Date(Date.UTC(year, month - 1, day, timeMatch.hour, timeMatch.minute, 0));
      }
    }

    day++;
    isFirstDay = false;

    const daysInMonth = getDaysInMonth(year, month);
    if (day > daysInMonth) {
      day = 1;
      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }
  }

  throw new Error('No matching cron time found within reasonable range');
}
