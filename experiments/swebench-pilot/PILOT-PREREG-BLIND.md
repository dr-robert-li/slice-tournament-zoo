# PILOT-PREREG-BLIND — blind iterate arm vs best-of-N at matched budget (2026-06-26)

Pre-registered before any candidate/critic/suite is generated. This is the escalation the scaled
run (`PILOT-RESULTS-SCALED.md`) said was required: the iterate arm there was confounded because the
critic was not blind to FAIL_TO_PASS, the prompts encoded the diagnosis, and recall went
uncontrolled. This design fixes the first two and adds the budget-matched comparison the original
A/B/C table called for.

## SUBSTRATE DECISION (corrected on review — runs on SYNTHETIC tasks, not SWE-Bench)

SWE-Bench has been silent on 0.8.0 three times now (cron-confound, A/B/C-tautology,
scaled-iterate-confound). It structurally cannot decide this build, for two reasons the blind arm
does NOT fix and that both bias toward a false "iterate wins → build":

- **Recall is asymmetric, not cancelling.** The conditions differ in retrieval-anchoring context.
  Cold best-of-N gets issue+code once; the iterate loop gets issue+code+*a concrete wrong candidate*+
  sealed failures across rounds — a far better prompt for *retrieving* pytest's memorized real fix.
  So an iterate win on SWE-Bench cannot be separated from "iterate is a better retrieval harness."
  This is live, not hypothetical: scaled-run critics cited "upstream pytest 7.2.0," and
  Haiku-as-critic succeeded where Haiku-as-implementer failed 4× (equally explained by "candidate+
  code is a better retrieval prompt" as by "critique is an easier sub-task").
- **An issue-authored sealed suite is the train-on-test the A/B/C pre-reg already rejected.** The
  issue describes the bug, so a faithful blind suite targets the same behavior as FAIL_TO_PASS. If
  sealed ≈ F2P, "iterate until sealed passes" = "iterate until the oracle passes" and iterate wins
  trivially. "Base repo fails it" is too weak to rule this out.

**Therefore the arm runs on the synthetic STZ tasks — cron first, then hexcolor/ipv4.** They are
not in anyone's training data (recall-free), and they ALREADY have the sealed/truth split this needs:
`cron-pilot/suites-v2/cron.sealed.mjs` is the blind loop signal, `cron-pilot/truth-suite/cron.truth.mjs`
is the scorer, `cron-pilot/slice/CONTRACT-VAGUE.md` is what specimens see. A win there is unambiguous
about iteration-vs-sampling, and it is the load-bearing STZ evidence anyway. SWE-Bench is kept for
*demonstrating* a decided win later; it cannot *decide* the build. The methodology below
(equal+absolute budget) is unchanged — the redirect is substrate, not method.

## Question

Does a convergence loop (iterate with a BLIND critic steered only by a sealed signal) reach
`resolved` more often than best-of-N drawing from the same budget? Two comparisons:
- **equal-budget:** iterate and best-of-N each get the SAME total token budget B per instance.
- **absolute:** each method at its natural budget, report resolved-rate and resolved-per-token.

## The sealed signal (already exists on the synthetic substrate)

On cron the split this needs already exists, authored in the original pilot BLIND to the truth
oracle — so there is no fresh issue-derived authoring and confound 2 does not apply:

- **Blind loop signal:** `cron-pilot/suites-v2/cron.sealed.mjs`, run via the existing eval runner
  (`node <sealed> <impl>` → final JSON line, the same contract the bridge uses). This is the loop's
  ONLY feedback. It was authored blind to truth in the original cron pilot, not derived now from the
  answer.
- **Scorer (never steers):** `cron-pilot/truth-suite/cron.truth.mjs`, run the same way. Used only to
  score the final patch of each condition. The loop never reads it.
- **What specimens see:** `cron-pilot/slice/CONTRACT-VAGUE.md` only. Never the sealed suite, never the
  truth suite.
- The sealed suite is known to be imperfect (the original pilot found it ties some truth-mixed
  specimens). That is fine and on purpose: a realistic, fallible sealed signal is exactly what a real
  0.8.0 loop would steer on. If the loop can convert a fallible sealed signal into truth-resolved
  wins that sampling cannot, that is the result; if it chases the sealed signal into truth-wrong
  code, that is also the result.

For hexcolor/ipv4, reuse their existing sealed + truth suites the same way.

## Conditions (per seed, fixed token budget B)

Task: implement `nextRun(expr, after)` from `CONTRACT-VAGUE.md`. Both conditions draw blind
candidates (contract only; never the sealed or truth suite). Both are scored by the truth suite.
Token spend is summed from `subagent_tokens` per agent.

- **best-of-N:** spend B generating N independent candidates. Select the one with the highest
  **sealed** pass-rate (ties broken by an explicit rule, recorded). No iteration, no critic. Score
  the selected impl on truth.
- **iterate:** spend B on a loop. Generate 1 candidate; run the SEALED suite; if it fails, a critic
  that sees ONLY {contract, candidate code, sealed-suite failure output} — never the truth suite, no
  operator pointed questions — writes a critique; a reviser revises; re-run sealed; repeat until the
  sealed suite passes or B is exhausted. Continue/stop is driven ONLY by the sealed signal. Score the
  final impl on truth.

Same B for both = the equal-budget arm. Run each at 1x, 2x, 4x B for the absolute curve. B is a token
ceiling enforced by summing `subagent_tokens`; a condition stops spawning once the next agent would
exceed B.

## Blindness (non-negotiable, audited)

- Specimens, reviser, and critic NEVER see the sealed suite source or the truth suite. Specimens see
  CONTRACT-VAGUE only; the critic additionally sees the candidate code and the sealed suite's pass/
  fail OUTPUT (not its source).
- Critic prompts carry NO operator diagnosis and NO leading questions — only the sealed failure
  output and the candidate code. (The specific fix for the scaled-run confound.)
- The loop's stop/continue decision reads the sealed suite ONLY, never the truth suite.

## Recall — removed by construction

The synthetic substrate is the point. `nextRun` on this vague contract, and this specific
sealed/truth split, are not in any training corpus. There is no canonical fix to retrieve, so the
asymmetric-retrieval confound that kills the SWE-Bench version does not exist here. Any win is
attributable to iteration-vs-sampling, not memorization.

## Metrics + pre-registered decision

Per condition: truth pass-rate of the scored impl (and resolved = truth pass-rate 1.0 if a binary is
wanted), total tokens, truth-per-token. 3 seeds minimum; report each seed, not just the mean
(seed-level is where tie-break luck hid before).

| outcome (equal budget) | reading | action |
|------------------------|---------|--------|
| iterate truth > best-of-N | the loop reaches correctness sampling does not, at the same cost | **0.8.0 warranted** — spec/build it |
| iterate ≈ best-of-N | more rounds add nothing sampling does not | **0.8.0 not warranted** — scale samples + sharpen selection |
| iterate < best-of-N | the loop chases a fallible sealed signal into truth-wrong code | 0.8.0 harmful as-designed; the sealed-signal quality is the real lever, not rounds |

Absolute arm refines: if iterate only wins at >1x budget, note the token premium (disclosed by design
per README §47-50) and whether truth-per-token still favors it.

## Discipline carried from every prior pilot

- Symmetric-error rule: a confounded result leaning pro-build is the same error as one leaning
  anti-build. If a confound survives, the run is SILENT, not supportive.
- No judge/critic "accuracy rate" claim.
- n=slice is directional; expand only on a clean signal.

## Execution order

1. Vertical slice on cron, 1 seed: best-of-N vs iterate at equal B, score both on truth. Confirm the
   harness drives the loop on the sealed signal and the truth scorer is never read inside the loop.
2. 3 seeds on cron; equal-budget table + absolute curve.
3. Replicate on hexcolor/ipv4 (existing sealed/truth suites) for breadth.
4. Apply the table. Only if a clean win shows here, demonstrate it on SWE-Bench (recall-contaminated,
   so demonstration only, never decision).
