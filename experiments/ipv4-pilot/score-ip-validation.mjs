import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
const ROOT = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/ipv4-pilot";
const suites = {
  "old-1": ROOT + "/suites-authored/old-1/ip.sealed.mjs",
  "old-2": ROOT + "/suites-authored/old-2/ip.sealed.mjs",
  "new-1": ROOT + "/suites-authored/new-1/ip.sealed.mjs",
  "new-2": ROOT + "/suites-authored/new-2/ip.sealed.mjs",
};
const specimens = ["a", "b", "c", "d"].map(s => ["spec-" + s, ROOT + "/runs/specimens/specimen-" + s + "/index.mjs"]);
const refs = Object.keys(suites).map(k => ["ref-" + k, ROOT + "/suites-authored/" + k + "/reference/index.mjs"]);
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
const hdr = (lbl) => console.log(`\n${lbl.padEnd(11)}| ${names.map(n => n.padEnd(8)).join("")}`);

hdr("SPECIMENS (all lenient — want <1.000 = caught)");
for (const [id, p] of specimens) {
  if (!existsSync(p)) { console.log(id, "MISSING"); continue; }
  console.log(`${id.padEnd(10)} | ${names.map(n => f(rate(suites[n], p)).padEnd(8)).join("")}`);
}
hdr("REFERENCES (all presumed correct — want 1.000; <1.000 off-diagonal = OVER-STRICT / mirror bug)");
for (const [id, p] of refs) {
  if (!existsSync(p)) { console.log(id, "MISSING"); continue; }
  console.log(`${id.padEnd(10)} | ${names.map(n => f(rate(suites[n], p)).padEnd(8)).join("")}`);
}
console.log("\nDiscrimination: a suite 'separates' if every specimen <1.000 AND every reference ==1.000.");
console.log("Off-diagonal reference <1.000 = that suite fails a correct-but-different impl (mirror bug / over-strict).");
