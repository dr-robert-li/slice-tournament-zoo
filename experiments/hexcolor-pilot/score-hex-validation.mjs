import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
const ROOT = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/hexcolor-pilot";
const suites = {
  "old-1": ROOT + "/suites-authored/old-1/hex.sealed.mjs",
  "old-2": ROOT + "/suites-authored/old-2/hex.sealed.mjs",
  "new-1": ROOT + "/suites-authored/new-1/hex.sealed.mjs",
  "new-2": ROOT + "/suites-authored/new-2/hex.sealed.mjs",
};
// strict: a-e (reject #aabbcg). leaky-on-subtle: f,g (accept #aabbcg, reject all obvious).
const specimens = ["a", "b", "c", "d", "e", "f", "g"].map(s => ["spec-" + s, ROOT + "/runs/specimens/specimen-" + s + "/index.mjs"]);
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
const hdr = (lbl) => console.log(`\n${lbl}\n${"".padEnd(11)}| ${names.map(n => n.padEnd(8)).join("")}`);

hdr("SPECIMENS  (a-e STRICT want 1.000 | f,g LEAKY-on-subtle want <1.000 = CAUGHT)");
for (const [id, p] of specimens) {
  if (!existsSync(p)) { console.log(id, "MISSING"); continue; }
  const tag = "fg".includes(id.slice(-1)) ? " <- leaky target" : "";
  console.log(`${id.padEnd(10)} | ${names.map(n => f(rate(suites[n], p)).padEnd(8)).join("")}${tag}`);
}
hdr("CROSS-REFERENCE  (every ref want 1.000 everywhere; off-diagonal <1.000 = OVER-STRICT / mirror bug)");
for (const [id, p] of refs) {
  if (!existsSync(p)) { console.log(id, "MISSING"); continue; }
  console.log(`${id.padEnd(10)} | ${names.map(n => f(rate(suites[n], p)).padEnd(8)).join("")}`);
}
console.log("\nKEY QUESTION: do f,g score <1.000? (suite caught the #aabbcg parseInt soft spot)");
console.log("If only NEW catches f,g -> hardening's discriminating-axis claim validated on a fresh task.");
console.log("If OLD also catches -> replicates ipv4 (OLD already discriminates); NEW>OLD not isolated here.");
