# Runbook — Slugify Validation Pilot (9 runs, by hand)

Everything lives under `experiments/slugify-pilot/`. **No production assets are written.** The
real STZ tournament writes a transient `.stz/` tree per run; that is run state, not a committed
asset, and is discarded after grading.

Read `PREREGISTRATION.md` first — it is frozen. Do not edit suites mid-pilot.

## 0. Pre-flight (already done at authoring time)

- Honesty gate matrix (re-run anytime with the command in §5):

  | impl | public | sealed | truth |
  |------|--------|--------|-------|
  | reference | 1.00 | 1.00 | **1.00** |
  | nearmiss-ascii-only | **1.00** | 0.78 | **0.94** |
  | naive-1-spaces-only | 0.46 | 0.09 | 0.60 |
  | naive-2-no-normalize | 0.69 | 0.39 | 0.71 |
  | naive-3-single-trim | 0.92 | 0.96 | 0.94 |
  | naive-4-no-collapse | 0.69 | 0.70 | 0.90 |

  Gate = reference passes all three; every fixture fails truth; near-miss passes public but
  fails truth. ✔

- Suites sealed: `node seal.mjs verify suites && node seal.mjs verify truth-suite` → both `ok`.

## 1. The contract handed to every implementer

Give implementers **only** `slice/CONTRACT.md` and `suites/slugify.public.mjs` (the public
suite). NEVER show them `suites/slugify.sealed.mjs` or anything under `truth-suite/`. Each
implementer must export `slugify(input)` from an `index.mjs` (the `node <suite> <impl>`
harness contract).

## 2. Per-seed procedure (seed ∈ {1, 2, 3})

Work in a scratch dir per run, e.g. `runs/seed-<n>/<cond>/`. Capture `tokensSpent` for each
run consistently (sum of the agent token usage for that run).

**Pre-flight (do ONCE before the 9 runs):** run a single condition-A tournament as a dry run
and confirm two things, or the corresponding metric is downgraded per PREREGISTRATION.md:
- **Token capture works the same way for A (multi-agent) and B (single agent).** STZ's
  `CostTracker`/`calls.jsonl` is fed by the *mock* orchestrator's synthetic figures — confirm
  you can pull a *real* `tokensSpent` for a live tournament and for a single B agent by the
  same method. If not, drop quality-per-token and report truthPassRate only.
- **Specimen gate-pass rate.** With the strict `passRate===1` gate, check how many of the 4
  specimens clear the sealed suite. If it's routinely 0, condition A degenerates to DNF and the
  A−C ablation is uninformative — reconsider N or the gate before spending all 9 runs.

### Condition A — STZ tournament
Run the real tournament for the slugify slice (the `/stz:run` flow, or spawn 4 `stz-specimen`
agents → gate on the sealed suite → 4 `stz-judge` pairwise votes → GRPO `select`). Copy
`suites/slugify.sealed.mjs` into the tournament's transient `.stz/30-tests/held-out/` so it is
the gate/selection suite. Winner `index.mjs` → `runs/seed-<n>/A/`.

### Condition B — sequential critique-revise (= naive iterative Claude Code)
Spawn ONE coding agent. Loop ≤4 rounds: implement `index.mjs` → run `suites/slugify.public.mjs`
against it → feed the failing cases back verbatim → revise. Stop at round 4 or first clean
public pass. Winner → `runs/seed-<n>/B/`. The agent sees ONLY the public suite's failures.

### Condition C — best-of-N (no judge)
**C reuses A's own 4 specimens — do NOT spawn fresh ones.** Score each of A's specimens with
the sealed suite; C's winner = highest sealed pass-rate (tie → first by specimen id). No judge,
no extra agent calls. This makes A−C a clean paired ablation: the only difference is the judge,
so A−C is exactly the judge's marginal value. If zero of A's specimens cleared the gate, A is
DNF (`--dnf`) but C still records the best-of-4. Winner → `runs/seed-<n>/C/`.

## 3. Grade each winner on the truth suite

```
npx tsx grade.ts --condition A --seed 1 --tokens <tokensSpent> --winner runs/seed-1/A/index.mjs
npx tsx grade.ts --condition B --seed 1 --tokens <tokensSpent> --winner runs/seed-1/B/index.mjs
npx tsx grade.ts --condition C --seed 1 --tokens <tokensSpent> --winner runs/seed-1/C/index.mjs
```
Repeat for seeds 2 and 3 → 9 rows in `results/runs.jsonl`. Use `--dnf` if a condition failed to
produce a winner under the cap (records a zero row).

## 4. Analyze

```
npx tsx analyze.ts   # (optional helper) or read results/runs.jsonl directly
```
Report per metric: 3 seed points + mean + range. Headline = A vs B on truthPassRate. Judge
ablation = paired per-seed delta A−C. Apply the go-no-go criteria in PREREGISTRATION.md.
Remember mutationSurvival is caveated (mutants≈0 on string code) — do not weight it.

## 5. Integrity checks (run before and after the pilot)

```
# honesty-gate matrix
for s in suites/slugify.public.mjs suites/slugify.sealed.mjs truth-suite/slugify.truth.mjs; do
  for i in truth-suite/reference/slugify.ref.mjs truth-suite/naive/*.mjs; do
    printf '%s %s ' "$(basename $s)" "$(basename $i)"; node "$s" "$PWD/$i" | tail -1; done; done

# seals must not drift
node seal.mjs verify suites
node seal.mjs verify truth-suite
```

## Notes / known limitations

- **mutationSurvival is near-uninformative here** (numeric mutators vs string code). Primary =
  truthPassRate; headline = qualityPerToken.
- **n=3 is a pilot.** Results are directional go-no-go, not significance. If signal warrants,
  scale to the multi-task private battery (out of scope here) before any SWE-bench positioning.
- **Contamination:** slugify is greenfield and unpublished, but a frontier model has surely
  seen *a* slugify. The contract's deliberate ASCII-only / no-transliteration choices make
  memorized library behavior (e.g. `ß→ss`) a *failure* here, which helps separate recall from
  reasoning.
