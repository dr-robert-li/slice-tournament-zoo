// Naive impl #1: the classic cron bug — treats day-of-month and day-of-week as AND (both must
// match) instead of the standard UNION when both are restricted. Fails the union cases.
function parseField(raw, lo, hi) {
  const set = new Set();
  for (const part of raw.split(",")) {
    let rangePart = part, step = 1;
    const slash = part.split("/");
    if (slash.length === 2) { rangePart = slash[0]; step = Number(slash[1]); if (!(step > 0)) throw new Error("step"); }
    let a, b;
    if (rangePart === "*") { a = lo; b = hi; }
    else if (rangePart.includes("-")) { const [x, y] = rangePart.split("-"); a = Number(x); b = Number(y); }
    else { a = Number(rangePart); b = slash.length === 2 ? hi : a; }
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < lo || b > hi || a > b) throw new Error("range");
    for (let v = a; v <= b; v += step) set.add(v);
  }
  return set;
}
export function nextRun(expr, after) {
  if (typeof expr !== "string") throw new Error("expr");
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) throw new Error("fields");
  const min = parseField(f[0], 0, 59), hour = parseField(f[1], 0, 23), dom = parseField(f[2], 1, 31), mon = parseField(f[3], 1, 12), dow = parseField(f[4], 0, 7);
  if (dow.has(7)) { dow.add(0); dow.delete(7); }
  if (!(after instanceof Date) || Number.isNaN(after.getTime())) throw new Error("date");
  let t = new Date(after.getTime()); t.setUTCSeconds(0, 0); t = new Date(t.getTime() + 60000);
  for (let i = 0; i < 5 * 366 * 24 * 60; i++) {
    // BUG: AND instead of union
    if (min.has(t.getUTCMinutes()) && hour.has(t.getUTCHours()) && mon.has(t.getUTCMonth() + 1) && dom.has(t.getUTCDate()) && dow.has(t.getUTCDay())) return t;
    t = new Date(t.getTime() + 60000);
  }
  throw new Error("none");
}
