# Separation-Gate Pre-Registration — Phase 1 Go/No-Go
## STZ 0.9.6 Contract Plane · the load-bearing safeguard

> Pre-registered per PHASED-PLAN §1 and Phase 1. The contract layer is built
> **only if** a naive-but-plausible implementation passes the functional sealed
> suite yet fails ≥1 typed contract predicate. No separation ⇒ the contract adds
> no selection signal beyond the suite ⇒ **freeze at Phase 0, report the negative**
> (docs/PAPER.md symmetric-error rule). This is the cheapest insurance against
> reproducing STZ's earned negative at 10× cost.

### Hypothesis (registered BEFORE running)

> On the IPv4-strict-validation substrate, a shape-only regex validator will pass
> a good-faith functional sealed suite of common cases at passRate 1.000, but a
> typed **boundary-condition** predicate (octet ∈ 0..255, no leading zeros) will
> catch it — demonstrating the contract carries a signal the suite does not.

**Prediction:** `separated = true`, with ≥1 high-severity failing predicate.
**Falsifier:** if the naive impl passes every predicate, OR fails the suite,
`separated = false` and the contract line stops here.

### Substrate (self-contained, under `separation-gate/`)

| File | Role |
|---|---|
| `naive-ipv4.mjs` | shape-only regex validator `/^\d{1,3}(\.\d{1,3}){3}$/` |
| `sealed-suite.mjs` | 11 common-case functional tests (valid addresses + obvious garbage) |
| `predicates.json` | 1 accepted requirement + 4 accepted predicates (typed, symbol-anchored) |
| `run.mjs` | executes the impl to PRODUCE observations, runs the suite, applies the separation rule |
| `result.json` | machine output of the run |

Decision logic is identical to the canonical, unit-tested TS core
(`src/contract/predicate-eval.ts` + `src/contract/separation-gate.ts`);
`run.mjs` is the IO shell that runs that core against a real impl.

### Result — SEPARATED **against the suite as written** (mechanism existence proof)

Command: `node experiments/0.9.6-evolution/separation-gate/run.mjs` → exit 0.

| Signal | Value |
|---|---|
| Sealed-suite passRate (naive impl) | **1.000** (11/11) — this suite does not catch the defect |
| Predicates failed | **3 of 4** — `octet-range` (high), `reject-256` (high), `no-leading-zero` (medium) |
| Predicate passed | `accept-canonical` (low) — guards against a vacuous all-reject impl |
| Technical verdict | **SEPARATED** (suite passed ∧ ≥1 predicate failed) |

### ⚠️ Honesty caveat — this is NOT yet a good-faith-suite separation

The suite and the predicates here were authored by the **same** hand, and the
suite omits exactly the cases the predicates catch. For IPv4 specifically,
octet-range rejection (`256`, `999.1.1.1`) is a **canonical** negative test — a
good-faith test author (STZ's own `stz-test-author` included) would write it.
So `sealed-suite.mjs` is a *deliberately weak* suite, not a realistic one.

Therefore this experiment proves the narrower, still-useful claim:

> **The predicate type-system can *express* a correctness condition as a typed,
> machine-checkable, symbol-anchored artifact, and the separation-gate machinery
> correctly detects when a suite misses it.**

It does **not** prove the stronger claim that a *realistic, good-faith* functional
suite misses boundary conditions on this substrate. On IPv4 it would not. The
verdict word is "separated-against-this-suite," not "EARNED against a real suite."

### What is actually earned vs. deferred

- **Earned (mechanism):** the Phase 1 contract kernel (`src/contract/*`) and
  Phase 0 measurement infra (`src/eval/*`) — the type-system, the pure evaluator,
  the human 7th gate, and a runnable, falsifiable separation gate. These are built
  and tested.
- **NOT earned here:** that accepted predicates *change tournament selection on
  held-out repo work vs. a good-faith suite* — the real funded hypothesis. That is
  **Phase 3's** own go/no-go and requires (a) a substrate where the boundary is
  genuinely non-obvious to a competent test author, and (b) the arena wiring +
  held-out issue stream. Phase 3 must re-demonstrate the signal moves *outcomes*,
  measured against a suite STZ's `stz-test-author` actually produced — not one
  hand-weakened to guarantee the result.

### Symmetric-error note

Reported as a **partial/qualified** result, not a clean win — the same discipline
(obs 3973–3974: honest limitations over manufactured positives) that would report
a null loudly requires flagging a *rigged* positive just as loudly. The gate can
fail (`separated:false` on an all-pass contract → exit 1, freeze), which is why the
machinery is worth keeping; but a weak-suite pass is not evidence a strong suite
would pass, and this document must not let the exit-0 read as more than it is.
