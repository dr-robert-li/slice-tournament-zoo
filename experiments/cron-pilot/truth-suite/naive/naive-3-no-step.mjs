// Naive impl #3: ignores step syntax — treats "a-b/s" and "*/s" as if the "/s" weren't there
// (step always 1). Fails the step cases. Also does not validate step<=0 (no throw).
function parseField(raw, lo, hi) {
  const set = new Set();
  for (const part of raw.split(",")) {
    const rangePart = part.split("/")[0]; // BUG: drop the step entirely
    let a, b;
    if (rangePart === "*") { a = lo; b = hi; }
    else if (rangePart.includes("-")) { const [x, y] = rangePart.split("-"); a = Number(x); b = Number(y); }
    else { a = Number(rangePart); b = a; }
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < lo || b > hi || a > b) throw new Error("range");
    for (let v = a; v <= b; v += 1) set.add(v); // BUG: step always 1
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
  let t = new Date(after.getTime()); t.setUTCSeconds(0, 0); t = new Date(t.getTime() + 60000);
  const day = (dm, dw) => (domR && dowR ? dom.has(dm) || dow.has(dw) : domR ? dom.has(dm) : dowR ? dow.has(dw) : true);
  for (let i = 0; i < 5 * 366 * 24 * 60; i++) {
    if (min.has(t.getUTCMinutes()) && hour.has(t.getUTCHours()) && mon.has(t.getUTCMonth() + 1) && day(t.getUTCDate(), t.getUTCDay())) return t;
    t = new Date(t.getTime() + 60000);
  }
  throw new Error("none");
}
