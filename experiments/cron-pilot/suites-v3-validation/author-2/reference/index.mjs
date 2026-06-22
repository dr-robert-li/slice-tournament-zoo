// Reference implementation of nextRun(expr, after).
// Standard 5-field cron, UTC, Node built-ins only. Pure & deterministic.

const FIELD_BOUNDS = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day-of-month
  { min: 1, max: 12 }, // month
  { min: 0, max: 6 },  // day-of-week (0=Sunday)
];

function parseField(spec, { min, max }) {
  // Returns a Set of allowed integer values within [min,max].
  const allowed = new Set();

  for (const part of spec.split(",")) {
    if (part === "") throw new Error(`empty list element in "${spec}"`);

    let rangePart = part;
    let step = 1;

    const slashIdx = part.indexOf("/");
    if (slashIdx !== -1) {
      rangePart = part.slice(0, slashIdx);
      const stepStr = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepStr)) throw new Error(`bad step "${stepStr}"`);
      step = parseInt(stepStr, 10);
      if (step <= 0) throw new Error(`step must be positive: "${part}"`);
    }

    let lo, hi;
    if (rangePart === "*") {
      lo = min;
      hi = max;
    } else if (rangePart.includes("-")) {
      const [aStr, bStr] = rangePart.split("-");
      if (!/^\d+$/.test(aStr) || !/^\d+$/.test(bStr)) {
        throw new Error(`bad range "${rangePart}"`);
      }
      lo = parseInt(aStr, 10);
      hi = parseInt(bStr, 10);
      if (lo > hi) throw new Error(`reversed range "${rangePart}"`);
    } else {
      if (!/^\d+$/.test(rangePart)) throw new Error(`bad value "${rangePart}"`);
      lo = parseInt(rangePart, 10);
      hi = lo;
      // A bare value with a step (e.g. "5/15") means "from 5 to max step n".
      if (slashIdx !== -1) hi = max;
    }

    if (lo < min || hi > max) {
      throw new Error(`value out of range in "${part}" (allowed ${min}-${max})`);
    }

    for (let v = lo; v <= hi; v += step) allowed.add(v);
  }

  return allowed;
}

function parseExpr(expr) {
  if (typeof expr !== "string") throw new Error("expr must be a string");
  const trimmed = expr.trim();
  if (trimmed === "") throw new Error("empty expression");
  const fields = trimmed.split(/\s+/);
  if (fields.length !== 5) {
    throw new Error(`expected 5 fields, got ${fields.length}`);
  }
  const sets = fields.map((f, i) => parseField(f, FIELD_BOUNDS[i]));
  return {
    minute: sets[0],
    hour: sets[1],
    dom: sets[2],
    month: sets[3],
    dow: sets[4],
    domRestricted: fields[2] !== "*",
    dowRestricted: fields[4] !== "*",
  };
}

function dayMatches(parsed, d) {
  const domOk = parsed.dom.has(d.getUTCDate());
  const dowOk = parsed.dow.has(d.getUTCDay());
  if (parsed.domRestricted && parsed.dowRestricted) {
    // Vixie cron: when BOTH restricted, match if EITHER matches (OR).
    return domOk || dowOk;
  }
  return domOk && dowOk;
}

export function nextRun(expr, after) {
  const parsed = parseExpr(expr);
  if (!(after instanceof Date) || Number.isNaN(after.getTime())) {
    throw new Error("invalid date");
  }

  // Start strictly after `after`, at the top of the next minute.
  const t = new Date(after.getTime());
  t.setUTCSeconds(0, 0);
  t.setUTCMinutes(t.getUTCMinutes() + 1);

  // Bound the search to avoid infinite loops on unsatisfiable schedules.
  const LIMIT_YEARS = 8;
  const limit = new Date(t.getTime());
  limit.setUTCFullYear(limit.getUTCFullYear() + LIMIT_YEARS);

  while (t.getTime() <= limit.getTime()) {
    if (!parsed.month.has(t.getUTCMonth() + 1)) {
      // jump to first of next month
      t.setUTCMonth(t.getUTCMonth() + 1, 1);
      t.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!dayMatches(parsed, t)) {
      t.setUTCDate(t.getUTCDate() + 1);
      t.setUTCHours(0, 0, 0, 0);
      continue;
    }
    if (!parsed.hour.has(t.getUTCHours())) {
      t.setUTCHours(t.getUTCHours() + 1, 0, 0, 0);
      continue;
    }
    if (!parsed.minute.has(t.getUTCMinutes())) {
      t.setUTCMinutes(t.getUTCMinutes() + 1, 0, 0);
      continue;
    }
    return t;
  }

  throw new Error("no matching time within search horizon");
}
