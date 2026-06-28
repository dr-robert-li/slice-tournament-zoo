# Does the meta-improving harness improve competency? — the definitive finding

**Question.** STZ's 0.9.0 harness-level meta-loop self-improves its genome — most
importantly via *automated suite sharpening* (discover a blind-spot bug class, bake it
into the test-author battery). The hypothesis: **does this make the harness ship more
competent code** — measurably better on a held-out truth oracle the selection suite never
sees?

**Answer, plainly.** With a **homogeneous pool of capable blind implementers**, the broad
competency positive is **not obtainable**, and the reason is **structural, not bad luck**.
Six fresh arms across five substrates converge on it. Separately, the **sharpening
mechanism itself works** — that is a real but narrower positive, and it must not be dressed
up as the competency claim.

---

## The six arms

| arm | substrate | non-enum? | recall | pool outcome | why no competency gain |
|---|---|:---:|---|---|---|
| 1 | streamStats (variance) | yes | in-recall | 15/15 correct (Welford) | uniform — no split |
| 2 | shuffle | yes (statistical) | in-recall | 5/5 correct (Fisher–Yates) | uniform — no split |
| 3 | weightedSample | yes (distributional) | **out-of-recall** | 8/8 correct (mixed algos) | uniform — reasoned correct from precise spec |
| 4 | expr-eval | yes (infinite space) | frontier | 5/5 **same** bug (unary-`**`) | **correlated** errors — split is zero |
| 5 | cron `5abc` (capstone) | — | — | natural split (c6 vs 7) | split ∧ suite-invisible but **not substantial** (truth_full flat) |
| — | (judge-arm, prior) | — | — | — | `5abc` suite-expressible, B==C on truth |

Arms 1–4: blind separation gates prove each *suite* discriminates correct from buggy; the
nulls are about *implementers not splitting*. Arm 5: the one real split, run through the
full automated mechanism.

## The structural regularity (the definitive negative)

A suite-sharpening competency gain requires an axis that is, at once:
**(A) substantial** (moves held-out truth), **(B) split** across the blind pool
(uncorrelated errors — some specimens right, some wrong), and **(C) invisible** to a
good-faith functional selection suite. **These three are mutually exclusive in practice**,
for three independent reasons:

1. **Substantial ⟹ core-task ⟹ uniform (¬B).** Large-truth errors come from
   misunderstanding the core task; a capable model gets the core or doesn't, as one
   decision — so the pool doesn't split (arms 1–4; arm 4 makes it vivid: 5/5 share the
   *exact same* unary-`**` error).
2. **Split ⟹ a ~coin-flip edge ⟹ rare input ⟹ small truth weight (¬A).** A genuine
   per-specimen coin-flip is, by definition, a peripheral edge case, so it carries little
   weight in held-out truth (cron `5abc`: 1 case in ~1248; truth_full flat).
3. **Suite-invisible-to-a-good-faith-functional-suite ⟹ not exercised by normal inputs ⟹
   edge ⟹ small (¬A).** The very property that lets sharpening *add* value (the good-faith
   suite missed it) forces the axis to be peripheral.

So the cell the hypothesis needs — substantial ∧ split ∧ suite-invisible — is empty for a
homogeneous capable pool. This is stated as a **six-arm empirical regularity with a
structural rationale**, not a proven theorem.

## The mechanism positive (kept surgically separate)

On cron, `harness-mine` twice-verified a genuine blind spot (`malformed-trailing-token`:
accepting `5abc` as `5`) — it **survives** the permissive sealed suite (real gap) and is
**killed** by the sharpened suite — and `harness-promote-mutator` baked it into the
battery. The flagship automated suite-sharpening **runs end to end and works**
(`cron-capstone/`). That is a true statement about the *mechanism*: the harness can
discover and bake in a real blind spot.

(Honest seam: `harness-mine`'s two-sided verification and the battery bake are automated;
turning the promoted class into the concrete must-throw cases is the test-author step the
battery normally drives an agent to do — here hand-authored. "Mechanism works" rests on
the automated verify+bake.)

It is **not** the competency claim. The sharper genome *did* deterministically ship the
**spec-correct** winner (c6 — rejects `5abc`) where the incumbent picks c1/c6 on a coin
flip: a real contract-conformance change. But on the held-out functional oracle
`truth_full` — independent of the sharpened axis — the selected winner is **identical** to
the incumbent's (0.9767), so `harness-select`/`harness-promote` **correctly decline**. The
precise statement is *no measurable broad-competency gain on an oracle independent of the
sharpened axis* — not "sharpening did nothing." Mechanism-works ≠ competency-improves.

## The open cell (honest, not a quick win)

The one untested cell is a **heterogeneous, frontier-vs-frontier** pool — STZ's designed
mode (F6/R5). Heterogeneity can break the error-correlation of leg 1 and produce a split.
But it does **not** escape legs 2–3: a suite-*invisible* axis is still small, and a
*substantial* axis is usually suite-*visible* (a good-faith functional suite already
selects on it, so sharpening adds nothing). So it is a genuine open question, plausibly
still negative, and a materially larger/more-expensive experiment — **the user's call**,
not something to stage now.

## Discipline (what was refused)

Constructed pools, vague-contract-to-induce-errors, axis-weighting to manufacture a gap,
pool-shopping, and re-reporting the suite-expressible `5abc` as a competency win — all
refused. The symmetric-error rule was held under two goal-resets and a Stop hook: a
positive staged to satisfy a hook is the same integrity failure as a null one refuses to
let stand.

## Bottom line

- **Competency hypothesis (broad, homogeneous capable pool): NOT earned — and structurally
  not obtainable.** Definitively characterized, with the precondition.
- **Sharpening mechanism: WORKS** (auto-discovers and bakes a real blind spot; gate
  correctly declines when the axis is truth-decoupled).
- **Heterogeneous frontier pool: open**, plausibly still negative, the user's call.

Detail: `{streamstats,wsample,expr,cron-capstone}-pilot*/PREREG.md` + `PILOT-RESULTS.md`,
`shuffle-pilot/`, `results/*.json`. Narrative: `docs/JOURNAL.md` last two entries.

---

## Update — the competency line is closed (see docs/PAPER.md)

This summary predates three later arms that finish the question of whether the
meta-improving harness ships more correct code:

- **Numeric selection-gene** (`competency-experiment/`): evolving the reward weights cannot
  ship the truth-best specimen. Every numeric proxy (pass, coverage, mutation-kill) is
  derived from the sealed suite, and the residual held-out truth lives outside it. Null,
  with a structural reason.
- **Judge selection** (`judge-selection/`): the judge is the only selection signal not
  derived from the sealed suite. On the homogeneous cron pool it shipped a worse winner than
  numeric selection. It is noisy and not reliably truth-tracking.
- **Heterogeneous pool** (`judge-selection/HETERO-RESULTS.md`): mixing Haiku, Sonnet, and
  Opus produced an apparent +0.0214 lift, confounded by model strength and reversing on the
  homogeneous contrast. Not a competency lift attributable to the harness.

Full write-up, related work, discussion, and open questions: **`docs/PAPER.md`**.
