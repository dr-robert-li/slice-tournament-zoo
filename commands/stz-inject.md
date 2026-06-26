---
description: Harden a slice's sealed suite by adversarial bug injection (0.9.0). Surfaces blind spots the suite cannot see, adjudicates each against a named contract clause, and (only then) authors a GENERAL sealed test for it. Bounded, recall-free, never auto-rewrites.
argument-hint: "[slice-id] (or a sealed-suite + winning-impl path pair)"
---

Run the SSR-style adversarial suite-hardening loop for one slice. The per-slice
tournament already chose a winner; this command attacks the **sealed suite** to
find what it cannot see, and closes the gap once — so the bug-class is caught by
selection on every future slice, not re-derived per slice (the
`experiments/swebench-pilot/PILOT-RESULTS-JUDGE.md` lever).

## Loop (bounded by `injector.ts`, MAX_INJECT_ROUNDS = 2)

1. **Inject.** Spawn `stz-injector` (blind to the sealed suite + truth oracle).
   It reads the contract + the winning specimen and proposes candidate mutator
   specs `{name, find, replace}` (plausible perturbations it believes still
   satisfy the contract). Also run the built-in battery:
   `stz bridge inject --sealed <suite> --impl <winner> --root <root>`.
2. **Discover survivors.** A mutant the sealed suite still passes is a candidate
   blind spot. `bridge inject` reports them + the FSM's next action.
3. **Adjudicate (the mutant-promotion oracle gate).** For each survivor, spawn
   `stz-cross-reference` (the adjudicator): which **named contract clause** does
   this mutant violate? No clause → it is a contract-conformant variation (a
   mirror-bug) → **discard, do not seal**. Only a clause-violating survivor
   proceeds.
4. **Author a GENERAL case.** Spawn `stz-test-author` to write a property over the
   clause's input class — NOT an assertion keyed to the mutant's bytes
   (train-on-test is forbidden). Place it in `30-tests/held-out/`.
5. **Seal-amend + REFERENCE RE-VERIFY (load-bearing).**
   `stz bridge seal-amend --reason "<why>"`, then re-run the sealed **reference**.
   If the reference no longer passes, the new case is fragile/mirror → **revert
   the amend and halt for adjudication.** Also run `seal-crosscheck`: a
   `divergent` status means the case encodes a one-author assumption → flag, do
   not bless.
6. **Repeat or halt.** Follow the FSM `nextAction`: re-inject if blind spots
   remain (within the ceiling), else converge.

## Discipline
- Recall-free: run on synthetic substrates first; mutants come from the winner +
  contract, never from a known answer.
- Never auto-rewrite the suite. Every amend is human/agent-adjudicated and
  reference-re-verified. Sensors halt; they do not self-modify.
- A round that finds nothing is a SUCCESS (the suite is sharp here), not a failure.
