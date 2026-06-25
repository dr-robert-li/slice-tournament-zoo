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

## Reading against the pre-registered table — and why this run does NOT update 0.8.0

The headline numbers (A>B, A≈C) look like the pre-registered "don't build 0.8.0" branch. They are
**not** evidence for it. Three structural reasons (this is the honest read after review):

- **A > B is a tautology, not a discovery.** B selects by PASS_TO_PASS. In SWE-Bench the bug's test
  lives in FAIL_TO_PASS, which is **held out** — so PASS_TO_PASS is blind to the fix *by
  construction*. B literally cannot see which candidate fixes the bug, on **any** instance. A>B was
  guaranteed the moment B was defined this way; the empties just inflate it. This is **weaker** than
  cron, where the public suite actually *passed leaky specimens* (a real false signal). So this does
  **not** reproduce the cron finding.
- **A ≈ C is n=1, met by number not mechanism.** A and C are *forced* equal on 8399 (all-pass→both 1)
  and 10356 (all-fail→both 0). The only instance where they *could* diverge is 6197 — where both
  happened to hit 1 because a correct Haiku candidate existed and both the judge and Opus found it.
  "Best-of-N+judge reaches frontier" is established on exactly one instance. Same trap as the cron
  tie-break: a mean equality that is an artifact of instance composition.
- **10356 is the one instance that actually probes 0.8.0 — and the pilot is SILENT on it.** It has a
  real correctness gradient that best-of-4 (0/4) *and* frontier-best-of-1 both missed. That is
  precisely the regime where a convergence loop was hypothesized to earn its cost: iterate toward a
  fix none of the N samples got. Opus-best-of-1 failing tells us **nothing** about whether
  *iteration* would succeed. Do not file this as "frontier ceiling, orthogonal" — it is the open
  question, left open.

**Net: this run does not move the 0.8.0 decision in either direction.** The deferral of 0.8.0
continues to rest on cron/hexcolor, NOT on this pilot.

## What this run genuinely establishes

1. The **aarch64 substrate + the full A/B/C pipeline work end-to-end** (generate → grade whole pool
   via official harness → selectors). Real, durable, reusable.
2. **Mixed pools are rare at N=4** — 1/3 here, and only after hunting to medium-hard instances
   (easy→all-pass, hard→all-fail). This is the most decision-relevant finding: if selection rarely
   has anything to select *among*, the lever is neither "more rounds" nor "best-of-N selection" —
   it's getting candidates into the mixed band at all.
3. A micro-illustration on 6197 that a judge ignores no-op/regressing candidates — but see the
   tautology above; treat as anecdote, not evidence.

## Honest caveats (bound the claim hard)

1. **n=1 mixed pool** — directional at best, not significant.
2. **A>B inflated by 2 stalled-agent empty candidates** (mid-run API stalls), on top of B being
   structurally blind.
3. **Judge's 6197 pick was trivial** (only c2 was a real change). **No judge accuracy claim.**
4. **No "consistent with the locked decision" credit** — consistency with a prior belief is not
   evidence.
5. **The only path to a conclusive pilot** is ≥5–10 MIXED pools with 4 *substantive* candidates
   each — a real scope/spend escalation, and it must include the iterate-on-an-all-fail-pool case to
   actually test 0.8.0. Surface as a user choice; do not treat this run as enough.

## Pipeline (reusable, committed)

`run_epoch_arm64.py` (gold), `grade_pool_official.py` (candidate pool via official harness on arm64),
`grade_candidate.py` (quick pytest-native grader; fragile on non-pytest repos — official path
preferred). Generation = `stz-specimen` (Haiku/Opus), selection = `stz-judge`, all in-session.
