# PILOT-RESULTS — A/B/C SWE-Bench pilot (2026-06-25)

End-to-end A/B/C run on aarch64, per `PILOT-PREREG.md`. Pipeline: generate Haiku candidate pool
(blind) → grade WHOLE pool via official harness on Epoch arm64 images → post-hoc selectors A/B/C →
resolved-rate. **Directional only (n=1 mixed pool).** Honest caveats are load-bearing — read them.

## Filter (network-bound instances)

Network-dependent instances (e.g. old `requests` tests hitting live `httpbin` → 503 with no egress;
see `DRYRUN-RESULTS.md`) are excluded by construction: every pilot instance must **gold-resolve in
our arm64 harness** (hermetic + correctly graded). Final set is `pytest`-repo (hermetic) instances.

## Instances + pool grading (truth oracle, whole pool)

N=4 Haiku candidates per instance, blind to FAIL_TO_PASS/test_patch (issue + repo only), graded by
the official harness. Targeted medium-hard pytest instances (bigger gold patches).

| instance | gold | pool resolved | kind | note |
|----------|------|---------------|------|------|
| pytest-8399 (unittest fixture name) | 13L | **4/4** | all-pass | trivial 1-line fix; all converge |
| pytest-6197 (`__init__.py` collect regression) | — | **1/4** | **MIXED** | c2 correct; c1/c3 empty (API stall); c4 regresses 1 P2P (144/145) |
| pytest-10356 (MRO marker merge) | 54L | **0/4** | all-fail | even Opus (C) fails — hard for all |

Only **1/3 pools is MIXED** — the binding constraint the design predicted. Easy → all-pass (no
signal), hard → all-fail (nothing to select). Signal lives only in 6197.

## A/B/C selectors (resolved-rate)

- **A — STZ (gate→judge):** drop candidates with PASS_TO_PASS regression, then the frozen
  `stz-judge` picks among survivors (blind to F2P).
- **B — naive (public):** pick by max PASS_TO_PASS pass-rate; ties → **expected** resolved over the
  tied set (not a lucky pick).
- **C — frontier:** 1 Opus best-of-1.

| condition | pytest-6197 (mixed) | pytest-10356 (all-fail) | pytest-8399 (all-pass) | **mean** |
|-----------|--------------------|-------------------------|------------------------|----------|
| **A** STZ judge | 1 — gate drops c4 (P2P 144/145); judge picks c2 (correct) | 0 | 1 | **0.667** |
| **B** naive P2P | 0.33 — empties c1,c3 + c2 tie at 145 P2P; B can't tell no-op from fix → E[resolved]=1/3 | 0 | 1 | **0.444** |
| **C** frontier Opus | 1 | 0 — Opus also fails | 1 | **0.667** |

**A (0.667) > B (0.444); A ≈ C (0.667).**

## Reading against the pre-registered table

- **A > B (same pool):** the judge distinguishes candidates that pass the existing public suite
  WITHOUT fixing the bug (here, no-op/regressing diffs) — the public suite is non-discriminating.
  → *core STZ claim (selection signal beats public pass-rate) — directionally confirmed*, and it
  reproduces the cron-pilot finding on a real SWE-Bench instance.
- **A ≈ C:** Haiku best-of-N + judge selection matches frontier Opus best-of-1.
  → *weak model + good selection reaches frontier via samples → the 0.8.0 convergence loop (more
  rounds) is NOT warranted; scale samples + sharpen selection.* Consistent with the locked
  3-model decision.

## Honest caveats (non-negotiable — these bound the claim hard)

1. **n=1 mixed pool.** 8399 (all-pass) and 10356 (all-fail) have A=B=C by construction; the entire
   A−B gap comes from ONE instance (6197). This is **directional, not significant.**
2. **A>B is inflated by stalled-agent empties.** 2 of 6197's 4 candidates were empty diffs (mid-run
   API stalls), not substantive attempts. Empties pass PASS_TO_PASS (no-op on base) but don't fix —
   they are exactly what B can't distinguish. That IS a real failure mode (a candidate green on the
   existing suite yet not fixing the bug), but the *magnitude* here is partly a stall artifact, not
   a clean 4-substantive-candidate contest.
3. **The judge's 6197 pick was easy** (only c2 was a real change). No hard discrimination was tested
   — **no judge "accuracy rate" is claimed** (pre-reg discipline).
4. **10356: even Opus fails** → a frontier ceiling on some Verified instances, orthogonal to A/B/C.
5. Verdict is **directional and consistent with prior pilots**, NOT independently sufficient to
   settle 0.8.0. To harden: more MIXED pools (≥5–10), N=4 fully-substantive candidates (retry
   stalled agents), multiple repos.

## Pipeline (reusable, committed)

`run_epoch_arm64.py` (gold), `grade_pool_official.py` (candidate pool via official harness on arm64),
`grade_candidate.py` (quick pytest-native grader; fragile on non-pytest repos — official path
preferred). Generation = `stz-specimen` (Haiku/Opus), selection = `stz-judge`, all in-session.
