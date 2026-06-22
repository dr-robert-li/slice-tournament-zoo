# Pre-Registration — Slugify Validation Pilot

**Frozen before any condition is run.** Changing anything below after the first run invalidates
the pilot. Suite changes are permitted only through a logged amendment (see *Amendments*).

## Question

Does selection pressure across N independent implementations of one contract (the STZ
tournament) produce better code than naive use of Claude Code — single-pass best-of-N, or
sequential critique-and-revise — at equal token budget?

## Conditions (all real Claude Code agents; see RUNBOOK.md)

- **A — STZ tournament:** N=4 specimens → sealed selection suite gate → judge pairwise votes
  + GRPO selection. The shipped product.
- **B — sequential critique-revise:** ONE agent, ≤4 revision rounds, each round sees its
  failures against the **public** suite only. = naive iterative Claude Code.
- **C — best-of-N:** winner = highest **sealed**-suite pass-rate over **A's own 4 specimens**
  (post-hoc selection on A's pool, NO judge). C reuses A's specimens rather than spawning fresh
  ones so that A−C is a clean *paired* ablation isolating exactly the judge's marginal value —
  not pool-variance — at zero extra agent cost. Tie-break: if ≥2 specimens tie at the top
  sealed rate, A decides by judge and C by specimen id-order. If **zero** specimens clear A's
  gate, A is DNF while C still ranks the best of the 4 (record both).

**Primary comparison (headline): A vs B** — tournament diversity vs sequential depth.
**Secondary (judge ablation): A vs C** — does the LLM judge beat best-of-N by test score?

## Suites & visibility (three distinct suites — frozen hashes below)

| Suite | Role | Visible to |
|-------|------|-----------|
| `suites/slugify.public.mjs` (PUBLIC, unsealed) | B's selection signal | all conditions; only B iterates on failures |
| `suites/slugify.sealed.mjs` (SEALED) | A & C selection signal | gate/judge only; specimens never see |
| `truth-suite/slugify.truth.mjs` (TRUTH, sealed) | final grading only | **no condition, ever** |

Public is deliberately **ASCII happy-path only**; Unicode folding lives in sealed + truth.
This asymmetry is intentional and pre-registered: B's hand-authored signal is weaker than the
sealed suite STZ's test-author writes, and the experiment measures whether that matters.

### Frozen SHA256 (first 12 hex; full manifests in each dir's `SEAL.json`)

```
e4cf25eb7187  suites/slugify.public.mjs
25621c44755a  suites/slugify.sealed.mjs
734682bc53d4  truth-suite/slugify.truth.mjs
34710f2412fd  truth-suite/reference/slugify.ref.mjs
```

`node seal.mjs verify suites` and `node seal.mjs verify truth-suite` MUST report no drift
before and after the pilot.

## Honesty gate (PASSED at freeze time)

Truth suite is a valid oracle: it **passes** the independent reference (124/124) and **fails**
all 5 naive/near-miss fixtures. The near-miss `nearmiss-ascii-only` **passes the public suite
(1.0) but fails truth (0.94)** — proving truth discriminates a winner the weak public signal
accepts. Matrix recorded in RUNBOOK.md.

### Oracle residual threats (the honesty gate does NOT close these)

The gate proves the truth suite is *satisfiable and discriminating* — not that it captures
"good slugify". The reference and the truth suite were authored in the same session (shared
blind spot). Accepted residual threats, logged so they're not mistaken for bugs:

1. **Deliberate non-standard contract.** The ASCII-slug contract intentionally diverges from
   popular libraries: `ß` is dropped (not transliterated to `ss`), zero-width and control
   chars are treated as separators (`"a​b" → "a-b"`, not stripped to `"ab"`), non-Latin
   scripts drop to `""`. These are *contract choices*, and a winner that mimics a memorized
   library will be graded as wrong here — which is intended (it separates recall from
   reasoning). Cross-checking one reputable npm `slugify` against the truth suite is expected
   to disagree on exactly these cases; that disagreement is informative, not a defect.
2. **Single-author oracle.** Mitigation is the independent reference + the fail-all-naive gate,
   not a second-family author. At pilot scale this is accepted; a scaled run should add a
   cross-family truth author.
3. **mutationSurvival is uninformative** for string code (see Metrics) — do not weight it.

## Parity rules

- **Information parity:** public suite readable by all; only B iterates on its failures. No
  condition ever sees the sealed or truth suite.
- **Token parity:** one fixed cap **`tokenCap = 200_000`** output tokens per task per
  condition (the complexity-2 budget from `src/budget.ts`). Cheaper conditions may spend slack
  on more iterations. **quality-per-token** (`truthPassRate / tokensSpent`) is reported as
  **rough/indicative only**, NOT a primary result: STZ's `CostTracker` ledger is populated by
  the *mock* orchestrator's synthetic per-call figures, and extracting real Task-subagent usage
  consistently across a multi-agent tournament (A) and a single agent (B) is not yet proven.
  Before spending the 9 runs, a condition-A dry run MUST confirm `tokensSpent` can be captured
  the same way for A and B (RUNBOOK §2 pre-flight). If it cannot, q/tok is dropped and only the
  primary metric — which needs no token count — is reported.
- **Seeds:** 3 (labelled 1,2,3). No bit-exact API seed; a "seed" is one independent run with a
  local-RNG label controlling specimen strategy assignment and judge pairing order.

## Metrics (graded on the truth suite only)

- **truthPassRate** — primary.
- **qualityPerToken** — headline efficiency (the fixed cap makes it meaningful: A's judge
  overhead shows up as lower q/tok).
- **mutationSurvival** — recorded but **caveated**: the production mutators target
  arithmetic/comparison code, so on a string function `mutants ≈ 0` and this signal is
  near-uninformative for slugify. Do not weight it.

## Hypotheses

- **H0:** A's truthPassRate and qualityPerToken ≤ the best of {B, C} within band **δ = 0.05**.
- **H1:** A > both B and C on truthPassRate AND A not worse than the best baseline on q/tok.

## Stopping / go-no-go criteria (pilot signal at n=3 — directional, not a verdict)

1. **Judge is theatre:** A ≈ C on truthPassRate within δ AND A not better on q/tok →
   recommend demoting the judge to best-of-N gating.
2. **Diversity doesn't beat depth:** A ≤ B on truthPassRate → no "STZ wins" claim; escalate to
   a multi-task battery before any external positioning.
3. **Underpowered:** between-seed spread ≫ between-condition gap → the scaled run needs more
   seeds; size it from the observed spread.

## Reporting

`results/runs.jsonl` — one row per run (9 rows: 3 conditions × 3 seeds). Report each metric as
3 seed points + mean + range; for A-vs-C report the **paired per-seed delta** (matched seed).
No significance claims at n=3.

## Amendments

No post-hoc truth-case additions. Any suite change is recorded by re-running `seal.mjs seal`
after editing, with the reason logged here:

| date | suite | reason |
|------|-------|--------|
| 2026-06-22 (pre-run) | truth-suite | Convert ZWSP/NUL/combining-mark literals to `String.fromCodePoint` for transport-robustness (no semantic change; reference still 124/124). New hash `734682bc53d4`. |
