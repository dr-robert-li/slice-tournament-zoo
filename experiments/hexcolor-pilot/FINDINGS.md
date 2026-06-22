# Hexcolor-pilot — second fresh-task validation of the test-author hardening + judge-vs-suite (step 3)

Two goals (from `experiments/HANDOFF.md` decision chain, post-CONTROLS-2 / HARDENING-VALIDATION):

1. **Step 2** — validate the PBT-negative-space principle on a fresh task whose specimens have a
   *subtle parser soft spot* (the discriminating scenario ipv4 could not trigger: ipv4's specimens
   all failed the *obvious* negatives, so OLD already separated and the soft-spot axis never arose).
2. **Step 3** — judge-augmented selection vs a hardened suite **at equal token budget**: once the
   suite is sharp enough to catch the soft spot, does a reasoning judge still earn its cost, or is it
   redundant?

Task: `parseHexColor("#RRGGBB") → {r,g,b}`, "throw on malformed". Chosen because it reproduces the
cron `5abc` mechanism on fresh ground: `parseInt("cg",16) === 12` (reads `c`, drops the non-hex
`g`), so **`#aabbcg` is a subtle soft spot** — a per-byte `parseInt`-slicer silently accepts it
(returns `{170,187,12}`); a regex/charset validator rejects it. Only the *trailing* position of a
byte discriminates (`parseInt("gc",16)===NaN`, rejected by everyone).

## Method (blind, non-circular — same discipline as ipv4)

- **7 Haiku specimens**, each reading ONLY `slice/CONTRACT-VAGUE.md` + `suites/hex.public.mjs`
  (happy-path only, no rejection cases), forbidden from `runs/`, `suites-authored/`, findings,
  probes. Diversity hints varied the strategy (regex-validate, per-byte parseInt, manual nibble
  decode, `Number("0x"+..)`, defensive-normalize, and two **lean** "length-check-then-parseInt, no
  charset validation" specimens). No hint named any soft-spot input — diversity, not train-on-test.
- **Gate (advisor-mandated):** probe specimen strictness *post-hoc* (never shown to authors) and
  confirm the pool contains a **strict-on-obvious + leaky-on-subtle** specimen BEFORE the author
  fan-out. ipv4 died from uniform leniency; hexcolor risked the symmetric failure (uniform
  strictness — hex is a regex one-liner).
- **4 sealed-suite authors** (Opus), 2 **OLD-prompt** (pre-hardening guidance: happy + edges incl.
  "malformed", "prefer property-based generators", invariant rules, reference) and 2 **NEW-prompt**
  (+ the adversarial-coverage section: mandate REJECTION, DISCRIMINATING cases, **PBT-negative
  generator over the negative space**, **stay within the contract**). Guidance **inlined**
  (agentType `claude`, not the now-hardened `stz-test-author` registry entry) so the OLD control is
  uncontaminated. All authors blind to specimens/probes; each wrote a suite + a reference it must
  pass green.

## Gate result — first 5 specimens uniformly STRICT (the predicted symmetric failure)

Specimens a–e all reject `#aabbcg` AND every obvious malformed form — hex validation is a one-liner
most implementers reach for, so the pool converged strict and the soft-spot axis did not arise (the
mirror image of ipv4). Two added **lean** specimens (f, g: length-check + `parseInt` slice, no
charset check) produced the target: **strict on every obvious negative, leaky only on `#aabbcg`**.
Gate passed with f, g as the discriminating specimens; a–e as correct controls.

## Step 2 results (`score-hex-validation.mjs`)

**Specimens** (a–e correct → want 1.000; f, g leaky → want <1.000 = caught):

| | old-1 | old-2 | new-1 | new-2 |
|--|-------|-------|-------|-------|
| spec-a (regex strict) | 1.000 | 1.000 | 1.000 | **0.983** |
| spec-b..d (strict) | 1.000 | 1.000 | 1.000 | 1.000 |
| spec-e (strict, trims ws) | 1.000 | 1.000 | **0.997** | **0.917** |
| **spec-f, spec-g (leaky)** | **0.948** | **0.917** | **0.933** | **0.883** |

**Cross-reference** (every reference want 1.000 everywhere): **all four refs score 1.000 on all four
suites** — no reference-level mirror bug.

### Finding 1 — the discriminating axis: NEW ≈ OLD; **both** catch the soft spot

All four suites catch f, g (<1.000), and the catch *is* the soft spot: f/g parse every valid color
correctly and reject every obvious negative — the only thing they wrongly accept is the
`#aabbcg`-class (non-hex trailing char), so the <1.000 is entirely the suites' `#aabbcg`-class
negatives. **OLD catches it just as well as NEW.** This **replicates ipv4**: on a fresh task the
soft spot is reachable by a generic "mutate a valid color, substitute a non-hex char *anywhere*,
assert throws" generator — and OLD authors already write that (the pre-hardening guide says "prefer
property-based generators" + cover "malformed input"). The cron separation — where OLD *ties* a
leaky specimen at 1.000 and only NEW catches it — **was not reproduced on either fresh task.** On
cron the discriminating mutation was *append junk to a valid token* (`5`→`5abc`), which a naive
negative list misses; on hexcolor/ipv4 it is *substitute one char*, which any mutate-anywhere
generator hits. So the PBT-negative principle's unique value over OLD remains **unreproduced on a
clean fresh task** — directionally reasoned (it targets soft spots), but every fresh task tried so
far has a soft spot that OLD-style negatives already reach.

### Finding 2 — the neutrality guard REVERSED roles vs ipv4 (a real negative result)

new-2 (and mildly new-1) is **over-strict on spec-silent inputs**: it scores correct specimens
<1.000. Diagnosed exactly (`probe-specimen-strictness.mjs` + a spec-silent probe):
- new-2 asserts **surrounding whitespace** (`" #123456"`, `"#123456 "`, `"#123456\n"`) must throw —
  spec-e legitimately *trims* (a defensible lenient reading; the contract gives no whitespace
  examples and is silent on trimming) → spec-e fails 3 cases.
- new-2 asserts **non-string args** (`["#ffffff"]`, an object with `toString`) must throw — spec-a
  and spec-e *coerce* them to a valid string (JS coercion; the contract's signature is `s: string`
  and it is silent on caller type-violations) → spec-a fails 1, spec-e fails more.

Both are **spec-silent axes** (same class as ipv4's leading-zero and cron's `7`=Sunday, discounted
by the project's own discipline). The "**stay within the contract**" guard — which ipv4 found
"empirically load-bearing" because there NEW stayed neutral and OLD over-committed — **failed in the
opposite direction here**: NEW over-committed, OLD stayed neutral (old-1 explicitly asserted only
the "throws-OR-returns-valid" invariant on whitespace/non-string; old-2 explicitly excluded case and
whitespace). So across n=2 fresh tasks, **which arm stays neutral is author-variance, not a reliable
property of the guard text.** ipv4's "guard is load-bearing" claim does not generalize; the honest
combined read is that capable authors reason about spec-silence with or without the guard, and the
guard text alone does not reliably prevent the mirror bug.

(Fair-alternative reading, noted for honesty: one can argue `#123456 ` is "not a well-formed
six-digit hex color" so rejecting it is *mandated*, making new-2 more rigorous and spec-e buggy.
Under that reading new-2 is correct and OLD is under-testing. The contract is genuinely ambiguous
here — which is exactly why testing it commits the suite to one of two defensible readings, the
condition under which "stay within the contract" says don't test it.)

## Step 2 conclusion

- **PBT-negative principle: structurally followed, discriminating-axis value still unreproduced.**
  Both NEW authors wrote mutation-based negative generators (new-2: 6-way corruption + 300-iter; new-1:
  4 generators) — guidance is followed (consistent with cron 3/3, ipv4). But OLD's generators caught
  the same soft spot, so the *separation* NEW is supposed to add over OLD did not appear — for the
  second fresh task running. The cron result that motivated the whole principle is looking
  increasingly like a property of cron's particular *append-junk* soft spot, not a general win.
- **The hardening is still safe and ≥ OLD on substance** (catches every leaky specimen, refs all
  green), but on hexcolor it also introduced an over-strict mirror bug on spec-silent inputs that OLD
  avoided — so "strictly ≥ OLD" from ipv4 does **not** hold here. Net for the guide: keep the
  rejection/PBT-negative content (it never *under*-catches), but the "stay within the contract" guard
  needs strengthening — as written it did not stop a capable author from committing the suite to a
  spec-silent reading.

---

## Step 3 — judge-augmented selection vs the hardened suite, at equal token budget

**Question (per CONTROLS-2 + advisor):** CONTROLS-2 showed the judge beats a *flat/leaky* suite
(catches a spec-mandated bug class the flat suite ties at 1.000). Step 3 asks the harder question:
once the suite is **hardened** so it already catches the soft spot, does the judge still earn its
cost at equal token budget, or is it redundant?

**Setup.** The hardened suite here = old-1 (the cleanest: catches f,g at 0.948 **and** stays neutral
on the correct a–e at 1.000). Flat suite-rank selection over the pool already deselects the leaky
f,g and keeps the correct a–e — at **~0 marginal model tokens** (deterministic re-run of an
already-authored suite). The frozen `stz-judge` was then run on two pairs, **both orders**, reasoning
from the **contract only** (NOT handed any suite score — so we measure its *independent* signal, i.e.
its marginal value over the suite):

| pair | order 1 | order 2 | suite (old-1) says | judge tokens/call |
|------|---------|---------|--------------------|-------------------|
| **a (strict) vs f (leaky)** | picks **a** | picks **a** | a 1.000 > f 0.948 | ~9.9k |
| **a vs b (both correct)** | picks **b** | picks **b** | a 1.000 = b 1.000 (tie) | ~10k |

### Finding 3 — on the spec-MANDATED axis the judge AGREES with the hardened suite (redundant, not additive)

a-vs-f: the judge picked the strict specimen in **both orders**, independently re-deriving f's
`parseInt` leniency from the code — and cited **real, probe-confirmed** leaks (`#-1ff00`→`{r:-1}`,
`#+ffabc`→accepts, `#aabbcg`→`{b:12}`; all rejected by the strict specimen). The reasoning is sound,
not hallucinated. **But the hardened suite catches exactly the same thing** (f scores 0.948). So on
the axis the hardened suite covers, the judge's verdict is **identical** — it adds no *new*
correctness signal, it pays ~10k tokens to re-derive a verdict the suite already produced for free.
The judge's CONTROLS-2 win was specifically over a *flat* suite; **its marginal value over a hardened
suite on the discriminating axis is ≈ 0.**

### Finding 4 — offered the tie, the judge declined it and over-committed on a spec-silent axis (same phenomenon as Finding 2)

a-vs-b: both specimens are genuinely correct (the suite ties them 1.000 — the right answer; there is
no correctness difference). **The judge prompt explicitly offered `WINNER: TIE`** — and in both
orders the judge *declined the tie* and picked b, on the grounds that b has an explicit
`typeof s !== 'string'` guard while a *coerces* `["#ffffff"]` to a valid string. That is the **exact
spec-silent non-string axis** Finding 2 flagged as new-2's mirror bug — the contract is silent on
caller type-violations, and coercion is a defensible reading. So this is **not** "a judge cannot
abstain by construction" (it was handed the abstain option); it is **a judge given the choice chose
to rank on a spec-silent axis anyway** — a *discipline* gap, not a structural impossibility.

Crucially, **Finding 2 and Finding 4 are the same phenomenon**: a spec-silence discipline ("don't
rank/test on axes the contract is silent about") that is **encodable in both** the suite (the guide's
"stay within the contract" line) **and** the judge (the identical instruction dropped into the judge
prompt: "return TIE when the only differences are on spec-silent axes") — and **empirically
unreliable in both so far**: new-2 violated it with the guard *present* in its prompt; the judge
violated it with `TIE` *available*. The lever the next reader needs is **make the spec-silence guard
reliable** (it helps suites and judges alike), not "judges are hopeless."

### Step 3 conclusion — at equal budget, harden the suite; the judge doesn't change the selection here

- **The judge does not change the selection the hardened suite already makes.** On the spec-mandated
  axis it agrees (f loses either way); note it *did* reason over a broader leak class than old-1
  enumerates — it surfaced sign-prefix leaks (`#-1ff00`, `#+ffabc`) the suite's negatives don't list
  — so it is not "no signal the suite lacks" (that would contradict CONTROLS-2); it is "no signal
  that *changes the winner* the hardened suite already picks." On the spec-silent axis it
  over-commits where the disciplined suite correctly declines. The judge's banked CONTROLS-2 win was
  against a *flat* suite; it does not carry into a changed selection once the suite is sharpened.
- **Token budget:** a judge decision ≈ 10k tokens ≈ the cost of one more specimen draw (~12k). On
  this task that budget is better spent on the suite (already done, ~0) + extra draws than on a judge
  that re-derives the suite's selection and risks spec-silent over-commitment.

---

## Overall conclusion — what this pilot adds to the 0.8.0-loop decision

This is the **second fresh task** (after ipv4) and it sharpens the HANDOFF decision chain:

1. **PBT-negative principle: followed, and still UNTESTED on a discriminating task — not answered
   negatively.** Both NEW and OLD authors catch the soft spot here, because hexcolor's soft spot
   (substitute-one-char) is reachable by the generic mutate-anywhere negative generator OLD already
   writes — as was ipv4's. The only soft-spot class where NEW *could* beat OLD is cron's
   *append-junk* form (mutate a valid token by appending, `5`→`5abc`), which a naive negative list
   misses but a generator catches. **Neither fresh task created that condition** — so the principle's
   separating value is **not reproduced because the discriminating scenario never arose**, not because
   it failed. The honest status: "no fresh task has yet reproduced cron's append-junk soft-spot class
   — the one class the principle was designed to win." Still open, needs a task whose specimens leak
   on append-junk.
2. **The "stay within the contract" neutrality guard is not reliable** — ipv4 said it was
   load-bearing (NEW neutral, OLD over-committed); hexcolor reversed it (NEW over-committed, OLD
   neutral). Across n=2 it is author-variance. **Guide action:** strengthen the guard (the spec-silent
   over-commitment in new-2 shows the current text is insufficient), keep the rejection/PBT content.
3. **The 0.8.0 convergence loop is still NOT justified — and Step 3 reframes the real lever.** The
   loop is a reasoning-judge-style steering layer. Step 3 shows that, against a *hardened* suite, a
   reasoning judge (a) does not change the selection the suite already makes on the spec-mandated
   axis, and (b) over-commits on spec-silent axes **when its spec-silence discipline is unreliable**
   (it declined an offered TIE). The key reframing: **the spec-silence over-commitment in the suite
   (Finding 2) and in the judge (Finding 4) is one phenomenon, encodable in both and reliable in
   neither yet** — so the highest-value lever is **making the spec-silence guard reliable** plus a
   sharper sealed suite, both of which help a future judge/loop too. **Build the loop only if a
   future task shows a correctness gradient a hardened suite provably cannot express — not seen on
   cron, ipv4, or hexcolor.**

## Honest limits

- **Small n** (one task per soft-spot class; 7 specimens; 4 authors; 4 judge calls). Mechanisms are
  robust (probe-confirmed); magnitudes are directional.
- **The discriminating specimens f,g were elicited by a "lean, no charset validation" hint**, not
  found organically among the first 5 (which were uniformly strict). The hint is legitimate diversity
  (real parsers skip validation; no soft-spot input was named), but the pool's strict/leaky mix was
  *engineered into existence*, not natural — so "blind authors catch organically-occurring soft spots"
  is tested, "soft spots occur organically" is not.
- **Step 3's "judge over-commits on spec-silent" rests on the a-vs-b pair**; a different correct pair
  with no spec-silent difference might tie. The structural point (a judge cannot abstain) stands
  regardless, but its *harm* depends on how often spec-silent differences exist between correct
  specimens.
- **"Judge agrees with suite" was shown on one strict-vs-leaky pair** (both orders). It is exactly
  the CONTROLS-2 mechanism, so it is consistent, but it is one pair.
- Blindness: specimen/author prompts forbade the cross-reads; specimen code shows no forbidden-path
  strings. Evidence, not proof.

## Inventory

- `slice/CONTRACT-VAGUE.md`, `suites/hex.public.mjs` — task + happy-path public suite.
- `runs/specimens/specimen-{a..g}/` — 5 strict + 2 lean-leaky Haiku specimens.
- `suites-authored/{old-1,old-2,new-1,new-2}/` — 4 sealed suites + references (OLD vs NEW prompt).
- `probe-specimen-strictness.mjs` — post-hoc ground-truth strictness labels (never shown to authors).
- `score-hex-validation.mjs` — specimen×suite + cross-reference scoring.
- Judge calls: 4 `stz-judge` runs (a-vs-f, a-vs-b, both orders), contract-only reasoning.

