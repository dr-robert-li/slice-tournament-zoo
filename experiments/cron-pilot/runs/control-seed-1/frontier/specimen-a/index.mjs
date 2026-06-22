// Cron next-firing-time engine. Standard 5-field cron, computed in UTC.
//
//   nextRun(expr, after) -> Date  (earliest firing time strictly after `after`)
//
// Fields: minute hour day-of-month month day-of-week
// Supports: * , - / with `*/n` and `a-b/n` steps. Names for months (jan..dec)
// and weekdays (sun..sat) are accepted case-insensitively. POSIX 7 == Sunday.
// dom/dow union semantics: when BOTH are restricted, a day matches if it
// satisfies EITHER field (logical OR); when only one is restricted, only that
// one constrains the day; when both are `*`, every day matches.
//
// Pure, deterministic, Node built-ins only. Throws on malformed input.

const FIELD_RANGES = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day-of-month
  { min: 1, max: 12 }, // month
  { min: 0, max: 7 }, // day-of-week (0 and 7 both Sunday)
];

const MONTH_NAMES = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const DOW_NAMES = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function fail(msg) {
  throw new Error(`Invalid cron expression: ${msg}`);
}

// Parse a single integer token, applying field-specific name aliases.
function parseAtom(token, fieldIdx) {
  const raw = token.toLowerCase();
  if (fieldIdx === 3 && Object.prototype.hasOwnProperty.call(MONTH_NAMES, raw)) {
    return MONTH_NAMES[raw];
  }
  if (fieldIdx === 4 && Object.prototype.hasOwnProperty.call(DOW_NAMES, raw)) {
    return DOW_NAMES[raw];
  }
  if (!/^\d+$/.test(token)) fail(`bad value "${token}"`);
  return parseInt(token, 10);
}

// Parse one comma-free piece of a field into a sorted set of allowed values.
// Pieces: "*", "*/n", "a", "a-b", "a-b/n", "a/n" (== a-max/n).
function parsePiece(piece, fieldIdx, out) {
  const { min, max } = FIELD_RANGES[fieldIdx];

  let step = 1;
  let rangePart = piece;
  const slashIdx = piece.indexOf("/");
  if (slashIdx !== -1) {
    rangePart = piece.slice(0, slashIdx);
    const stepStr = piece.slice(slashIdx + 1);
    if (!/^\d+$/.test(stepStr)) fail(`bad step "${stepStr}"`);
    step = parseInt(stepStr, 10);
    if (step === 0) fail("step of 0");
    if (rangePart === "") fail("empty range before step");
  }

  let lo;
  let hi;
  if (rangePart === "*") {
    lo = min;
    hi = max;
  } else {
    const dashIdx = rangePart.indexOf("-");
    if (dashIdx !== -1) {
      const loStr = rangePart.slice(0, dashIdx);
      const hiStr = rangePart.slice(dashIdx + 1);
      if (loStr === "" || hiStr === "") fail(`bad range "${rangePart}"`);
      lo = parseAtom(loStr, fieldIdx);
      hi = parseAtom(hiStr, fieldIdx);
    } else {
      lo = parseAtom(rangePart, fieldIdx);
      // "a/n" means a..max stepping by n; a bare "a" is just the single value.
      hi = slashIdx !== -1 ? max : lo;
    }
  }

  if (lo < min || lo > max) fail(`value ${lo} out of range for field`);
  if (hi < min || hi > max) fail(`value ${hi} out of range for field`);
  if (lo > hi) fail(`inverted range ${lo}-${hi}`);

  for (let v = lo; v <= hi; v += step) out.add(v);
}

function parseField(field, fieldIdx) {
  if (field === "") fail("empty field");
  const out = new Set();
  for (const piece of field.split(",")) {
    if (piece === "") fail("empty list item");
    parsePiece(piece, fieldIdx, out);
  }
  return out;
}

function normalizeDow(set) {
  // Collapse POSIX 7 into 0 (Sunday).
  const norm = new Set();
  let sawSeven = false;
  for (const v of set) {
    if (v === 7) { sawSeven = true; norm.add(0); } else norm.add(v);
  }
  return { set: norm, sawSeven };
}

function parseExpr(expr) {
  if (typeof expr !== "string") fail("expression must be a string");
  const trimmed = expr.trim();
  if (trimmed === "") fail("empty expression");
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    fail(`expected 5 fields, got ${fields.length}`);
  }

  const minutes = parseField(fields[0], 0);
  const hours = parseField(fields[1], 1);
  const domSet = parseField(fields[2], 2);
  const months = parseField(fields[3], 3);
  const dowRaw = parseField(fields[4], 4);
  const { set: dowSet } = normalizeDow(dowRaw);

  const domRestricted = fields[2] !== "*";
  const dowRestricted = fields[4] !== "*";

  return { minutes, hours, domSet, months, dowSet, domRestricted, dowRestricted };
}

function daysInMonth(year, month1) {
  // month1 is 1-based.
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

// Does this calendar day satisfy dom/dow union semantics?
function dayMatches(year, month1, day, p) {
  const weekday = new Date(Date.UTC(year, month1 - 1, day)).getUTCDay(); // 0=Sun
  const domOk = p.domSet.has(day);
  const dowOk = p.dowSet.has(weekday);

  if (p.domRestricted && p.dowRestricted) return domOk || dowOk;
  if (p.domRestricted) return domOk;
  if (p.dowRestricted) return dowOk;
  return true;
}

export function nextRun(expr, after) {
  const p = parseExpr(expr);

  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("Invalid date: `after` must be a valid Date");
  }

  // Start strictly after `after`, with seconds/millis zeroed: advance to the
  // next whole minute. (after at :00.000 -> +1 min; otherwise -> ceil to minute.)
  const start = new Date(after.getTime());
  start.setUTCSeconds(0, 0);
  start.setUTCMinutes(start.getUTCMinutes() + 1);

  let year = start.getUTCFullYear();
  let month = start.getUTCMonth() + 1; // 1-based
  let day = start.getUTCDate();
  let hour = start.getUTCHours();
  let minute = start.getUTCMinutes();

  // Bounded search: cron schedules can be sparse but the longest gap between
  // two firings (e.g. Feb 29) is well under 8 years. Cap generously.
  const LIMIT_YEAR = year + 8;

  while (year <= LIMIT_YEAR) {
    // --- month ---
    if (!p.months.has(month)) {
      month += 1;
      if (month > 12) { month = 1; year += 1; }
      day = 1; hour = 0; minute = 0;
      continue;
    }

    // --- day ---
    const dim = daysInMonth(year, month);
    if (day > dim || !dayMatches(year, month, day, p)) {
      day += 1;
      if (day > dim) {
        day = 1;
        month += 1;
        if (month > 12) { month = 1; year += 1; }
      }
      hour = 0; minute = 0;
      continue;
    }

    // --- hour ---
    if (!p.hours.has(hour)) {
      hour += 1;
      if (hour > 23) {
        hour = 0;
        day += 1;
        if (day > dim) {
          day = 1;
          month += 1;
          if (month > 12) { month = 1; year += 1; }
        }
      }
      minute = 0;
      continue;
    }

    // --- minute ---
    if (!p.minutes.has(minute)) {
      minute += 1;
      if (minute > 59) {
        minute = 0;
        hour += 1;
        if (hour > 23) {
          hour = 0;
          day += 1;
          if (day > dim) {
            day = 1;
            month += 1;
            if (month > 12) { month = 1; year += 1; }
          }
        }
      }
      continue;
    }

    // All fields satisfied.
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  }

  throw new Error("No matching firing time found within bounded search window");
}
