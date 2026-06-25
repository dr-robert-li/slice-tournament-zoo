# PILOT-PREREG-BLIND — blind iterate arm vs best-of-N at matched budget (2026-06-26)

Pre-registered before any candidate/critic/suite is generated. This is the escalation the scaled
run (`PILOT-RESULTS-SCALED.md`) said was required: the iterate arm there was confounded because the
critic was not blind to FAIL_TO_PASS, the prompts encoded the diagnosis, and recall went
uncontrolled. This design fixes the first two and partially controls the third, and adds the
budget-matched comparison the original A/B/C table called for.

## Question

Does a convergence loop (iterate with a BLIND critic steered only by a sealed signal) reach
`resolved` more often than best-of-N drawing from the same budget? Two comparisons:
- **equal-budget:** iterate and best-of-N each get the SAME total token budget B per instance.
- **absolute:** each method at its natural budget, report resolved-rate and resolved-per-token.

## The sealed signal (fixes the obstacle SWE-Bench creates)

SWE-Bench gives you a public suite (PASS_TO_PASS) and a held-out oracle (FAIL_TO_PASS). On the
instances that matter the public suite is already fully green, so a loop blind to F2P has nothing to
fire on. So we AUTHOR one, exactly as STZ does in-tournament:

- Per instance, `stz-test-author` writes a **sealed suite** from the issue text plus a contract
  derived from the issue, **BLIND to FAIL_TO_PASS and test_patch**. This suite is the loop's ONLY
  feedback signal. It stands in for the 0.8.0 pressure-log / sealed suite.
- **Train-on-test guard (load-bearing):** the author never sees F2P or test_patch. Suite quality is
  checked two ways that do NOT leak the oracle: (a) satisfiable — the gold patch passes it;
  (b) discriminating — the base repo (no fix) fails it. A suite that passes base, or fails gold, is
  rejected and re-authored. We do NOT copy F2P cases in, and we record the author transcript so the
  blindness is auditable.
- The sealed suite is NEVER the grading oracle. Grading is always the SWE-Bench truth oracle
  (F2P + P2P) via the official harness, used only to SCORE after the fact.

## Conditions (per instance, fixed token budget B)

Both conditions draw blind candidates (issue + repo only; never F2P/test_patch). Both are scored by
the truth oracle. Token spend is summed from `subagent_tokens`.

- **best-of-N:** spend B generating N independent candidates. Select by sealed-suite pass-rate, after
  a no-PASS_TO_PASS-regression gate. No iteration, no critic. Score the selected patch.
- **iterate:** spend B on a loop. Generate 1 candidate; run the SEALED suite; if it fails, a critic
  that sees ONLY {issue, candidate diff, code, sealed-suite failures} — never F2P, no operator
  pointed questions — writes a critique; a reviser revises; repeat until the sealed suite passes or B
  is exhausted. Continue/stop is driven ONLY by the sealed signal. Score the final patch.

Same B for both = the equal-budget arm. Run each at 1x, 2x, 4x B for the absolute curve.

## Blindness (non-negotiable, audited)

- Specimens, reviser, critic, and sealed-suite author NEVER see FAIL_TO_PASS or test_patch.
- Critic prompts carry NO operator diagnosis and NO leading questions — only the sealed-suite
  failure output and the code. (This is the specific fix for the scaled-run confound.)
- The loop's stop/continue decision reads the sealed suite ONLY, never the truth oracle.

## Recall (acknowledged, partially controlled)

SWE-Bench pytest fixes are plausibly in-weights; we cannot fully remove that. We reduce its leverage
by (a) making the loop signal an authored sealed suite rather than the recalled canonical test, and
(b) reporting the comparison as RELATIVE (both conditions share the same recall), not as absolute
difficulty. We still flag any critique that names the upstream fix/version as recall-contaminated.

## Metrics + pre-registered decision

Per condition: resolved-rate (truth), total tokens, resolved-per-token. Report n and mixed-pool
count. Use the GAP/NEITHER buckets from the scaled run as the instance set (that is where signal
lives), plus fresh instances to dilute recall.

| outcome (equal budget) | reading | action |
|------------------------|---------|--------|
| iterate resolved > best-of-N | the loop reaches fixes sampling does not, at the same cost | **0.8.0 warranted** — spec/build it |
| iterate ≈ best-of-N | more rounds add nothing sampling does not | **0.8.0 not warranted** — scale samples |
| iterate < best-of-N | the loop wastes budget chasing a sealed signal that misleads | 0.8.0 harmful here; investigate the sealed-signal quality |

Absolute arm refines: if iterate only wins at >1x budget, note the token premium (disclosed by
design per README §47-50) and whether resolved-per-token still favors it.

## Discipline carried from every prior pilot

- Symmetric-error rule: a confounded result leaning pro-build is the same error as one leaning
  anti-build. If blindness/recall control fails, the run is SILENT, not supportive.
- No judge/critic "accuracy rate" claim.
- n=slice is directional; expand only on a clean signal.

## Execution order

1. Vertical slice on ONE instance: author a sealed suite, verify satisfiable (gold passes) +
   discriminating (base fails). If the author can't produce one blind, that itself is a finding.
2. Run best-of-N and iterate at equal B; score both by truth.
3. Expand to the GAP/NEITHER set + fresh instances; absolute-budget curve.
4. Apply the table.
