# PILOT-RESULTS-SCALED — batch-1 + iterate arm (2026-06-26)

Scale-up of the A/B/C pilot (user: "scale it up" — subscription-billed in-session agents).
10 instances total, then an iterate arm. **Bottom line up front: this run is SILENT on the 0.8.0
decision** — the headline iterate result is confounded three ways and does not constitute evidence.
The 0.8.0 deferral continues to rest on cron/hexcolor, not this run. (Same resting place as the
batch-0 review, reached by refusing the symmetric temptation to let a confounded run flip the lean.)

## What scaled cleanly (real, durable)

- **Pipeline scales:** 35 candidates generated (28 Haiku + 7 Opus, no empties this batch) → graded
  whole-pool via the official harness on Epoch arm64 images. `run_epoch_arm64.py` +
  `grade_pool_official.py` handle it.
- **Mixed pools are rare at N=4:** across batch-0+1, ~4/10 pools are mixed; the rest are all-pass
  (easy) or all-fail (hard). Most decision-relevant scaling fact: selection rarely has anything to
  select among.
- **best-of-N-Haiku ≈ frontier-Opus-best-of-1 in aggregate, but COMPLEMENTARY.** Both resolve 6/10,
  on *different* instances: 2 where Haiku-best-of-4 wins (Opus-best-of-1 fails), 2 where Opus wins
  (Haiku-best-of-4 fails), 4 both, 2 neither. Not dominance — complementarity.

## best-of-N vs frontier (10 instances)

| bucket | instances | reading |
|--------|-----------|---------|
| both resolve | 6197, 8399, 5631, 7236 | easy/medium — either path works |
| Haiku-best-of-4 only | 10051, 7490 | samples beat frontier-single-shot |
| Opus-best-of-1 only (GAP) | 7324, 5787 | frontier beats these samples |
| neither | 10356, 5840 | hard for both |

## Iterate arm — CONFOUNDED, not evidence

Goal: test whether iteration (a convergence-loop proxy) reaches fixes best-of-N missed. Ran 1 round
(critic → Haiku reviser → grade) on the 2 GAP + 2 NEITHER instances. Raw outcome: 3/4 "closed"
(7324, 5787, 10356), incl. 10356 which best-of-N AND Opus-best-of-1 both missed; cheap Haiku-critic
also closed 7324.

**Why this is NOT valid evidence for 0.8.0** (the verdict was corrected on review):

1. **The critic was not blind to the held-out oracle.** On 7324/10356 the candidates passed
   **100% of PASS_TO_PASS** (58/58, 79/79). A real loop, blind to FAIL_TO_PASS, sees every visible
   test green and **stops** — it never fires a critique round. The only signal that these were wrong
   came from the operator reading the held-out F2P (1/3, 0/1) and writing "incomplete / still wrong"
   into the critic prompt. **The experiment assumed away the hardest thing 0.8.0 must do: know
   you're not done without the held-out test.** (On 5787 the regression IS public — P2P 122/123 — so
   that one is less confounded, but it's a GAP instance Opus already solves, so it shows
   iteration ≈ frontier at best.)
2. **Operator-authored pointed questions encoded the diagnosis.** Critic prompts asked e.g. "is it
   walking the MRO backwards?", "do constants bypass the matcher?" — that's the answer, handed in.
3. **Training recall.** Critics cited "upstream pytest 7.2.0"; SWE-Bench pytest fixes are plausibly
   in-weights. The iterate arm is the MOST recall-sensitive arm (the critic only has to *retrieve* a
   fix, not generate it). The Haiku-critic success does NOT control for this (same prompt, same
   pytest in weights).

   10356 concretely = best-of-N produced a correct MRO walk except `reversed()`; a non-blind critic,
   told it failed and recalling upstream, flipped one token. That is "best-of-N got 90% there; a
   non-blind, recall-equipped critic finished it" — not "iteration crosses a gradient blind."

→ **Silent on 0.8.0.** Drop any "predicate observed" / "reverses the prior lean" reading.

## The one genuine seed (still confounded)

These models **critique a concrete wrong candidate better than they generate from scratch** (Haiku
failed 7324 as an implementer 0/4, but as a critic diagnosed the fix). That decomposition is the
interesting direction — but it is confounded by recall and by the non-blind framing, and means
nothing until tested blind.

## A clean iterate arm (real escalation — for a future run, not faked here)

- Critic sees only: issue + candidate + code + a **sealed/public verdict** — NEVER FAIL_TO_PASS.
- Loop continue/stop driven ONLY by that sealed signal. **Note:** on instances where PASS_TO_PASS is
  already 100% (7324, 10356), the public suite gives the loop nothing to fire on — you need a SEALED
  held-out signal distinct from the public suite, or the loop never starts. (This is exactly the STZ
  sealed-suite premise; SWE-Bench doesn't hand you one.)
- No operator-authored pointed/diagnostic questions.
- Control recall: pick instances/repos less likely in-weights, or perturb so retrieval ≠ solution.
- Then compare iterate vs best-of-N **at equal token budget** (the pre-registered table's condition).

Until that exists, 0.8.0 stays deferred on the strength of cron/hexcolor — this run neither supports
nor refutes it.
