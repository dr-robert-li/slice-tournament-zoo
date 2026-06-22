import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
const ROOT = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/cron-pilot";
const suites = {
  "OLD-sealed(control)": ROOT + "/suites-v2/cron.sealed.mjs",
  "v3-author-1": ROOT + "/suites-v3-validation/author-1/cron.sealed.mjs",
  "v3-author-2": ROOT + "/suites-v3-validation/author-2/cron.sealed.mjs",
  "v3-author-3": ROOT + "/suites-v3-validation/author-3/cron.sealed.mjs",
};
// 7 probed specimens + their verified malformed-reject behaviour (from probe-real-correctness)
const specimens = [
  ["s1-orig-b", "runs/seed-1-haiku-vague/A/prototypes/specimen-b/index.mjs", "REJECTS"],
  ["s2-orig-a", "runs/seed-2/A/prototypes/specimen-a/index.mjs", "REJECTS"],
  ["s1-orig-c", "runs/seed-1-haiku-vague/A/prototypes/specimen-c/index.mjs", "accepts"],
  ["s2-orig-d", "runs/seed-2/A/prototypes/specimen-d/index.mjs", "accepts"],
  ["s1-new-e", "runs/control-seed-1/bestN/specimen-e/index.mjs", "accepts"],
  ["s1-new-g", "runs/control-seed-1/bestN/specimen-g/index.mjs", "accepts"],
  ["s2-new-h", "runs/control-3seed/fresh/seed-2/specimen-h/index.mjs", "accepts"],
];
function rate(suite, impl) {
  try {
    const o = execFileSync("node", [suite, impl], { encoding: "utf8", timeout: 60000 });
    return JSON.parse(o.trim().split("\n").pop()).passRate;
  } catch (e) {
    if (e.killed || e.signal === "SIGTERM") return "HANG";
    const m = (e.stdout || "").trim().split("\n").pop();
    try { return JSON.parse(m).passRate; } catch { return NaN; }
  }
}
const f = n => typeof n === "string" ? n : (Number.isFinite(n) ? n.toFixed(3) : " NA ");
const names = Object.keys(suites);
console.log(`specimen      malformed | ${names.map(n => n.padEnd(20)).join("")}`);
const rows = [];
for (const [id, rel, beh] of specimens) {
  const p = ROOT + "/" + rel;
  const cells = names.map(n => f(rate(suites[n], p)));
  rows.push({ id, beh, cells });
  console.log(`${id.padEnd(13)} ${beh.padEnd(9)} | ${cells.map(c => String(c).padEnd(20)).join("")}`);
}
// discrimination summary per suite: does it separate REJECTS from accepts?
console.log("\n=== discrimination check (does the suite give REJECTS-specimens a higher rate than accepts-specimens?) ===");
names.forEach((n, i) => {
  const rej = rows.filter(r => r.beh === "REJECTS").map(r => r.cells[i]).filter(x => typeof x === "string" && x !== "HANG").map(Number);
  const acc = rows.filter(r => r.beh === "accepts").map(r => r.cells[i]).filter(x => typeof x === "string" && x !== "HANG").map(Number);
  const minRej = Math.min(...rej), maxAcc = Math.max(...acc);
  const sep = minRej > maxAcc;
  console.log(`${n.padEnd(20)}: REJECTS min=${f(minRej)}  accepts max=${f(maxAcc)}  -> ${sep ? "SEPARATES ✓" : "ties / no separation"}`);
});
