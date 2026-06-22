// Naive impl #2: off-by-one on "strictly after" — returns `after` itself when it already lands
// on a matching minute (>= instead of >). Fails the strictly-after cases.
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
  const domR = f[2] !== "*", dowR = f[4] !== "*";
  if (!(after instanceof Date) || Number.isNaN(after.getTime())) throw new Error("date");
  let t = new Date(after.getTime()); t.setUTCSeconds(0, 0); // BUG: no +60000 -> may return `after`
  const day = (dm, dw) => (domR && dowR ? dom.has(dm) || dow.has(dw) : domR ? dom.has(dm) : dowR ? dow.has(dw) : true);
  for (let i = 0; i < 5 * 366 * 24 * 60; i++) {
    if (min.has(t.getUTCMinutes()) && hour.has(t.getUTCHours()) && mon.has(t.getUTCMonth() + 1) && day(t.getUTCDate(), t.getUTCDay())) return t;
    t = new Date(t.getTime() + 60000);
  }
  throw new Error("none");
}
