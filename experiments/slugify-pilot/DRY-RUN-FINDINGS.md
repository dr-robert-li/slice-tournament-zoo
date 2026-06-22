# Condition-A Dry Run — Findings (2026-06-22)

One real tournament + one naive-B probe, seed 1. Purpose: de-risk before the 9-run pilot.

## Results

| | public | sealed (gate) | truth (oracle) | tokens |
|--|--------|---------------|----------------|--------|
| A specimen-a (regex pipeline) | 1.00 | **1.00 PASS** | **1.000** | 14070 |
| A specimen-b (state machine) | 1.00 | **1.00 PASS** | **1.000** | 13822 |
| A specimen-c (split/join) | 1.00 | **1.00 PASS** | **1.000** | 13844 |
| A specimen-d (codepoint fn) | 1.00 | **1.00 PASS** | **1.000** | 15182 |
| B naive (single agent, ≤4 rounds, public signal only) | 1.00 | 1.00 | **1.000** | 35061 |

Specimen gate-pass: **4/4**. Pool token cost (A): ~56.9k across 4 agents; B: ~35k. Both far
under the 200k cap. Judge not run — pointless when all specimens are identical-quality.

## Two things resolved

1. **Token capture WORKS.** The Agent tool returns `subagent_tokens` per agent — so
   `tokensSpent` is directly obtainable for both the multi-agent tournament (sum) and the
   single B agent, by the same method. The advisor's #2 risk (mock-synthetic ledger) is moot:
   we read real usage off the agent results, not STZ's CostTracker. **Quality-per-token can be
   reported after all.**

2. **The experiment, as designed on this task, cannot discriminate.** A, B, and C all score
   truth = 1.000. No variance → H0 cannot be rejected → the pilot would measure nothing.

## Root cause (the important finding)

`CONTRACT.md` **fully specifies every edge case** (decomposed Unicode, emoji, idempotence,
ß-dropped, empty). Any competent frontier agent — adversarial specimen *or* naive single-shot —
that reads it produces a complete, correct implementation. When the spec leaves nothing to
chance and the implementer is over-powered for the task, there is no gap for tournament
diversity or critique-depth to close.

**General lesson for the whole validation effort:** STZ's value is, by construction, only
*measurable* on tasks at the edge of the implementer's competence — i.e. where a single
frontier attempt does NOT already saturate the oracle. A fully-specified, moderate task run by
Opus is the wrong instrument. This is exactly the ceiling/floor risk the design council flagged.

## Levers to create discrimination (pick before the 9-run pilot)

1. **Under-specify the contract.** Hand specimens a realistic vague prompt ("a URL slugifier")
   instead of the normative algorithm. Different specimens then make different reasonable
   choices, and the sealed suite + judge discriminate — testing STZ where it should matter
   (ambiguity resolution). The truth suite stays as the fixed oracle.
2. **Harder task.** cron-next-occurrence, semver-range-satisfies, a recursive-descent parser —
   genuinely hard enough that one-shot misses edge cases even with a full spec.
3. **Weaker implementer model (e.g. Haiku).** Make the task hard *relative to the implementer*.
   Directly tests the most honest question: "does the harness lift a weaker model?" Cheap —
   re-run the same rig with `model: haiku`.
4. **Coding-to-tests gap for B.** Strip the edge-case prose from the contract AND give B only
   the ASCII public suite, so a naive "make my tests pass" diverges from truth — while A's
   sealed gate still forces full correctness.

Levers 1 and 3 are the cheapest and most informative; they can compose (vague spec + Haiku).
The truth suite, sealer, grader, and parity discipline all remain valid and reusable — only the
task framing / implementer tier needs to change.

## Update: Haiku run (lever 3 alone) — STILL saturates

Re-ran the full rig with **Haiku** implementers (4 specimens + naive B), same full contract:

| | sealed (gate) | truth | tokens |
|--|--------------|-------|--------|
| Haiku A specimen-a/b/c/d | 1.00 PASS (4/4) | **1.000** all | 14369/18511/14001/15322 |
| Haiku B (naive) | 1.00 | **1.000** | 24518 |

**Lever 3 (weaker model) alone does NOT create variance here.** The dominant variable is the
*contract's completeness*, not the implementer's strength: when `CONTRACT.md` enumerates every
edge case (NFKD, combining marks, idempotence, ß-dropped, zero-width-as-separator), even Haiku
reads it and one-shots a perfect impl. The literature that harness gains peak on weak models
assumes the task is *hard relative to the implementer* — a fully-handed-over spec makes slugify
easy for Haiku too. **Necessary fix: under-specify the spec (lever 1) AND keep the weak model
(lever 3)** — the composed lever. The brief must still pin the *output behavior* the truth suite
checks (so the oracle stays fair) while removing the *how-to* (NFKD/combining-mark recipe,
idempotence callout, decomposed-form mention, the worked-examples table) so the implementer must
*discover* the edge surface — which is exactly where weak models diverge and the tournament can
discriminate. See `slice/CONTRACT-VAGUE.md`.

## Update 2: vague spec + Haiku (composed lever) — variance ACHIEVED, two new findings

Re-ran 4 Haiku specimens + naive B against the **vague** brief (`CONTRACT-VAGUE.md`), graded on
the unchanged sealed + truth suites:

| | public | sealed (gate) | truth | tokens |
|--|--------|---------------|-------|--------|
| specimen-a (regex, NFD) | 1.00 | 1.00 PASS | **0.976** | 12235 |
| specimen-b (state machine, NFD) | 1.00 | 1.00 PASS | **0.960** | 16391 |
| specimen-c (split/join, NFD) | 1.00 | 1.00 PASS | **0.976** | 12684 |
| specimen-d (codepoint, NFD) | 1.00 | 1.00 PASS | **0.976** | 13262 |
| naive B (public-only) | 1.00 | 1.00 | **0.976** | 23872 |

The discriminator: the vague brief said "café → cafe" but never said *NFKD*, so Haiku reached
for **NFD** — which folds accents but misses compatibility decomposition (`ﬁ→fi`, `Ⅻ→xii`,
`①②③→123`). Those cases now fail truth. Real variance (0.960–0.976), at last.

### Finding A — the sealed suite is too weak to *select* on the variance

All four specimens still pass the **sealed gate at 1.00** — because the sealed suite, like the
public one, doesn't test compatibility folds. So the truth differences are invisible to both the
gate AND the judge (the judge also only sees the sealed suite). Selection is blind to exactly the
quality that separates the winners. **Consequence: A and C both pick a sealed=1.0 specimen whose
truth score is essentially a coin-flip in {0.960, 0.976}; expected A ≈ C ≈ B.** No condition wins.

**This is the core mechanism, now explicit:** STZ can only beat naive iteration when its
**sealed suite (written by `stz-test-author`) is a materially stronger proxy for truth than the
weak tests a naive user writes (condition B's public suite).** The tournament/judge are
downstream of that; if the selection signal can't see the quality gap, no amount of diversity or
judging recovers it. The experiment's real independent variable is **sealed-rigor vs
public-rigor**, not "tournament vs iteration" in the abstract.

### Finding B — effect size is currently too small for an n=3 pilot

Even with variance, the spread is 1–3 truth cases out of 124 (≈0.016). Three seeds of that will
be swamped by run-to-run noise. A convincing pilot needs the conditions to spread more like
0.7–1.0, which means a bigger competence gap: a genuinely harder task, a vaguer spec, or pairing
the strong sealed suite (Finding A) against B's weak public suite so B *systematically* ships
truth-failing code while A's gate forces correctness.

### LEAKAGE WARNING (do not do the obvious thing)

The tempting next step — "strengthen the sealed suite to cover compatibility folds / decomposed
equivalence" — is **train-on-test leakage**. We learned those discriminating cases *by grading on
truth*. Copying them into the selection suite means the experimenter used the held-out oracle to
design the selector; after that A>B is guaranteed and meaningless (select on a near-copy of truth,
grade on truth). This is the exact firewall the three-suite design exists to protect.

The discriminator is **procedural, not content**: any sealed-suite improvement must be authored by
an agent **blind to the truth suite**, and truth must still hold out cases sealed does not contain.
Nuance: *properties* (idempotence, charset-invariant) may legitimately appear in both suites — they
generalize, so co-occurrence isn't leakage. *Specific enumerated inputs copied from observed truth
failures* is leakage.

### The honest redesign

1. **Keep the mechanism, fix the operationalization.** STZ's real claim is "a rigorous **blind**
   sealed suite generalizes to truth better than a naive user's self-tests." Regenerate the sealed
   suite via `stz-test-author` **without ever showing it the truth suite**, then re-verify the gap
   (truth still has discriminating cases the new sealed lacks). If closing the gap makes A win and
   keeping it open makes A≈B, the honest answer is **A≈B**.
2. **Buy effect size with a HARDER TASK, not by tuning sealed to truth.** A genuinely harder task
   grows the truth spread honestly. This is why "harder task" beats "strengthen sealed."
3. **Judge-ablation has a structural ceiling.** The judge is grounded in the sealed suite (+ what
   it reads in the code). If two specimens pass sealed identically and differ only on cases sealed
   doesn't contain, the judge has no principled basis to prefer the truth-better one. So **A≈C here
   is largely structural, NOT evidence the judge is theatre** — report it as such. A-vs-C is only
   informative if the judge has truth-relevant signal beyond sealed pass-rate (e.g. reads the code,
   notices NFD≠NFKD).
4. **A≤B is a legitimate, reportable, interesting outcome.** The pre-registration already lists it.
   The dry run is honestly pointing at: *when the hidden suite isn't a better truth-proxy than
   careful self-tests, the tournament doesn't beat naive iteration.* Do not engineer the task until
   A wins.

The instrument (suites, sealer, grader, parity, token capture) is fully validated. The remaining
fork is a real choice — see the decision put to the user — between (a) harder task + blind-authored
sealed, measured honestly, and (b) accepting the small-effect / null result and reporting it.

## Update 3: blind-authored sealed suite (`suites-v2/`) — the honest answer

`stz-test-author` wrote a new sealed suite (1518 checks) **blind to the truth suite**, from the
vague contract only. It was rigorous *and* principled: it explicitly recognized **NFD-vs-NFKD as a
contestable axis** under the vague spec and used **invariant-only** checks (charset, idempotence,
NFC/NFD agreement) there so both defensible folding branches pass — it refused to pin `ﬁ→fi`.

Scored the existing vague-Haiku pool + B on it (no new agents — reused artifacts):

| impl | blind-sealed | truth |
|------|--------------|-------|
| specimen-a | 1.000 | 0.976 |
| specimen-b | **0.754** | **0.960** |
| specimen-c | 1.000 | 0.976 |
| specimen-d | 1.000 | 0.976 |
| B (naive) | 1.000 | 0.976 |

### What this shows (the honest result for slugify)

1. **The mechanism works directionally.** The blind sealed suite correctly identified the single
   genuinely-worse specimen — `specimen-b`, lowest on *both* blind-sealed (0.754) and truth
   (0.960). STZ would cull it. So when a specimen is actually wrong, a blind rigorous suite catches
   it without ever seeing truth. ✔
2. **But STZ ≈ B on this task.** A/C select a survivor among {a,c,d}, all truth=0.976 — the same as
   B's 0.976. No win. The only residual truth gap (0.976 vs 1.0) is the **NFKD compatibility-fold
   convention**, which the blind author *correctly declined to enforce* because the vague contract
   doesn't fix it. Neither STZ nor B can (or should) select for an arbitrary convention.
3. **Oracle caveat, confirmed.** The truth suite's `0.976` penalty is largely the truth author
   (me) having baked NFKD into the contract while the blind test-author judged it optional. That is
   a *convention* difference, not a *correctness* difference — exactly the oracle-bias threat flagged
   at design time. The genuine-correctness signal (specimen-b) is real; the 0.024 residual is mostly
   convention noise.

### Conclusion

On `slugify` + Haiku, **the tournament does not beat naive iteration** — for a principled reason:
the task produces mostly-correct implementations whose differences are convention-level, and a
*blind* (non-leaking) sealed suite rightly won't enforce conventions. STZ's value appears only when
implementers produce genuinely-wrong code AND a blind suite can catch the wrongness — visible here
in miniature (specimen-b culled), but too rare on this task to move the aggregate.

**To see STZ win honestly, the next step is a harder task** where weak implementers produce real
bugs (not convention divergence) at higher frequency — e.g. cron-next-occurrence, semver-range, a
parser. The instrument and the blind-authoring protocol are ready to drop that task in. This is the
same conclusion the literature implies (harness gains peak when the task is hard *relative to the
implementer* and "wrong" is unambiguous), now grounded in this project's own data.
