// Reference implementation of nextRun(expr, after) — UTC, Node built-ins only.
// Standard 5-field cron: minute hour day-of-month month day-of-week.
// Implements the Vixie/POSIX DOM/DOW union rule.

const FIELD_RANGES = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day-of-month
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 },  // day-of-week (0 = Sunday)
];

function parseField(field, idx) {
  const { min, max } = FIELD_RANGES[idx];
  const allowed = new Set();
  const isStar = field === '*' || /^\*\/\d+$/.test(field);

  for (const part of field.split(',')) {
    if (part === '') throw new Error(`empty list element in field ${idx}`);
    let rangePart = part;
    let step = 1;
    const slash = part.indexOf('/');
    if (slash !== -1) {
      rangePart = part.slice(0, slash);
      const stepStr = part.slice(slash + 1);
      if (!/^\d+$/.test(stepStr)) throw new Error(`bad step in field ${idx}`);
      step = parseInt(stepStr, 10);
      if (step <= 0) throw new Error(`step must be > 0 in field ${idx}`);
    }

    let lo, hi;
    if (rangePart === '*') {
      lo = min;
      hi = max;
    } else if (/^\d+$/.test(rangePart)) {
      lo = hi = parseInt(rangePart, 10);
      if (slash !== -1) hi = max; // "a/n" means a..max step n
    } else {
      const m = rangePart.match(/^(\d+)-(\d+)$/);
      if (!m) throw new Error(`bad field token "${part}" in field ${idx}`);
      lo = parseInt(m[1], 10);
      hi = parseInt(m[2], 10);
    }

    if (lo < min || lo > max || hi < min || hi > max) {
      throw new Error(`value out of range in field ${idx}`);
    }
    if (lo > hi) throw new Error(`inverted range in field ${idx}`);

    for (let v = lo; v <= hi; v += step) allowed.add(v);
  }

  return { allowed, isStar };
}

function parse(expr) {
  if (typeof expr !== 'string') throw new Error('expr must be a string');
  const trimmed = expr.trim();
  if (trimmed === '') throw new Error('empty expression');
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) throw new Error(`expected 5 fields, got ${fields.length}`);
  return fields.map((f, i) => parseField(f, i));
}

function daysInMonth(year, month1) {
  // month1 is 1-based
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function nextRun(expr, after) {
  if (!(after instanceof Date) || isNaN(after.getTime())) {
    throw new Error('invalid date');
  }
  const [minF, hourF, domF, monF, dowF] = parse(expr);

  // strictly later, top of the minute: start at after + 1 minute, seconds/ms zeroed.
  let t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t = new Date(t.getTime() + 60000);

  const domRestricted = !domF.isStar;
  const dowRestricted = !dowF.isStar;

  // Search bounded to avoid infinite loops (8 years of minutes is plenty).
  const limit = new Date(t.getTime() + 8 * 366 * 24 * 60 * 60000);

  while (t.getTime() <= limit.getTime()) {
    const month = t.getUTCMonth() + 1;
    if (!monF.allowed.has(month)) {
      // jump to first of next month
      const y = t.getUTCMonth() === 11 ? t.getUTCFullYear() + 1 : t.getUTCFullYear();
      const m = t.getUTCMonth() === 11 ? 0 : t.getUTCMonth() + 1;
      t = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
      continue;
    }

    const dom = t.getUTCDate();
    const dow = t.getUTCDay();
    let dayMatch;
    if (domRestricted && dowRestricted) {
      dayMatch = domF.allowed.has(dom) || dowF.allowed.has(dow); // union
    } else if (domRestricted) {
      dayMatch = domF.allowed.has(dom);
    } else if (dowRestricted) {
      dayMatch = dowF.allowed.has(dow);
    } else {
      dayMatch = true;
    }

    if (!dayMatch) {
      // advance to start of next day
      const next = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + 1, 0, 0, 0, 0));
      t = next;
      continue;
    }

    const hour = t.getUTCHours();
    if (!hourF.allowed.has(hour)) {
      const next = new Date(t.getTime());
      next.setUTCMinutes(0, 0, 0);
      t = new Date(next.getTime() + 3600000);
      continue;
    }

    const minute = t.getUTCMinutes();
    if (!minF.allowed.has(minute)) {
      t = new Date(t.getTime() + 60000);
      continue;
    }

    return t;
  }

  throw new Error('no matching time found within search horizon');
}
