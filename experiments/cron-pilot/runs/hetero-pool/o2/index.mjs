// nextRun(expr, after) — next firing of a standard 5-field cron expression,
// strictly after `after`, computed in UTC. Node built-ins only; pure & deterministic.

const FIELD_BOUNDS = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day-of-month
  { min: 1, max: 12 }, // month
  { min: 0, max: 7 },  // day-of-week (0 and 7 both = Sunday)
];

// Parse a single field into a sorted, de-duplicated array of allowed integers.
// Returns { values:Set, star:boolean }. `star` records whether the field was a
// bare "*" (significant for the DOM/DOW interaction rule).
function parseField(raw, index) {
  const { min, max } = FIELD_BOUNDS[index];
  const values = new Set();
  let star = false;

  const parts = String(raw).split(",");
  if (parts.length === 0 || parts.some((p) => p === "")) {
    throw new Error(`Invalid cron field: "${raw}"`);
  }

  for (const part of parts) {
    let rangePart = part;
    let step = 1;

    // Step component: <range>/<n>
    const slashIdx = part.indexOf("/");
    if (slashIdx !== -1) {
      rangePart = part.slice(0, slashIdx);
      const stepStr = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepStr)) throw new Error(`Invalid step in "${part}"`);
      step = parseInt(stepStr, 10);
      if (step <= 0) throw new Error(`Invalid step in "${part}"`);
    }

    let lo;
    let hi;

    if (rangePart === "*") {
      if (slashIdx === -1) star = true;
      lo = min;
      hi = max;
    } else if (rangePart.includes("-")) {
      const segs = rangePart.split("-");
      if (segs.length !== 2) throw new Error(`Invalid range "${rangePart}"`);
      const [aStr, bStr] = segs;
      if (!/^\d+$/.test(aStr) || !/^\d+$/.test(bStr)) {
        throw new Error(`Invalid range "${rangePart}"`);
      }
      lo = parseInt(aStr, 10);
      hi = parseInt(bStr, 10);
    } else {
      if (!/^\d+$/.test(rangePart)) throw new Error(`Invalid value "${rangePart}"`);
      lo = parseInt(rangePart, 10);
      hi = lo;
      // A bare single number with a step (e.g. "5/15") means "from 5 to max step n".
      if (slashIdx !== -1) hi = max;
    }

    if (lo < min || hi > max || lo > hi) {
      throw new Error(`Field value out of range in "${part}"`);
    }

    for (let v = lo; v <= hi; v += step) values.add(v);
  }

  // Day-of-week: normalize 7 to 0 (both are Sunday).
  if (index === 4 && values.has(7)) {
    values.delete(7);
    values.add(0);
  }

  if (values.size === 0) throw new Error(`Empty cron field: "${raw}"`);
  return { values, star };
}

function parse(expr) {
  if (typeof expr !== "string") throw new Error("Cron expression must be a string");
  const trimmed = expr.trim();
  if (trimmed === "") throw new Error("Empty cron expression");
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`Expected 5 cron fields, got ${fields.length}`);
  }
  return {
    minute: parseField(fields[0], 0),
    hour: parseField(fields[1], 1),
    dom: parseField(fields[2], 2),
    month: parseField(fields[3], 3),
    dow: parseField(fields[4], 4),
  };
}

// Does the calendar day (in UTC) match the day-of-month / day-of-week fields?
// Vixie-cron semantics: if both DOM and DOW are restricted (not "*"), a day
// matches when EITHER matches. If only one is restricted, only that one applies.
function dayMatches(date, cron) {
  const dom = date.getUTCDate();
  const dow = date.getUTCDay(); // 0=Sunday

  const domRestricted = !cron.dom.star;
  const dowRestricted = !cron.dow.star;

  if (domRestricted && dowRestricted) {
    return cron.dom.values.has(dom) || cron.dow.values.has(dow);
  }
  if (domRestricted) return cron.dom.values.has(dom);
  if (dowRestricted) return cron.dow.values.has(dow);
  return true; // both "*"
}

export function nextRun(expr, after) {
  const cron = parse(expr);

  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("Invalid reference date");
  }

  // Start at the next whole minute strictly after `after` (seconds zeroed).
  // Adding 60000ms after flooring to the minute guarantees strictly-after even
  // when `after` already sits exactly on a minute boundary.
  let t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t = new Date(t.getTime() + 60000);

  // Upper bound: cron schedules can be sparse (e.g. Feb 29). 8 years comfortably
  // covers any reachable schedule incl. leap-year-only day-of-month matches.
  const limit = new Date(t.getTime());
  limit.setUTCFullYear(limit.getUTCFullYear() + 12);

  while (t.getTime() <= limit.getTime()) {
    // Month must match before anything else; jump to the 1st of next valid month.
    if (!cron.month.values.has(t.getUTCMonth() + 1)) {
      // Advance to the first day of the next month at 00:00.
      const y = t.getUTCFullYear();
      const m = t.getUTCMonth();
      t = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0, 0));
      continue;
    }

    if (!dayMatches(t, cron)) {
      // Advance to start of next day.
      const y = t.getUTCFullYear();
      const m = t.getUTCMonth();
      const d = t.getUTCDate();
      t = new Date(Date.UTC(y, m, d + 1, 0, 0, 0, 0));
      continue;
    }

    if (!cron.hour.values.has(t.getUTCHours())) {
      // Advance to next hour, zero minutes.
      const y = t.getUTCFullYear();
      const m = t.getUTCMonth();
      const d = t.getUTCDate();
      const h = t.getUTCHours();
      t = new Date(Date.UTC(y, m, d, h + 1, 0, 0, 0));
      continue;
    }

    if (!cron.minute.values.has(t.getUTCMinutes())) {
      t = new Date(t.getTime() + 60000);
      continue;
    }

    return t;
  }

  throw new Error("No matching cron time found within search horizon");
}
