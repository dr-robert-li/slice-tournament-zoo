# PILOT-RESULTS-JUDGE — judge-beyond-suite blind arm on cron, signal-matched (2026-06-26)

The run pre-registered in `PILOT-PREREG-JUDGE.md`. This closes the one door
`PILOT-RESULTS-BLIND.md` left open: the sealed-steered loop was ruled out, but a loop whose
stop/steer signal is a **reasoning judge that reads the contract and reasons past the sealed
suite** was untested as a budget-matched, signal-matched loop. It is now tested. **The judge-loop
*mechanism* works — better than CONTROLS-2 showed — but the loop is still not warranted, because
the gradient it crosses is suite-expressible and the cheap lever (a hardened suite + best-of-N)
reaches the same ceiling by selection at ~0 marginal cost.**

## Design (signal-matched — the §7 correction)

To value the LOOP you must hold the *signal* fixed and vary only the *search*. The signal is the
frozen blind judge in all loop/sample conditions; the search differs:

- **A. judge + best-of-N** — judge selects the best of N fresh blind draws (sample).
- **B. judge + iterate** — judge critiques one candidate past the green sealed suite; reviser
  revises; repeat until the judge is satisfied or budget B is spent (loop).
- **C. hardened-suite + best-of-N** — the cheap baseline the loop must beat: select the best of the
  same N draws by a hardened conformance battery (incl. the `5abc` malformed case). "Sharpen the
  suite," the lever the whole pilot line keeps naming.

The decisive comparison is **B vs C**, not B vs sealed-best-of-N (which would measure the signal
upgrade, not the loop — the pro-build symmetric error §7 step 3 contained).

Substrate: cron, `CONTRACT-VAGUE.md`, recall-free. Primary scorer = truth firing-time/property cases
+ the 13-form contract-mandated must-throw battery, **minus the `7`==Sunday convention** (the
contract says dow `0–6`; crediting `7`==Sunday is recall, not spec — see pre-reg).

## The gradient (measured in the pre-reg gate)

Across a 15-specimen pool, the ONLY recall-free, contract-mandated, sealed-AND-truth-blind
discriminator on cron is a **single axis**: `5abc * * * *` — the `parseInt("5abc")===5` silent
-truncation trap. The contract says "Throw on a malformed expression"; sealed scores the buggy
winner 1.0 and the current truth suite scores it 0.9767 (it only tests pure-garbage `abc`). Reject
base rate ≈ 1/3. Every other contract-mandated must-throw form is non-discriminating (all specimens
already handle it).

## Fresh pool (4 blind Haiku draws, B = 90,140 gen tokens)

| cand | sealed | truth_full | mustThrow | `5abc`✓ | tokens |
|------|--------|------------|-----------|---------|--------|
| j1 | 1.0 | **1.0** | 13/13 | ✓ | 15,674 |
| j2 | 1.0 | **1.0** | 13/13 | ✓ | 37,549 |
| j3 | 0.993 | 0.954 | 12/13 | ✗ | 18,183 |
| j4 | 1.0 | **1.0** | 12/13 | ✗ | 18,734 |

The pool already contains **two fully spec-correct candidates** (j1, j2: truth 1.0 *and* reject
`5abc`). That single fact largely settles B vs C before the loop runs.

## Conditions, equal budget, signal-matched

| condition | mechanism | reaches | `5abc`✓ | truth | marginal cost beyond generation |
|-----------|-----------|---------|---------|-------|--------------------------------|
| **A** judge+best-of-N | judge selects j1/j2 | ceiling | ✓ | 1.0 | one judge selection pass |
| **B** judge+iterate | j4 → judge critique → revise | ceiling | ✓ | 1.0 | **74,289 (critique) + 17,844 (revise)** |
| **C** hardened+best-of-N | battery selects j1/j2 | ceiling | ✓ | 1.0 | **~0 (automated scoring)** |

**B == C == A** at the identical correctness ceiling (truth 1.0, `5abc`-correct). B does **not**
exceed C. → pre-registered table **row 2: 0.8.0 NOT warranted — sharpen the suite.**

## What condition B actually showed (the part that is genuinely new)

B was run on `j4` — the clean analog of the old best-of-N winner `c2`: **sealed fully green
(1243/1243), truth_full 1.0, yet it silently accepts `5abc`** (line 158, `parseInt("5abc")===5`). A
sealed-steered loop would *stop* here (sealed is green). The blind judge — given ONLY the contract,
the candidate code, and "sealed is green," no leading hints, no mention of malformed/`5abc` —
**reasoned past the green suite and found the `5abc` spec violation (its "Gap 1"), plus two more
real malformed-validation gaps** (out-of-range range/step bounds silently clamped; multi-component
`1-5-9` / `*/2/3` tokens silently truncated). The reviser fixed all three; the result hit the
ceiling with no regression.

So the judge-beyond-suite capability is **operationally confirmed as a loop critic** — a strictly
stronger demonstration than CONTROLS-2 (which only showed the judge as a pairwise *selector* on
truth-tied tiers). The mechanism is real and it works on a fully-green candidate.

## Why the loop is still not warranted (the verdict, precisely)

Three reasons, none of which diminish the judge — they **relocate** its value:

1. **The gradient is suite-expressible.** `5abc` is one finite test. A hardened battery that adds
   `expect(() => nextRun("5abc * * * *", t)).toThrow()` lets plain best-of-N (C) select a correct
   candidate. By the standing decision's own bar — "build a loop only if the judge crosses a
   gradient a hardened suite *cannot* express" — `5abc` does not qualify. On cron, **no
   contract-mandated gradient a hardened suite cannot express was found.**
2. **Selection already reaches the ceiling.** The fresh pool held two fully-correct candidates, so C
   (and A) hit truth 1.0 + `5abc`-correct by selection. There was nothing above that ceiling for the
   loop to reach.
3. **Cost asymmetry is decisive.** B paid **74k tokens for a single critique round** (≈ the entire
   4-candidate generation budget) to reach a ceiling C reaches with automated battery scoring at
   ~0 marginal tokens. Paying per-slice for a reasoning loop to re-derive a bug class is dominated by
   catching the bug class **once** and baking it into the suite.

**Net:** the judge earns its cost as a **selection / suite-authoring** instrument (catch the
spec-mandated bug class the suite misses, then harden the suite), exactly the CONTROLS-2 +
sealed-steered conclusion. It does **not** earn its cost as a **per-slice search loop**. The
standing decision is unchanged and now fully earned on both the sealed-steered and the
judge-beyond-suite forms: **sharpen the suite; do not build the 0.8.0 convergence loop.**

## The one narrow cell (acknowledged, not silently dropped)

The loop strictly beats best-of-N only when the *entire* sampled pool lacks a correct candidate AND
iteration repairs one (≈ `(2/3)^N` of pools at base rate 1/3 — e.g. ~20% at N=4). But whenever the
hardened battery is available as a selection signal (it is, at ~0 cost), the cheaper response to an
all-buggy pool is to **draw more / sharpen the suite**, not to pay 74k/round to iterate. Even that
cell favors the suite. A loop would only win where (a) you cannot express the requirement as a test
*and* (b) sampling reliably misses it — a combination cron does not exhibit.

## Honest bounds

- **n = 1 seed, directional.** hexcolor/ipv4 replication was pre-registered only as a follow-up to a
  *clean B > C*; B = C, so the cross-task replication is not what would change the call (a
  lower-base-rate, non-suite-expressible gradient would).
- **Single discriminating axis on cron.** The verdict rests on cron exposing no contract-mandated
  gradient a hardened suite cannot express. A task whose correctness is genuinely non-enumerable
  (open-ended quality, unbounded input classes) could reopen the loop question — cron is not it.
- **Recall-free**, convention axes excluded from the primary number with contract citation.
- The 74k judge-critique cost is itself load-bearing: the cost asymmetry vs automated selection is
  part of the verdict, not an incidental.

## Artifacts

`cron-pilot/runs/judge-arm/` (`cand/j1..j4/`, `iterate/`, `score.mjs`),
`swebench-pilot/results/judge-arm-cron.json`. Pre-reg + decision table: `PILOT-PREREG-JUDGE.md`.
