// Verify judge-claimed defects are real (not hallucinated). Each probe: expr, after, expected-or-THROW.
const R = "/home/robert_li/Desktop/projects/slice-tournament-zoo/experiments/cron-pilot/runs";
const impls = {
  "s1-orig-b(truth1.0)": `${R}/seed-1-haiku-vague/A/prototypes/specimen-b/index.mjs`,
  "s1-orig-c(truth1.0)": `${R}/seed-1-haiku-vague/A/prototypes/specimen-c/index.mjs`,
  "s1-new-e(truth.977)": `${R}/control-seed-1/bestN/specimen-e/index.mjs`,
  "s1-new-g(truth.977)": `${R}/control-seed-1/bestN/specimen-g/index.mjs`,
  "s2-orig-a(truth1.0)": `${R}/seed-2/A/prototypes/specimen-a/index.mjs`,
  "s2-orig-d(truth1.0)": `${R}/seed-2/A/prototypes/specimen-d/index.mjs`,
  "s2-new-h(truth.977)": `${R}/control-3seed/fresh/seed-2/specimen-h/index.mjs`,
};
const U = (y,mo,d,h,mi) => new Date(Date.UTC(y,mo-1,d,h,mi,0));
const iso = ms => new Date(ms).toISOString().replace(".000Z","Z");
// probes: [label, expr, after, expectedISO | "THROW"]
const probes = [
  ["7=Sunday: 0 0 * * 7 ->2024-01-07", "0 0 * * 7", U(2024,1,1,0,0), "2024-01-07T00:00:00Z"],
  ["a/n step: 5/15 after 00:06 ->00:20", "5/15 * * * *", U(2024,1,1,0,6), "2024-01-01T00:20:00Z"],
  ["list+step: 0,30/15 after 00:00 ->00:30", "0,30/15 * * * *", U(2024,1,1,0,0), "2024-01-01T00:30:00Z"],
  ["out-of-range hour: throw 0 30 * * *", "0 30 * * *", U(2024,1,1,0,0), "THROW"],
  ["malformed: throw '5abc * * * *'", "5abc * * * *", U(2024,1,1,0,0), "THROW"],
];
async function run(name, path) {
  let nextRun;
  try { ({ nextRun } = await import(path)); } catch (e) { console.log(`${name}: IMPORT FAIL ${e.message}`); return; }
  const cells = [];
  for (const [lbl, expr, after, want] of probes) {
    let got;
    try { const r = nextRun(expr, new Date(after.getTime())); got = (r instanceof Date) ? iso(r.getTime()) : String(r); }
    catch (e) { got = "THROW"; }
    const ok = (want === "THROW") ? (got === "THROW") : (got === want);
    cells.push(`${ok ? "OK " : "XX "}${lbl.split(":")[0]}=${got}`);
  }
  console.log(`\n${name}`);
  for (const c of cells) console.log("   " + c);
}
for (const [n, p] of Object.entries(impls)) await run(n, p);
