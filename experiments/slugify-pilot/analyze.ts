/**
 * Summarize results/runs.jsonl: per-condition mean/range of each metric, the headline A-vs-B
 * gap, and the paired per-seed A−C judge-ablation delta. Directional only (n=3, no significance).
 *
 *   npx tsx analyze.ts
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RESULTS = resolve(HERE, "results/runs.jsonl");

interface Row {
  condition: "A" | "B" | "C";
  seed: number;
  truthPassRate: number;
  qualityPerToken: number;
  tokensSpent: number;
  dnf: boolean;
}

const rows: Row[] = readFileSync(RESULTS, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l));

const fmt = (n: number, d = 4) =>
  !Number.isFinite(n) ? "—" : n !== 0 && Math.abs(n) < 1e-3 ? n.toExponential(2) : n.toFixed(d);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const range = (xs: number[]) => (xs.length ? `${fmt(Math.min(...xs))}..${fmt(Math.max(...xs))}` : "—");

function summarize(metric: keyof Row, label: string) {
  console.log(`\n## ${label}`);
  console.log("cond | mean     | range");
  for (const c of ["A", "B", "C"] as const) {
    const xs = rows.filter((r) => r.condition === c).map((r) => Number(r[metric]));
    console.log(`  ${c}  | ${fmt(mean(xs))} | ${range(xs)}`);
  }
}

console.log(`# Slugify pilot — ${rows.length} runs`);
if (rows.some((r) => r.dnf)) console.log(`(warning: ${rows.filter((r) => r.dnf).length} DNF rows present)`);

summarize("truthPassRate", "truthPassRate (primary)");
summarize("qualityPerToken", "qualityPerToken (headline)");
summarize("tokensSpent", "tokensSpent");

// Headline A vs B and judge ablation A vs C, paired by seed.
const bySeed = (c: "A" | "B" | "C", seed: number) => rows.find((r) => r.condition === c && r.seed === seed);
const seeds = [...new Set(rows.map((r) => r.seed))].sort();

console.log("\n## Paired per-seed deltas (truthPassRate)");
console.log("seed | A−B (headline) | A−C (judge ablation)");
for (const s of seeds) {
  const a = bySeed("A", s)?.truthPassRate;
  const b = bySeed("B", s)?.truthPassRate;
  const c = bySeed("C", s)?.truthPassRate;
  const ab = a != null && b != null ? a - b : NaN;
  const ac = a != null && c != null ? a - c : NaN;
  console.log(`  ${s}  |   ${fmt(ab)}      |   ${fmt(ac)}`);
}

console.log("\nApply go-no-go criteria in PREREGISTRATION.md (δ=0.05). Directional only at n=3.");
