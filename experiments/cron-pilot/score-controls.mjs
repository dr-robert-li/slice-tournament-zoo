import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
const ROOT = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/cron-pilot";
const SEALED = ROOT + "/suites-v2/cron.sealed.mjs";
const TRUTH = ROOT + "/truth-suite/cron.truth.mjs";
const PUBLIC = ROOT + "/suites/cron.public.mjs";
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

// pools
const bestN = [
  ...["a","b","c","d"].map(s => ["seed1-"+s, ROOT+"/runs/seed-1-haiku-vague/A/prototypes/specimen-"+s+"/index.mjs"]),
  ...["e","f","g","h"].map(s => ["new-"+s, ROOT+"/runs/control-seed-1/bestN/specimen-"+s+"/index.mjs"]),
];
const naive4 = ["a","b","c","d"].map(s => ["naive-"+s, ROOT+"/runs/control-seed-1/naive4/specimen-"+s+"/index.mjs"]);
const frontier = ["a","b"].map(s => ["opus-"+s, ROOT+"/runs/control-seed-1/frontier/specimen-"+s+"/index.mjs"]);

function scorePool(name, pool, selectBy) {
  console.log(`\n### ${name} (select by ${selectBy})`);
  const rows = [];
  for (const [id, p] of pool) {
    if (!existsSync(p)) { console.log(`  ${id}: MISSING`); continue; }
    const r = { id, public: rate(PUBLIC, p), sealed: rate(SEALED, p), truth: rate(TRUTH, p) };
    rows.push(r);
    console.log(`  ${id.padEnd(9)} public=${f(r.public)} sealed=${f(r.sealed)} truth=${f(r.truth)}`);
  }
  // select winner
  const key = selectBy;
  let win = null, best = -1;
  for (const r of rows) {
    const v = typeof r[key] === "number" && Number.isFinite(r[key]) ? r[key] : -1;
    if (v > best) { best = v; win = r; }
  }
  console.log(`  -> WINNER by ${key}: ${win.id}  | winner sealed=${f(win.sealed)} truth=${f(win.truth)}`);
  return { name, win, rows };
}

const A = scorePool("best-of-N (8: 4 reused seed-1 + 4 new haiku)", bestN, "sealed");
const B = scorePool("best-of-4-naive (4 haiku)", naive4, "public");
const C = scorePool("frontier (2 opus, best-of-1)", frontier, "sealed");

// token totals (subagent_tokens captured from Agent results)
const TOK = {
  "best-of-N": 86714 /* seed-1 4 specimens, from FINDINGS */ + 17095 + 17430 + 26296 + 25596,
  "best-of-4-naive": 28234 + 25150 + 24805 + 24317,
  "frontier": 16161 + 17221,
};

console.log("\n\n==================== SUMMARY (1 seed, directional) ====================");
console.log("condition          | winner       | winner-truth | winner-sealed | tokens");
const out = [
  ["best-of-N", A], ["best-of-4-naive", B], ["frontier", C],
];
for (const [label, res] of out) {
  console.log(
    `${label.padEnd(18)} | ${res.win.id.padEnd(12)} | ${String(f(res.win.truth)).padEnd(12)} | ${String(f(res.win.sealed)).padEnd(13)} | ${TOK[label]}`
  );
}
