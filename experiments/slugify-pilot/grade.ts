/**
 * Grade one frozen condition-winner on the HELD-OUT truth suite and append a results row.
 *
 * Reuses the production eval runner unchanged (import only, no writes to src/). Run via tsx:
 *
 *   npx tsx grade.ts --condition A --seed 1 --tokens 184320 --winner <path-to-winner.mjs>
 *
 * Appends one JSON line to results/runs.jsonl. The truth suite path and token cap are fixed
 * here so every run is graded identically. NOTE on mutation-survival: the production mutators
 * (src/eval-runner.ts) target arithmetic/comparison code (lt->lte, Math.min->max, lo->hi); on
 * a string function like slugify few or none apply, so `mutants` is typically ~0 and
 * mutationSurvival is near-uninformative for this task. truthPassRate is the primary metric
 * and qualityPerToken the headline; mutation-survival is recorded but caveated (see PREREGISTRATION.md).
 */
import { runSealed, measureMutation } from "../../src/eval-runner.js";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TRUTH = resolve(HERE, "truth-suite/slugify.truth.mjs");
const RESULTS = resolve(HERE, "results/runs.jsonl");
const TOKEN_CAP = 200_000; // pre-registered per-task budget (complexity-2 cap; see budget.ts)

function arg(name: string, required = true): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && i + 1 < process.argv.length) return process.argv[i + 1];
  if (required) {
    console.error(`missing --${name}`);
    process.exit(2);
  }
  return undefined;
}

const condition = arg("condition")!; // A | B | C
const seed = Number(arg("seed"));
const tokensSpent = Number(arg("tokens"));
const winner = resolve(String(arg("winner")));
const dnf = process.argv.includes("--dnf");

if (!["A", "B", "C"].includes(condition)) {
  console.error(`--condition must be A|B|C, got ${condition}`);
  process.exit(2);
}
if (!existsSync(winner) && !dnf) {
  console.error(`winner not found: ${winner}`);
  process.exit(2);
}

const sealed = dnf ? { passed: 0, total: 1, passRate: 0 } : runSealed(TRUTH, winner);
const mut = dnf ? { mutationScore: 1, mutants: 0, survivors: 0 } : measureMutation(TRUTH, winner);

const row = {
  condition,
  seed,
  task: "slugify",
  tokenCap: TOKEN_CAP,
  tokensSpent,
  truthPassed: sealed.passed,
  truthTotal: sealed.total,
  truthPassRate: sealed.passRate,
  mutants: mut.mutants,
  survivors: mut.survivors,
  mutationSurvival: mut.mutationScore,
  qualityPerToken: tokensSpent > 0 ? sealed.passRate / tokensSpent : 0,
  winnerPath: dnf ? "" : winner,
  dnf,
};

mkdirSync(dirname(RESULTS), { recursive: true });
appendFileSync(RESULTS, JSON.stringify(row) + "\n");
console.log(JSON.stringify(row, null, 2));
