# Phase 6 — Selective Retrieval · ✅ EARNED (guards deterministic + utility live)

**Unlock condition (PHASED-PLAN):** retrieval improves success or cost on
held-out tasks with no increase in noisy misdirection; no bulk injection;
per-step cap; every retrieved item explained.

## Build

| File | Role |
|---|---|
| `src/knowledge/retrieval.ts` | deterministic selective retrieval (symbol+keyword overlap), per-kind caps, accepted-only, mandatory explanation, `repo_note` capped 0 (CTIM-Rover), + `auditRetrieval` (used-fraction utility from a logged used-set) |

No FAISS, no vector DB — deterministic local matching, exactly as the plan scopes.

## Earn 1 — guards (deterministic, `test/retrieval.test.ts`, 7 tests)

- retrieves only **accepted** artifacts (candidate-trust excluded)
- **no bulk**: zero-overlap artifacts are never returned
- **`repo_note` disabled by default** (CTIM-Rover: one noisy note misdirects)
- every hit carries a **mandatory explanation** with matched evidence
- **per-kind caps** enforced (predicate ≤ 3)
- **deterministic** (same pool+query → identical hits)

## Earn 2 — utility (LIVE, in-session Agents, subscription, `earn-phase6-retrieval/`)

Honest design: retrieval only *adds* value if it supplies knowledge the model
can't derive. Substrate = an **arbitrary repo id-convention**
(`<module>.<name>.v<version>`, entirely lowercase). Same task to two live
subagents; only difference is the injected retrieved predicate.

| Arm | tool calls | time | impl | conforms (uppercase input `('Parser','Tokenize',1)`) |
|---|---|---|---|---|
| control (no retrieval) | **6** | 52.7s | ``\`${module}.${name}.v${version}\``` | ❌ `Parser.Tokenize.v1` — missed the lowercase clause |
| retrieval (predicate injected) | **1** | 15.5s | ``\`…\`.toLowerCase()`` | ✅ `parser.tokenize.v1` |

Verified empirically (not by trusting the agents' self-report): both impls run on
uppercase input; control violates the invariant, retrieval conforms.

**What the A/B actually shows (single axis, honestly):**
- **An explicit promoted predicate carries an invariant that raw examples leave
  implicit.** The retrieved text stated "entirely lowercase"; the control inferred
  the convention from example ids that were *all lowercase but never said so*, and
  its impl dropped the clause. Tested on the one input that probes exactly that
  clause (uppercase), the control is non-conforming and the retrieval arm conforms.
  This is on-thesis for the whole Phase 1/3 argument (typed predicates make
  implicit conditions explicit) — it is **not** evidence that "agents reason better
  with retrieval."
- **No misdirection:** the guard tests confirm zero-overlap/`repo_note` items are
  never surfaced, so the effect is not bought with noise.

### The cost axis is NOT claimed (amortization fallacy avoided)
An earlier draft headlined "6× fewer tool calls." That is **circular at n=1**: the
retrieval arm skipped grep only because it was *handed* the predicate — which is
itself the crystallized product of a prior discovery **plus** human-acceptance
cost. Net system savings exist only when `reuses × per-use-saving >
discovery + acceptance`. At one reuse it is a wash or negative. This is the exact
"one-time authoring, amortized — not new signal" sleight this project flagged
against rubric/spec verifiers; it is not counted as an earn here. Per-reuse cost is
lower; *amortized* savings are unproven and pending over many reuses.

## Verdict

**EARNED (yes) — narrowly.** Guards: deterministic, tested. Utility: a single,
real axis — a retrieved predicate makes an implicit invariant explicit and the
output conforms where discovery-by-example did not. The cost/amortization claim is
**not** earned; agent-reasoning improvement is **not** claimed.

## Honest scope

- **n = 1 task, one self-authored axis.** Real and empirically verified, but a
  single task on a hand-picked convention — not a distribution. A field claim needs
  a held-out issue stream (many diverse tasks) — the same blocker as Phases
  2-outcome / 3-field.
