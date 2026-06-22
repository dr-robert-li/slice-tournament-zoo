// nextRun(expr, after) -> Date
//
// Standard 5-field cron: "minute hour day-of-month month day-of-week".
// Returns the earliest firing time strictly after `after`, in UTC, with
// seconds (and milliseconds) zeroed. Pure, Node built-ins only.
//
// Algorithm: field-carry / jump search over UTC calendar components.
// Starting one minute after `after`, we test each field from most- to
// least-significant. When a field does not match, we advance to the next
// candidate value for that field, zero all lower fields, and restart the
// scan. This jumps over impossible regions instead of ticking minute by
// minute, while remaining exact. A bounded year horizon guarantees we never
// hang on a schedule that can never fire (e.g. "0 0 30 2 *" — Feb 30).
//
// day-of-month / day-of-week union semantics (Vixie cron):
//   - If both DOM and DOW are restricted (not "*"), a day matches when it
//     satisfies DOM OR DOW.
//   - If only one is restricted, only that one constrains the day.
//   - "*" in DOM or DOW is treated as unrestricted for this purpose.

const FIELD_SPECS = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "dom", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "dow", min: 0, max: 6 }, // 0 = Sunday; 7 also accepted as Sunday
];

// Maximum number of years to search forward before giving up. Real cron
// schedules that can ever fire do so within at most a few years; an
// 8-year horizon comfortably covers leap-year-only schedules
// (e.g. "0 0 29 2 *") while bounding pathological / impossible exprs.
const MAX_YEAR_SPAN = 8;

function fail(msg) {
  throw new Error("Invalid cron expression: " + msg);
}

// Parse a single field into a sorted array of distinct allowed integers.
// `wildcard` is set to true when the field is exactly "*" (or "*/n"), which
// matters for DOM/DOW union semantics.
function parseField(raw, spec) {
  if (typeof raw !== "string" || raw.length === 0) {
    fail(`empty ${spec.name} field`);
  }

  const allowed = new Set();
  let isWildcard = false;

  for (const part of raw.split(",")) {
    if (part.length === 0) fail(`empty list element in ${spec.name} field`);

    // Split off an optional step: "<range>/<step>".
    let rangePart = part;
    let step = 1;
    const slashIdx = part.indexOf("/");
    if (slashIdx !== -1) {
      rangePart = part.slice(0, slashIdx);
      const stepStr = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepStr)) {
        fail(`malformed step in ${spec.name} field: "${part}"`);
      }
      step = Number(stepStr);
      if (step === 0) fail(`step of zero in ${spec.name} field: "${part}"`);
    }

    let lo;
    let hi;

    if (rangePart === "*") {
      lo = spec.min;
      hi = spec.max;
      if (slashIdx === -1) isWildcard = true;
    } else {
      const dashIdx = rangePart.indexOf("-");
      if (dashIdx > 0) {
        const loStr = rangePart.slice(0, dashIdx);
        const hiStr = rangePart.slice(dashIdx + 1);
        if (!/^\d+$/.test(loStr) || !/^\d+$/.test(hiStr)) {
          fail(`malformed range in ${spec.name} field: "${part}"`);
        }
        lo = Number(loStr);
        hi = Number(hiStr);
      } else {
        if (!/^\d+$/.test(rangePart)) {
          fail(`malformed value in ${spec.name} field: "${part}"`);
        }
        lo = Number(rangePart);
        // A bare value with a step ("5/15") ranges from the value to the
        // field maximum, matching Vixie cron behaviour.
        hi = slashIdx === -1 ? lo : spec.max;
      }
    }

    // Normalise DOW value 7 -> 0 (POSIX Sunday) before bounds checking.
    if (spec.name === "dow") {
      if (lo === 7) lo = 0;
      if (hi === 7) hi = 0;
    }

    if (lo < spec.min || lo > spec.max || hi < spec.min || hi > spec.max) {
      fail(`value out of range in ${spec.name} field: "${part}"`);
    }
    if (lo > hi) {
      fail(`inverted range in ${spec.name} field: "${part}"`);
    }

    for (let v = lo; v <= hi; v += step) {
      allowed.add(v);
    }
  }

  if (allowed.size === 0) fail(`no values for ${spec.name} field`);

  // For DOW, ensure both 0 and 7 forms are unified (already normalised to 0).
  const sorted = Array.from(allowed).sort((a, b) => a - b);
  return { values: sorted, set: new Set(sorted), wildcard: isWildcard };
}

function parseExpression(expr) {
  if (typeof expr !== "string") fail("expression must be a string");
  const trimmed = expr.trim();
  if (trimmed.length === 0) fail("empty expression");

  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    fail(`expected 5 fields, got ${fields.length}`);
  }

  return {
    minute: parseField(fields[0], FIELD_SPECS[0]),
    hour: parseField(fields[1], FIELD_SPECS[1]),
    dom: parseField(fields[2], FIELD_SPECS[2]),
    month: parseField(fields[3], FIELD_SPECS[3]),
    dow: parseField(fields[4], FIELD_SPECS[4]),
  };
}

function daysInMonth(year, month /* 1-12 */) {
  // Day 0 of next month == last day of this month.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

// Does the given calendar day satisfy the DOM/DOW constraints, applying
// union semantics?
function dayMatches(parsed, year, month, day) {
  const domRestricted = !parsed.dom.wildcard;
  const dowRestricted = !parsed.dow.wildcard;

  const domOk = parsed.dom.set.has(day);
  let dowOk = false;
  if (dowRestricted) {
    const wd = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun
    dowOk = parsed.dow.set.has(wd);
  }

  if (domRestricted && dowRestricted) {
    return domOk || dowOk; // union
  }
  if (domRestricted) return domOk;
  if (dowRestricted) return dowOk;
  return true; // both wildcard -> every day
}

// Smallest value in `sorted` that is >= `from`, or null if none.
function nextValue(sorted, from) {
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= from) return sorted[i];
  }
  return null;
}

export function nextRun(expr, after) {
  const parsed = parseExpression(expr);

  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("Invalid date: `after` must be a valid Date");
  }

  // Start strictly after `after`, at the top of the next minute. Seconds and
  // milliseconds are dropped; we advance a full minute so the result is
  // strictly greater even when `after` is already on a minute boundary.
  let t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t = new Date(t.getTime() + 60000);

  let year = t.getUTCFullYear();
  let month = t.getUTCMonth() + 1; // 1-12
  let day = t.getUTCDate();
  let hour = t.getUTCHours();
  let minute = t.getUTCMinutes();

  const yearLimit = year + MAX_YEAR_SPAN;

  // Field-carry search. Each iteration tries to satisfy month, then day,
  // then hour, then minute. A mismatch advances that field and zeroes the
  // lower ones, then we `continue` to re-validate from the top.
  while (year <= yearLimit) {
    // --- Month ---
    const m = nextValue(parsed.month.values, month);
    if (m === null) {
      year += 1;
      month = parsed.month.values[0];
      day = 1;
      hour = 0;
      minute = 0;
      continue;
    }
    if (m !== month) {
      month = m;
      day = 1;
      hour = 0;
      minute = 0;
    }

    // --- Day ---
    const dim = daysInMonth(year, month);
    if (day > dim || !dayMatches(parsed, year, month, day)) {
      // Advance day within the month until a match, else roll to next month.
      let found = false;
      for (let d = day; d <= dim; d++) {
        if (dayMatches(parsed, year, month, d)) {
          day = d;
          found = true;
          break;
        }
      }
      if (!found) {
        // Roll to first day of next month (carry into month/year handled
        // by the loop top on next pass).
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
        day = 1;
        hour = 0;
        minute = 0;
        continue;
      }
      // We advanced the day; lower fields reset.
      hour = 0;
      minute = 0;
    }

    // --- Hour ---
    const h = nextValue(parsed.hour.values, hour);
    if (h === null) {
      // No valid hour today; advance to next day.
      day += 1;
      hour = 0;
      minute = 0;
      // Let the day logic on the next pass handle month/year rollover.
      continue;
    }
    if (h !== hour) {
      hour = h;
      minute = 0;
    }

    // --- Minute ---
    const mi = nextValue(parsed.minute.values, minute);
    if (mi === null) {
      hour += 1;
      minute = 0;
      if (hour > 23) {
        hour = 0;
        day += 1;
      }
      continue;
    }
    minute = mi;

    // All fields satisfied.
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  }

  throw new Error(
    "Invalid cron expression: schedule cannot fire within search horizon"
  );
}
