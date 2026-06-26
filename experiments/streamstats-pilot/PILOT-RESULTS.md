# RESULTS — harness-evolve on a fresh non-enumerable contract

> Pre-registration: `PREREG.md`, committed at `9bc2e25` **before any specimen existed**.
> Machine-readable: `results/evolve-result.json`, `results/evolve-scores.json`.
> N6 archive: `.stz/60-harness/MANIFEST.json`. Scores recompute from stored artifacts
> via `score_evolve.mjs`.

## TL;DR

A genuine, pre-registered, 3-seed, budget-matched run of the **0.9.0 harness-level
meta-loop** (`stz:evolve` / `stz bridge harness-*`) on a **fresh non-enumerable
contract**. Outcome: **a faithful NULL — recall saturation, not a promotion.** Blind
implementer pools on *two* fresh non-enumerable tasks were 100% correct, so selection
had nothing to discriminate and the five-gate promotion machinery **correctly promoted
nothing** — the symmetric-error anti-build outcome, with the no-gap decline path executed
on real specimen data through the real bridge (the promotion path itself, the goal's
literal mechanism, was never reached because no blind pool produced a gap). The headline "a promoted variant beats the incumbent" was **not** achieved with
genuinely blind specimens, and the honest reason is reported below. The §7 boundary is
**sharpened**: a search/evolve win needs correctness that is non-enumerable **AND
out-of-recall** for the implementer pool — strictly narrower than "non-enumerable" alone.

This is the conscience-aligned form of the goal: when blind specimens will not split, the
result is a rigorous account of *why*, and of the precondition a real win actually
requires — not a constructed gap dressed up as an evolve (that was considered and
**rejected** as rigging, §5).

## 1. Substrate and separation gate (the substrate is not the problem)

`streamStats` (`slice/CONTRACT.md`): single-pass, O(1)-memory population mean+variance,
relative tolerance 1e-6. The "single pass, O(1)" constraint tempts the textbook
`E[x²]−E[x]²` formula (catastrophic cancellation at large mean / small spread) over the
stable Welford recurrence. Correctness is **magnitude-dependent** — the gradient the §7
boundary names.

Separation gate (run before the pre-reg commit; touches no blind data):

| reference impl | `fixed_suite` | `property_suite` | `truth` |
|----------------|:---:|:---:|:---:|
| correct (Welford) | **1.000** | **1.000** | **1.000** |
| naive (sum-of-squares) | **1.000** | 0.667 | 0.899 |

The naive impl **passes the good-faith fixed suite completely** but **fails** the
property suite (0.667) and the held-out truth oracle (0.899). The substrate *can*
discriminate correct from buggy; the fixed suite is genuinely blind to the magnitude
axis and the property heuristic crosses it. Train-on-test is avoided by construction: the
property suite checks algebraic invariants (shift/scale/closed-form) under `SEED_P`; the
truth oracle uses an absolute two-pass reference under a different `SEED_T` and a
different distribution.

## 2. The blind 3-seed evolve — recall saturation

Three distinct generation seeds, K=5 blind `haiku` specimens each (contract only, blind
to every suite). Budget-matched by construction (both genomes select from the *same*
pool). Selection value per the pre-reg = expected truth over each genome's
indifference set.

**Every one of the 15 specimens is Welford's online algorithm. All score truth = 1.0.**
Fingerprint: 15/15 welford, 0/15 naive. Blindness audit: 0/15 reference any suite/oracle
constant (clean).

| seed | incumbent indiff. set | sharper argmax set | `fitness_inc` | `fitness_mut` | win |
|---|---|---|---|---|---|
| 1 | 5 | 5 | 1.000 | 1.000 | no |
| 2 | 5 | 5 | 1.000 | 1.000 | no |
| 3 | 5 | 5 | 1.000 | 1.000 | no |

`mean_inc = mean_mut = 1.000`. No selectable gap on any seed: the implementers do not
fail, so the sharper suite has nothing to catch that the fixed suite misses. This is the
**recall** failure mode the pre-reg (§4) and HANDOFF §6 both name explicitly.

## 3. One pre-registered substrate switch → `shuffle` → also saturated

`streamStats` blind spread was rate-0 (variance→Welford is too canonical even for haiku).
Per the advisor protocol, one switch to a **truly** non-enumerable task — uniform
`shuffle` (uniformity is a *statistical* property; no finite example suite expresses it).
The natural antipattern `arr.sort(() => Math.random() - 0.5)` is everywhere in training
data, so a blind pool *could* split. Cheap **fingerprint-only** probe (5 blind haiku
specimens) before building the χ² apparatus:

**5/5 correct Fisher-Yates (`j ∈ [0,i]`); 0/5 sort-random.** Recall-saturated again.
Probe-killed: no clean-fingerprint blind spread, so no full run built (building the
distributional oracle just to *detect* spread is the rigging surface the advisor flagged).

**Cross-substrate null:** two textbook non-enumerable tasks, both 100% recall-saturated.

## 4. The machinery ran the no-gap decline path and correctly declined

> Scope note (precision): what ran on real specimen data is the **no-gap decline**
> path — `harness-fitness` → `harness-select` (collapse) → `harness-promote` (refuse).
> The actual **promotion** path (a variant beating the incumbent and passing all five
> gates) was never exercised on real specimens here — only in the unit suite — because
> no blind pool produced a gap. And this was **one** generation that collapsed; the
> pre-reg's gen-2 was moot (the FSM halts on collapse). `harness-status` reports
> `"generation": 2`, but that field is `archive.length` (two entries, one generation),
> not two generations.

Driven on the real bridge against the blind all-correct pool (`.stz/60-harness/MANIFEST.json`):

```
harness-fitness baseline-v0  -> variantId 008ec06ffaa1d4e6  fitness 1.0  (incumbent seed)
harness-fitness sharper-v1   -> variantId 63089087a032df8f  fitness 1.0  parent 008ec06ffaa1d4e6
harness-select [both @1.0]   -> sigma 0 < floor 0.02  ->  VARIANCE COLLAPSE, winner null
harness-promote sharper-v1   -> promote:false  failed:[does-not-beat-incumbent,
                                                        generation-variance-collapsed]
                                interface-parity: OK
harness-status               -> incumbent 008ec06ffaa1d4e6 (baseline-v0) STANDS
```

Two independent gates refused the promotion (no fitness gain *and* a collapsed
generation), and interface parity was preserved. `baseline-v0` remains the incumbent;
`sharper-v1` is retained as a parent-linked stepping-stone (DGM archive), not promoted.
**This is the anti-build null firing exactly as designed** — a real validation of the
symmetric-error gate, not skippable plumbing.

## 5. What was deliberately NOT done

A constructed pool — inserting the naive reference impl as a "specimen" to manufacture a
gap — would clear the gate and *show a promotion*. It was **rejected**: the gap would be
experimenter-controlled, which is the separation gate + unit tests re-run through the CLI,
not an evolve. A promotion is only meaningful when the buggy specimen arises naturally
from a blind implementer. It did not, so none is reported.

## 6. Analysis — the boundary, sharpened

The judge-arm verdict left exactly one door open for a search/evolve win: *correctness
that is genuinely non-enumerable*. This arm narrows that door with empirical evidence:

> A win needs the failure to be non-enumerable **AND out-of-recall** for the implementer
> pool **AND** the base rate not tiny.

The clean-fingerprint non-enumerable tasks (variance, shuffle) are precisely the famous
ones a capable model has memorized — so blind specimens do not split, and there is
nothing for the sharper genome to win on. The untested cell that *could* still produce a
genuine promotion: a **frontier-vs-frontier** tournament on a **genuinely novel**
non-enumerable contract (no memorized solution), where blind specimens naturally fail.
That is a materially harder and more expensive experiment than any pilot here, and it is
the honest next step — not a constructed gap.

## 7. Bounds

- n=2 substrates, both textbook; one capable-but-small implementer (`haiku`). Frontier
  implementers would saturate textbook tasks *more*, not less — the fix is task novelty,
  not implementer strength.
- The separation gate proves the *suite* discriminates; the null is about the
  *implementers* not failing.
- N6: every score recomputes deterministically from stored artifacts; `MANIFEST.json`
  append-order is the audit trail.
