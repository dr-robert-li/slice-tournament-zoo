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

## Conditions, signal-matched (all three executed)

| condition | mechanism | reaches | `5abc`✓ | truth | total tokens |
|-----------|-----------|---------|---------|-------|--------------|
| **A** judge+best-of-N | judge **selected j2** (measured), citing malformed-rejection | ceiling | ✓ | 1.0 | 179,736 (90,140 gen + 89,596 select) |
| **B** judge+iterate | j4 → judge critique → revise | ceiling | ✓ | 1.0 | **110,867** (18,734 gen + 74,289 critique + 17,844 revise) |
| **C** hardened+best-of-N | battery selects j1/j2 | ceiling | ✓ | 1.0 | **90,140** (4 draws; ~0 marginal scoring) |

**B == C == A** at the identical correctness ceiling (truth 1.0, `5abc`-correct). B does **not**
exceed C. → pre-registered table **row 2: 0.8.0 NOT warranted — sharpen the suite.**

**Two honesty notes on this seed (both lean anti-build conservative):**
- This pool held **two fully-correct candidates (j1, j2)**, so C reaches the ceiling by selection and
  B *cannot exceed a ceiling C already hits* — **B==C was forced** the moment j1/j2 landed. The
  equal-outcome here is **corroborative, not probative**; the probative test is the all-buggy cell
  below.
- B **overspent**: 110,867 tokens vs C's 90,140, and still only tied. The pre-reg's "equal budget B"
  was not literally held — iterate cost *more* and did not win, which makes the anti-build call robust
  to the extra budget.

## The discriminating cell (all-buggy pool) — the test §7 actually asks

The only cell that tests "does the loop reach correctness sampling cannot" is the **all-`5abc`-buggy
pool**, where selection has no correct candidate to pick. This seed supplies it: **{j3, j4}** both
fail `5abc`.

- **C (hardened+best-of-N) on {j3,j4}:** selects max `mustThrow` (12/13 tie); the winner *still*
  accepts `5abc` → **stuck. Selection cannot manufacture a correct candidate** (CONTROLS-2's own
  point).
- **B (judge+iterate) on j4:** judge critiques past green-sealed → reviser fixes → `5abc`-correct
  ceiling → **B wins the binary.**
- **But the loop still loses on cost.** The alternative to iterating an all-buggy pool is **draw
  more** (sample until a correct candidate appears, expected `(1/p)·avg_gen`). At cron's base rate
  `p ≈ 0.33–0.50`, draw-more ≈ **45k–68k** vs iterate's **111k**. The 74k/round judge critique
  dominates. **Crossover: draw-more is cheaper for any `p > ~0.20`; iterate wins on cost only when the
  base rate is tiny (< ~0.20). cron is well above that.**

So even in the cell where the loop wins the binary, draw-more (a cheaper form of sampling) beats it.
The loop **never strictly dominates** on cron.

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

## The boundary (where a loop *could* win — stated once)

The loop loses whenever **both**: (a) the gradient is **suite-expressible** (a finite test captures
it), and (b) the base rate is **not tiny** (`> ~0.20`, so draw-more is cheap). **cron is both.** A
loop could only win where correctness is genuinely **non-enumerable** (a finite suite cannot express
it) OR the base rate is **tiny enough** that draw-more's `(1/p)·gen` exceeds the loop's flat cost.
These are the **same door** — the only thing that reopens 0.8.0 — and cron walks through neither.
(The all-buggy-cell analysis above is the cost half of this boundary; the suite-expressibility of
`5abc` is the capability half.)

## Honest bounds

- **n = 1 seed; pre-reg deviation flagged.** The pre-reg specified 3 seeds and gated "apply the
  table" on the 3-seed run. One seed ran; the discriminating test is this seed's **all-buggy
  sub-pool {j3,j4}**, not 3 fresh seeds. The verdict leans on the **structural bar** (suite-expressible
  gradient + cost crossover), which 3 seeds would not change — a *lower-base-rate, non-suite-expressible*
  gradient would, and cron has none. hexcolor/ipv4 replication was pre-registered only as a follow-up
  to a *clean B > C*, which did not occur.
- **Condition A was executed** (judge-selector picked j2, 89,596 tok), not inferred.
- **Blindness audit (pre-registered guardrail): clean.** grep of j1–j4 + `iterate/index.mjs` for
  suite constants — the sealed count `1243`, truth-specific expected ISO times, and `sealed`/`truth`/
  `suite` filenames — found **none**. Specimens were instructed not to read the suites; emitted code
  shows no leakage. Evidence, not proof (a silent `Read` would not appear in the code).
- **Single discriminating axis on cron** (`5abc`); cron exposes no contract-mandated gradient a
  hardened suite cannot express.
- **Recall-free**, convention axes excluded from the primary number with contract citation.
- The 74k judge-critique cost is itself load-bearing: the cost asymmetry vs automated selection AND
  vs draw-more is part of the verdict, not an incidental.

## Artifacts

`cron-pilot/runs/judge-arm/` (`cand/j1..j4/`, `iterate/`, `score.mjs`),
`swebench-pilot/results/judge-arm-cron.json`. Pre-reg + decision table: `PILOT-PREREG-JUDGE.md`.
