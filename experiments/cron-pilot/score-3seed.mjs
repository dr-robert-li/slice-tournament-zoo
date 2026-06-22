import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
const ROOT = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/cron-pilot";
const SEALED = ROOT + "/suites-v2/cron.sealed.mjs";
const TRUTH = ROOT + "/truth-suite/cron.truth.mjs";
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
const origSeed = { 1: "seed-1-haiku-vague", 2: "seed-2", 3: "seed-3" };

function freshPool(seed) {
  const pool = [];
  for (const s of ["a","b","c","d"])
    pool.push(["orig-"+s, `${ROOT}/runs/${origSeed[seed]}/A/prototypes/specimen-${s}/index.mjs`]);
  const freshDir = seed === 1 ? `${ROOT}/runs/control-seed-1/bestN` : `${ROOT}/runs/control-3seed/fresh/seed-${seed}`;
  for (const s of ["e","f","g","h"])
    pool.push(["new-"+s, `${freshDir}/specimen-${s}/index.mjs`]);
  return pool;
}

function scoreSeed(seed) {
  console.log(`\n=== FRESH-ONLY best-of-8, seed ${seed} (orig a-d + fresh e-h; mixed prompt regimes) ===`);
  const rows = [];
  for (const [id, p] of freshPool(seed)) {
    if (!existsSync(p)) { console.log(`  ${id}: MISSING`); continue; }
    rows.push({ id, sealed: rate(SEALED, p), truth: rate(TRUTH, p) });
  }
  for (const r of rows) console.log(`  ${r.id.padEnd(7)} sealed=${f(r.sealed)} truth=${f(r.truth)}`);
  // top sealed tier
  const num = r => (typeof r.sealed === "number" && Number.isFinite(r.sealed)) ? r.sealed : -1;
  const top = Math.max(...rows.map(num));
  const tier = rows.filter(r => num(r) === top);
  const truths = tier.map(r => (typeof r.truth === "number") ? r.truth : NaN);
  const tBest = Math.max(...truths.map(t => Number.isFinite(t) ? t : -1));
  const tWorst = Math.min(...truths.map(t => Number.isFinite(t) ? t : 2));
  const expected = truths.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / truths.length;
  const tieWinner = tier[0]; // id-order tie-break, matches v>best scorer
  const mixed = new Set(truths.map(t => f(t))).size > 1;
  console.log(`  TOP-SEALED TIER (=${f(top)}): [${tier.map(r => r.id + ":" + f(r.truth)).join(", ")}]`);
  console.log(`    truth spread: best=${f(tBest)} worst=${f(tWorst)} expected-under-random-tie=${f(expected)}`);
  console.log(`    id-order tie-break winner: ${tieWinner.id} (truth ${f(tieWinner.truth)})  | MIXED-TIER=${mixed ? "YES" : "no"}`);
  return { seed, rows, tier, mixed, tBest, tWorst, expected, tieWinner };
}

const seeds = [1, 2, 3].map(scoreSeed);

console.log(`\n=== FRONTIER (Opus best-of-1, take best by sealed) per seed ===`);
for (const seed of [1, 2, 3]) {
  const dir = seed === 1 ? `${ROOT}/runs/control-seed-1/frontier` : `${ROOT}/runs/control-3seed/frontier/seed-${seed}`;
  const rows = [];
  for (const s of ["a","b"]) {
    const p = `${dir}/specimen-${s}/index.mjs`;
    if (existsSync(p)) rows.push({ id: "opus-" + s, sealed: rate(SEALED, p), truth: rate(TRUTH, p) });
  }
  let win = rows[0], best = -1;
  for (const r of rows) { const v = typeof r.sealed === "number" ? r.sealed : -1; if (v > best) { best = v; win = r; } }
  console.log(`  seed ${seed}: ${rows.map(r => r.id + " " + f(r.sealed) + "/" + f(r.truth)).join("  ")}  -> winner ${win.id} truth=${f(win.truth)}`);
}

console.log(`\n=== NAIVE+CONTRACT (seed-1, select by PUBLIC) vs original NAIVE (no contract) ===`);
const PUBLIC = ROOT + "/suites/cron.public.mjs";
for (const s of ["a","b","c","d"]) {
  const p = `${ROOT}/runs/control-3seed/naive-contract/seed-1/specimen-${s}/index.mjs`;
  if (existsSync(p)) console.log(`  naive+contract-${s}  public=${f(rate(PUBLIC,p))} sealed=${f(rate(SEALED,p))} truth=${f(rate(TRUTH,p))}`);
}
console.log("  (compare: original naive4 all truth=HANG; if these don't hang, the DNF was framing not selection)");
