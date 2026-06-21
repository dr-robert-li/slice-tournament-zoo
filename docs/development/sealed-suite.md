# Sealed held-out suite: the integrity contract

The held-out suite (L1/F10) is the grader specimens compete against, frozen
before the tournament so it cannot be tuned to favour one. Keeping it both
*correct* and *frozen* is split across two kinds of control, on purpose. The
distinction is the harness-engineering one between **guides** and **sensors**:

- a **guide** prevents a conceptual blind spot *up front* (authoring guidance);
- a **sensor** catches only what is *mechanically observable afterward*.

Conflating them is how the fragile-invariant bug shipped: a sensor was expected
to catch a class only a guide can prevent.

## The contract

**Prompt hardening (a GUIDE) owns semantic robustness.** The `stz-test-author`
agent prompt forbids identity on mutable state (the `(row,col)`-of-a-thing-that-
moves trap), requires movement-invariant predicates (counts, totals, sums over
per-element position snapshots), and requires each done-predicate to be encoded
as an invariant rather than a brittle snapshot diff. This is the *only* control
for the fragile-invariant class — see below for why.

**The smoke gate (a SENSOR) owns mechanical validity only.** Before sealing, the
orchestrator compiles the suite and runs it against the test-author's reference
implementation in a throwaway scratch dir. A green gate means exactly:

> compiles, and is satisfiable against the sealed reference.

It does **not** mean the suite is semantically robust. The reference is authored
by the same agent under the same assumptions, so if the author keys identity on
mutable position, the reference may move things the same wrong way, the suite
goes green, and the bug still ships. The sensor is blind to its author's blind
spot — which is precisely why the guide, not the gate, owns that class.

**The reference implementation stays sealed.** It is a *full, correct solution*
to the contract. It lives under `.stz/30-tests/held-out/reference/`, is sealed
with the suite, and is never placed on any specimen-visible path. The gate
materializes it only into a temporary scratch workspace and discards it. Leaking
it would hand specimens the answer — a worse hole than the one the gate closes.

## The four phases

1. **Author** — `stz-test-author` writes the sealed suite under the hardened
   authoring guidance, plus the reference implementation.
2. **Gate** — the orchestrator copies suite + reference into a scratch dir and
   runs compile-only first (`cargo test --no-run`, `tsc --noEmit`, …) then a
   satisfiability run. Passing means "compiles + satisfiable", nothing more.
3. **Seal** — `stz bridge seal` records a sha256 of every held-out file into a
   byte-stable, timestamp-free `SEAL.json`, then the suite is frozen. The
   orchestrator runs `stz bridge seal-verify` immediately before the eval/gate;
   it exits non-zero on any drift, so an edit between sealing and judging can't
   slip through.
4. **Amend** — if a defect is found later, never patch the canonical sealed file
   in place: `stz bridge seal-amend --reason "<why>"` records the per-file
   from→to hashes + reason into the manifest and re-freezes. A silent edit then
   fails `seal-verify`.

## Cross-family reference: an independent guide against shared blind spots

The guide above (the `stz-test-author` hard rules) is the *only* control for the
fragile-invariant class — but it has a structural limit: a single author cannot
guide themselves out of a blind spot they don't know they have. The smoke gate
can't help, because its reference shares that blind spot. So one control class
remains uncovered: a wrong assumption baked into *both* the suite and its
reference.

The **cross-family reference** (0.5.0) closes it. A second reference is authored
**independently** — a different model family (or a human), seeing only the
contract and done-predicates, never the suite or the primary reference — by the
`stz-cross-reference` agent. It is a full, correct solution, lives under
`.stz/30-tests/held-out/reference-b/`, and is sealed with the suite (never
specimen-visible). Before sealing, `stz bridge seal-crosscheck` runs the suite
against both references:

- **both-pass** — two independent implementations satisfy the suite. A blind spot
  shared by author and suite would have made one of them fail, so passing both is
  positive evidence the suite isn't over-fit to one author's assumptions. Seal.
- **divergent** (exactly one passes) — the suite encodes an assumption one author
  didn't share. The command exits non-zero to PAUSE the pipeline, exactly like
  `seal-verify`.
- **both-fail** — the suite is unsatisfiable as written; that's a gate/sensor
  failure (loop the stderr back to the author), not a cross-family signal.

**Divergence is a signal, not a verdict.** A B-fails-A-passes split is ambiguous
by construction: either the suite over-fits A (the blind spot you want to catch)
or reference B is simply wrong — and aggregate pass counts cannot distinguish
them. So the cross-check is itself a **guide-class control**: it surfaces the
divergence for *human adjudication* (strengthen the author guidance + `seal-amend`
the suite, or discard a buggy B), and it never triggers a sensor-style automatic
rewrite. It is the R2 "cross-family quorum" idea applied to the reference rather
than the judge.

## Error handling follows the same split

- **Compile or unsatisfiable failure** → a **gate (sensor) failure**. Feed the
  exact compiler/test stderr back into a rewrite loop for `stz-test-author`, then
  re-gate. Do not hand-patch the suite.
- **Fragile invariant discovered later** (e.g. the sealed suite fails identically
  across all *correct* specimens at eval) → an **authoring (guide) failure, not a
  gate miss**. The gate was never capable of detecting it. Fix via an audited
  `seal-amend`, and treat it as a signal to strengthen the author guidance — not
  as a bug in the gate.

The short version: **fix the contract, not just the prompt.** Prompt hardening is
the control for semantic fragility; the smoke gate is a narrow mechanical sensor;
the full-solution reference is isolated to scratch-only verification.
