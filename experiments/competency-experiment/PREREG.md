# PRE-REGISTRATION — earning (or ruling out) the competency positive

Two arms, pre-registered before build. The headline is **A** (the real competency test);
**B** is the mechanism-generalization positive, kept surgically separate. Committed before
any specimen is selected or any genome evolved.

## 0. The rule that makes this non-circular

From the prior line: *the gene you evolve must be able to move the metric you score, and
the metric must be independent of what the gene targets.*
- A **suite-battery** gene moves only the axis it sharpens → scoring it on independent
  truth is null-by-construction; scoring it on its own axis is circular. (This is why the
  cross-slice conformance metric was refused.)
- A **selection** gene (weights / rubric / fanout) *can* move independent functional truth
  — only if a computable proxy correlates with the hidden truth. That is the open question.

---

## ARM A — selection-gene, train/test (the competency test)

**Hypothesis.** Evolving the harness's **selection** genome makes the per-slice tournament
ship a **higher-truth winner** on slices the evolution never saw — improvement on quality
nobody hand-encoded.

**Genes evolved (selection-side ONLY, never the battery):** the reward weights
`{pass, coverage, kill, codeHealth, clean}` (mirrors `selection.ts REWARD_WEIGHTS`),
optionally `fanout`/`votesPerPair`. The winner of a slice = argmax over specimens of the
weighted sum of **computable proxies** (sealed passRate, mutation-kill, code-health, …);
**truth is never a proxy** — it is held out for fitness and the test metric only.

**Slices (parsers with blind specimen pools already in `experiments/`):** cron, ipv4,
hexcolor. **TRAIN = {cron, ipv4}; TEST = {hexcolor}** (disjoint). The TEST slice is the
independent oracle: the evolved genome never saw it.

**Protocol.**
1. Evolve the weight genome on TRAIN: fitness = mean **held-out truth** of the
   tournament's selected winner across TRAIN slices (fixed pools).
2. **Freeze** the winning genome.
3. Measure **TEST-slice shipped-winner truth**: evolved genome vs `baseline-v0`.

**Decision rule.** Earned iff evolved-genome TEST shipped-winner truth **>** baseline,
with the winner **re-ranked within the fixed pool** (not a pool change). Pre-register the
null below as a fully expected outcome.

**Pre-stated NULL risk — proxy exhaustion (likely).** If the only informative proxy is
sealed passRate and it is already at ceiling and/or **anti-correlated** with the residual
truth gap, no reweighting can beat baseline → null. Direct evidence: cron's truth-best
specimen c5 has *lower* sealed pass (0.9992 vs 1.0) and accepts malformed — so on cron the
proxies point *away* from the truth-best specimen, and no weight tuple ships it. If TRAIN
shows the same, A is **null by proxy-exhaustion**, reported as: "the baseline selection
signal is already at the proxy frontier; evolving weights cannot ship higher-truth winners
because the available proxies do not contain the residual truth signal." That is a real,
definitive result about the ceiling of selection-based self-improvement.

**Confound control (heterogeneous pools).** If pools mix model strengths, malformed/quality
correlates with the stronger model, which also wins functional truth → "Sonnet beats
Haiku," not "sharper harness selects better." Control: **hold each slice's pool fixed across
genomes**; the only thing that counts is the evolved genome re-ranking *within* that fixed
pool to a functionally-better specimen the baseline weights ranked lower.

**What A is NOT:** not battery/suite evolution; not measured on the sharpened axis; not a
pool change.

---

## ARM B — amortization (mechanism-generalization, NOT competency)

**Claim (honestly labeled).** One `harness-mine` discovery of the malformed-token class,
baked once, **propagates** across a family of parsers that each carry a contract-mandated
"throw on malformed" clause (verified present in cron, ipv4, hexcolor) → family-wide
conformance on **that recurring class** rises.

**This is the MECHANISM positive at family scale — NOT "the harness ships better code."**
The metric (malformed-class conformance) moves on the axis the mechanism acts on; that is
expected and is exactly why it is labeled amortization/generalization, not competency. It
quantifies the judge-arm's asserted-but-unmeasured "authoring value is one-time."

**Protocol.** Baseline harness (permissive functional suites, per slice) vs sharper harness
(battery baked after one cron `harness-mine` discovery). Per slice, fixed blind pool, select
winner under each; score winner's **malformed-class conformance** on held-out malformed
inputs disjoint from every sealed suite. Aggregate across the family.

**Decision rule.** Report the family-wide conformance delta. Expected positive; reported as
mechanism-generalization with the explicit caveat that functional truth is unaffected
(per Arm-A / the cron capstone).

---

## Discipline (carried)
Refused: circular axis==metric scoring, constructed pools, vague-contract-to-induce-errors,
axis-weighting, pool-shopping, strawman baselines (Arm-A baseline = the real shipping
weights; per-slice separation gates confirm good-faith blindness). Train/test split is the
non-circularity guarantee for A. N6: fixed pools + seeds + stored artifacts. Symmetric-error
null held under the goal-reset + Stop hook: A's null and B's narrow-positive are both
reported as-is; no positive is staged to clear the hook.
