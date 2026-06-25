# PILOT-PREREG — A/B/C SWE-Bench pilot, pre-registered design (2026-06-25)

Committed BEFORE generating/grading any candidate (Opus-thread mandate; the discipline the cron /
hexcolor pilots ran on). Decision criteria are fixed here so numbers can't retro-fit the verdict.

## Question

Does STZ's **selection signal** (a frozen reasoning judge over a candidate pool) beat the naive
**public-suite** signal, and does best-of-N reach frontier — i.e. is the 0.8.0 convergence loop
warranted? (See `../HANDOFF.md` decision.)

## Substrate (proven)

aarch64 SWE-Bench via Epoch arm64 images → official `report.json` → `eval-adapter.mjs report`
(`DRYRUN-RESULTS.md`). Grading is the official `resolved` oracle: ALL FAIL_TO_PASS pass AND ALL
PASS_TO_PASS still pass.

## Instances

- SWE-bench **Verified**, **hermetic only**: an instance is eligible iff its **gold patch
  resolves** in our arm64 harness (filters network/env-bound instances like the requests/httpbin
  ones — see DRYRUN-RESULTS). Gold-filter is free (Docker, no API).
- Target **medium difficulty** (not smallest-p2p): signal lives in MIXED pools only (some
  candidates resolve, some don't). All-pass and all-fail pools carry zero selection signal.
- **Size to mixed pools, not instances.** Measure the mixed-pool rate on the vertical slice, then
  over-provision instances to hit a pre-set number of mixed pools.

## Candidate generation (blind)

- Per instance, a SHARED pool of **N=4** candidate patches from `stz-specimen` agents on **Haiku**.
- Each reads ONLY the issue text + the repo at `base_commit`. **BLIND** to FAIL_TO_PASS,
  PASS_TO_PASS internals, and `test_patch`. Output = a unified diff.
- A non-applying diff (`git apply` fails in the container) counts as a **real unresolved**, never
  silently dropped (silent drops inflate every selector equally and hide pool attrition).

## Grade the whole pool (truth oracle, ONCE)

Apply each candidate diff in the Epoch arm64 container, run FAIL_TO_PASS+PASS_TO_PASS via the
adapter → `resolved ∈ {true,false}` per candidate. A/B/C are post-hoc **selectors over this graded
pool** (so B's tie-break becomes an expectation, not a coin flip).

## Selectors (the conditions)

- **A — STZ (judge-selected):** the frozen `stz-judge` reads issue + the N candidate diffs (BLIND
  to F2P) and picks one. Gate first on **no PASS_TO_PASS regression** (public, fair), then judge
  among non-regressors. A's score = `resolved` of the judged pick.
  *(Judge, NOT a per-instance authored suite — an issue-derived suite collapses toward F2P =
  train-on-test. The judge is also exactly what 0.8.0 is.)*
- **B — naive (public-selected):** pick the candidate with max **PASS_TO_PASS** pass-rate (the
  existing public suite — the only signal a naive dev has; no bug-specific test). Ties → report
  **expected resolved-rate over the tied set** (mean of `resolved` across tied candidates), not one
  lucky pick.
- **C — frontier (best-of-1):** 1 `stz-specimen` patch on **Opus**, same blind prompt, no
  selection. C's score = its `resolved`.

## Metric + pre-registered decision table

Metric = **resolved-rate** per condition over the mixed-pool instance set (report n + mixed-pool
count explicitly). Also report pool-level diagnostics (mean candidates resolved, apply-failure rate).

| outcome | reading | action |
|---------|---------|--------|
| A ≈ C (frontier) | weak model + judge selection reaches frontier via samples | STZ value = selection; **0.8.0 NOT needed** — scale samples |
| A > B (same pool) | edge is the judge, not the draws | core STZ claim confirmed |
| A plateaus < C, N-scaling doesn't close it | samples insufficient | **greenlight 0.8.0**; build, test at equal budget |
| A ≈ B | judge adds nothing here | escalate to harder/less spec-gap task before any build |

## Discipline (non-negotiable)

- **Blindness:** specimens + judge never see FAIL_TO_PASS / test_patch.
- **No judge "accuracy rate" claim** — report selection wins, not an oracle-accuracy number.
- **n=slice is directional only.** Expand only if mixed-pool signal is promising.

## Execution order

1. **Vertical slice (1 instance):** generate 4 Haiku patches → grade all 4 → confirm pool MIXED +
   all diffs apply. Report mixed-pool result. Fan out ONLY if clean.
2. Fan out to enough hermetic medium instances to hit the mixed-pool target.
3. Apply selectors A/B/C, compute resolved-rates, apply table → 0.8.0 go/no-go.
