# HANDOFF — STZ-vs-naive validation (resume here after context clear)

> **READ `experiments/HANDOFF-CURRENT.md` FIRST.** It is the single, self-contained resume doc
> (state, assets, how-to-run, discipline, next step). This file is the layered decision log / full
> chain, kept for history; the UPDATE blocks below are chronological and newest-relevant at the top.

> **UPDATE 2026-06-22 (steps 2+3 DONE on a 2nd fresh task — see `hexcolor-pilot/FINDINGS.md`):**
> Both roadmap steps ran on `parseHexColor` (fresh, un-burned; reproduces cron's `5abc` soft spot via
> `parseInt("cg",16)=12`, so `#aabbcg` leaks in a per-byte slicer / is rejected by a validator).
> **Step 2 (PBT-negative on a fresh contract):** the principle's separating value over OLD is still
> **untested on a discriminating task — not disproven.** All 4 suites (OLD *and* NEW) caught the leaky
> specimens, because hexcolor's soft spot is a *substitute-one-char* mutation any mutate-anywhere
> generator hits (so is ipv4's), and OLD already writes those. The only class where NEW *could* beat
> OLD is cron's *append-junk* soft spot (`5`→`5abc`) — **neither fresh task created that condition**,
> so the win never had a chance to appear, vs failing to. Separately, the "stay within the contract"
> guard **reversed roles vs ipv4**: here NEW over-committed on spec-silent inputs (whitespace,
> non-string coercion → scored correct specimens <1.0), OLD stayed neutral → guard is author-variance
> at n=2, not load-bearing. Strengthen it; keep the rejection/PBT content.
> **Step 3 (judge vs HARDENED suite, equal budget) — the decisive new result:** against a *flat* suite
> the judge wins (CONTROLS-2, banked); against a *hardened* suite it **does not change the selection
> the suite already makes**. On the spec-mandated axis the judge agrees (re-derives f's `parseInt`
> leniency, ~10k tokens ≈ one specimen draw); where the suite correctly TIES two equally-correct
> specimens, the judge was **offered `WINNER: TIE` and declined it**, manufacturing a winner on a
> **spec-silent** axis (both orders). Key reframing: the spec-silent over-commitment in the *suite*
> (Step 2) and in the *judge* (Step 3) is **one phenomenon — a spec-silence discipline encodable in
> both, reliable in neither yet.** So the 0.8.0 loop (a reasoning-judge steering layer) would inherit a
> *fixable discipline gap*, not a structural flaw. Highest-value lever stays **a sharper sealed suite +
> a reliable spec-silence guard** (both help a future judge/loop too); build the loop only if a future
> task shows a correctness gradient a hardened suite provably cannot express (not seen cron/ipv4/hexcolor).


> **UPDATE 2026-06-22 (controls run, n=1):** The NEXT STEP below is **DONE** — see
> `cron-pilot/FINDINGS-CONTROLS.md` + `cron-pilot/score-controls.mjs`.
> Raw numbers: best-of-N (sealed) truth **1.000** ≈ frontier Opus **1.000**; best-of-4-naive **DNF
> (hang)**. **But the headline does NOT hold up under review.** The sealed suite **ties four
> specimens at 1.000** (two truth-1.000, two truth-0.977); best-of-N's win is **id-order tie-break
> luck over a truth-mixed tier**, not a selection win — reorder the pool → 0.977, and all 4 *fresh*
> Haiku draws plateau at 0.977. So criterion 1 is met **by number, not mechanism** (closer to
> criterion-3 plateau), and the convergence-loop decision is **NOT-YET-DETERMINED**, not "don't
> build." What *does* survive: naive's public suite is **provably non-discriminating** (all 4 =
> public 1.000), the narrow robust core of criterion 2. **Disambiguating runs needed before any
> verdict:** fresh-only best-of-N, **run the judge on the truth-mixed top tier**, 3 seeds, and
> naive-with-same-contract. Original step text kept below for reference.

> **UPDATE 2026-06-22 (disambiguating runs DONE — see `cron-pilot/FINDINGS-CONTROLS-2.md`):**
> All four follow-ups ran. **The judge run REVERSES the earlier lean.** (1) Fresh-only Haiku
> best-of-8 does NOT reach frontier — plateaus ~0.985, seed-3 hard 0.977; seeds 1–2's match was
> tie-break luck (confound #1 resolved). (2) Naive's DNF was **mostly prompt-framing** — naive
> +contract no longer hangs (confound #2 resolved). (3+4) **THE BIG ONE (spec-mandated, clean):**
> CONTRACT-VAGUE says "throw on malformed"; two **truth=1.0** specimens (`orig-c`,`orig-d`) accept
> `5abc` instead — and the **sealed suite scores them 1.0 too**. So **both truth AND sealed oracles
> pass spec-violating code on an unambiguous rule** — truth-passRate is provably leaky, no
> convention needed. The frozen `stz-judge`, on the three truth-mixed pairs where that axis
> discriminates, picked the spec-correct (throwing) specimen **3/3** — flat sealed-rate selection
> cannot (scores both 1.0). → STZ's value = **selection-signal quality**; flat suite pass-rate is a
> poor signal; a **reasoning judge earns its cost** (contradicting FINDINGS' "judge adds nothing",
> only ever tested on truth-*tied* tiers). NB: NO overall judge "accuracy rate" is claimed — the
> verification probe was built from the judges' own cited bugs (circular); other judge wins
> (`7`=Sun, `a/n`, list+step) are spec-gap-assisted and discounted. **Highest-value next lever = a
> SHARPER sealed suite** (add malformed-rejection + the surfaced bug classes), not the 0.8.0 loop —
> test judge-augmented selection against a hardened suite before building the loop.

**Status date:** 2026-06-22. Branch: `experiments/naive-vs-stz-pilots` (committed, not pushed).
Author attribution: git `user.name = dr-robert-li` (global). Prompt caching: confirmed live
(~98% cache-read on long sessions — verified via transcript `cache_read_input_tokens`).

---

## TL;DR — where we are

Two pilots built & committed under `experiments/`:
- **slugify-pilot** (easy/ambiguous task): STZ ≈ naive. Errors were convention-only (NFD vs
  NFKD); a *blind* sealed suite rightly won't enforce a convention → nothing to select on.
  See `slugify-pilot/DRY-RUN-FINDINGS.md`.
- **cron-pilot** (`nextRun`, hard task, genuine bugs): on STZ's own metric (**absolute
  correctness**, README §47–50 discloses the token premium is by design), **STZ ≥ naive 3/3
  seeds** (truth 1.000 vs 0.977; seed-3 avoids a naive `*/0` hang). See `cron-pilot/FINDINGS.md`.

**Honest qualifiers (still open):** the cron edge is small (~one feature), the recurring driver
(`7`-as-Sunday) is **spec-gap-assisted** (vague brief said "0–6"), and A≈C (judge added nothing
— top-sealed tier was truth-tied). **Token accounting:** per-token, naive is 2–4× cheaper — but
that's the disclosed tradeoff, NOT the metric STZ optimizes.

## The decision THIS next step informs

The cron result is confounded two ways we haven't separated:
1. Is STZ's edge the **selection signal** (blind sealed suite catches the bug) or just **drawing
   N samples**? → needs a **best-of-4-naive control** (4 naive agents, naive picks by its own weak
   public suite).
2. Does **scaling N** (more Haiku draws, sealed-selected) **close the frontier gap** — i.e. can a
   weak model + good harness match Opus? → needs **Haiku best-of-N vs Opus best-of-1**.

**If Haiku best-of-N alone reaches frontier-truth, the expensive convergence-loop (ROADMAP 0.8.0)
is unnecessary** — more samples suffice (the slugify lesson: don't build baroque machinery a
cheaper thing matches). Build the loop only if best-of-N plateaus *below* frontier.

---

## ▶ NEXT STEP (CURRENT): build benchmark substrate + SWE-Bench pilot

> **UPDATE 2026-06-26 (latest) — BLIND iterate arm on cron: first clean result, sealed-steered
> convergence ruled out (budget-matched, recall-free).** After review ruled SWE-Bench structurally
> unable to decide this (asymmetric recall + issue-authored-suite = train-on-test), ran the blind
> iterate arm on the synthetic substrate where the sealed/truth split already exists and there is no
> fix to recall. best-of-N (N=4 fresh Haiku, B=89,403 tok) selects max-sealed c2 → truth 0.9767;
> iterate (start c3, 1 blind critic+reviser round, ≤B) reaches sealed 1.0 and stops → truth 0.9767.
> **Equal at 0.9767, both capped at 42/43 on the SAME sealed-blind case.** Iterate halts at sealed=1.0
> so extra budget is unusable. This EARNS two previously-asserted things: (1) the gradient EXISTS (the
> 42/43 residual a hardened suite did not express); (2) **sealed-steered** convergence cannot cross it
> at matched budget — the lever is sealed-signal quality, not rounds. **Scope:** this rules out the
> SEALED-STEERED loop only; the judge-steers-BEYOND-the-suite form (`cron-pilot/FINDINGS-CONTROLS-2.md`,
> frozen judge picked spec-correct 3/3) is UNTESTED and is the real open 0.8.0 question. Standing
> decision unchanged and now earned: sharpen the suite first; build a loop only if the judge-beyond-
> suite form crosses the gradient at equal budget. Detail: `swebench-pilot/PILOT-RESULTS-BLIND.md`,
> `PILOT-PREREG-BLIND.md`. (n=2 seeds, directional; one operator nudge that HELPED iterate, so the
> tie is robust; recall-free.)

> **UPDATE 2026-06-26 — SCALED pilot (batch-1 + iterate arm); STILL silent on 0.8.0.**
> Scaled to 10 instances + an iterate arm (subscription-billed in-session agents). What scaled
> cleanly: pipeline handles it; **mixed pools rare at N=4** (~4/10); **best-of-N-Haiku ≈
> frontier-Opus-best-of-1 in aggregate (6/10 each) but COMPLEMENTARY** (different instances —
> 2 Haiku-only, 2 Opus-only, 4 both, 2 neither). The iterate arm raw outcome (1 round closed 3/4
> gap instances incl. one neither) **LOOKS pro-0.8.0 but is NOT evidence** — corrected on review,
> triple-confounded: (1) the critic was **not blind to FAIL_TO_PASS** — candidates passed 100% of
> PASS_TO_PASS, so a real loop would STOP and never iterate; the "it's wrong" signal came from the
> operator peeking at held-out F2P; (2) operator-authored pointed questions encoded the diagnosis;
> (3) training recall (critics cited "upstream pytest 7.2.0"; iterate is the most recall-sensitive
> arm). **Symmetric-error discipline:** a confounded run leaning pro-build is the same mistake as
> one leaning anti-build — refuse both. **0.8.0 deferral continues to rest on cron/hexcolor, not
> this run.** Genuine seed: these models critique a concrete wrong candidate better than they
> generate from scratch — interesting but confounded; needs a BLIND iterate arm (critic sees only
> issue+candidate+code+a SEALED verdict, never F2P; note P2P=100% instances give the loop nothing
> to fire on → need a sealed held-out signal SWE-Bench doesn't provide; no pointed questions;
> control recall; compare at equal token budget). Detail: `swebench-pilot/PILOT-RESULTS-SCALED.md`.

> **UPDATE 2026-06-25 (latest) — A/B/C pilot RAN; it does NOT update the 0.8.0 decision.**
> Full pipeline executed on aarch64 (filter network-bound → hermetic pytest instances; N=4 blind
> Haiku pool per instance → grade whole pool via official harness → selectors A=STZ gate+judge,
> B=naive max-PASS_TO_PASS, C=Opus best-of-1). Numbers (A=0.667, B=0.444, C=0.667) LOOK like the
> "don't build 0.8.0" branch but are **not evidence** for it (post-review):
>   • **A>B is tautological** — B selects by PASS_TO_PASS, which is held-out-blind to the fix by
>     construction (bug test is in FAIL_TO_PASS); B can never see a fix on any instance.
>   • **A≈C is n=1** — A,C forced equal on the all-pass(8399) and all-fail(10356) pools; only the
>     single mixed pool (6197) could diverge.
>   • **10356** (correctness gradient missed by best-of-4 AND Opus-best-of-1) is the exact regime
>     0.8.0 targets, and the pilot is **silent** on whether *iteration* would solve it.
> **0.8.0 deferral continues to rest on cron/hexcolor, NOT this run.** What this run DID establish:
> the substrate + A/B/C pipeline work end-to-end (durable), and **mixed pools are rare at N=4 (1/3,
> only after hunting medium-hard)** — the most decision-relevant finding. A conclusive pilot needs
> ≥5–10 mixed pools with 4 substantive candidates each, INCLUDING an iterate-on-an-all-fail-pool
> arm to actually test 0.8.0 (scope/spend escalation — user choice). Full write-up + honest caveats:
> `swebench-pilot/PILOT-RESULTS.md`, `PILOT-PREREG.md`, `results/`.

> **UPDATE 2026-06-25 (earlier) — pilot UNBLOCKED on this aarch64 host.** The ARM blocker is solved
> without leaving SWE-Bench: **prebuilt arm64 eval images exist** (Epoch AI — all 500 Verified
> instances). Proven end-to-end here on `psf__requests-1142`: the arm64 image runs natively and
> ships the pinned **Python 3.9.20** + deps; gold patch → adapter `resolved=true` (6/6); base (no
> gold) → `resolved=false`, correct F2P failure isolated. Both blockers below are dead. **Run the
> pilot on SWE-bench Verified** using Epoch arm64 images (or the epoch-research fork /
> `swe-bench-fast`, which feed a normal `report.json` → `eval-adapter.mjs report`). The host-x86
> conclusion below is SUPERSEDED. Detail + runbook + caveat: `swebench-pilot/ENV-FINDINGS.md`
> (✅ RESOLVED section).

> **UPDATE 2026-06-25 — substrate DONE + validated; pilot BLOCKED on this host.** *(superseded by
> the UNBLOCKED update above — kept for the chain.)*
> Steps 1–2 complete and committed: HANDOFF decision locked, and the pytest eval adapter
> (`swebench-pilot/eval-adapter.mjs`, dual-mode, 16/16 tests) is built and **validated against a
> real SWE-Bench Lite instance** (`pallets__flask-4045` + `astropy__astropy-12907` node-ids).
> `swebench 4.1.0` installed; the official harness was driven on a gold patch. **Step 3 (the
> pilot) cannot run on THIS host** — two orthogonal environment blockers, NOT adapter defects
> (the adapter surfaced both as clean DNF/ERROR with cause):
>   1. official eval images are **x86_64**; this host is **aarch64** (no qemu) → `exec format error`;
>   2. native ARM provisioning needs the instance's pinned **Python 3.9/3.10 + deps**, unsatisfiable
>      on the host's Python 3.13 (werkzeug/pytest/`ast.Str` pin cascade).
> **RESUME ON AN x86_64 HOST**: there the harness builds/pulls pinned per-instance images and emits
> `report.json` → `node eval-adapter.mjs report ...`, fully faithful, zero hand-pinning. Do NOT
> register qemu binfmt or build arm64 images on the shared GPU host. Full root-cause +
> reproduction: `swebench-pilot/ENV-FINDINGS.md`. Remaining work is host/provisioning, not code.

**DECISION (locked 2026-06-22, 3 models converged — GPT-5.5, Opus 4.8, Gemini 3.1 Pro):**
**Do NOT build the 0.8.0 convergence loop next.** The pilots (cron/ipv4/hexcolor + controls)
established ONE durable advantage — **selection-signal quality** (a reasoning judge / sharp sealed
suite picks the spec-correct specimen where flat pass-rate ties). They did NOT demonstrate the
predicate that justifies iterative convergence: **a correctness gradient a hardened sealed suite
provably cannot express.** Evidence supports "better oracle + better selection" over "more rounds."
Greenlight 0.8.0 ONLY IF the SWE-Bench pilot shows best-of-N plateaus below frontier AND scaling N
does not close the gap.

**What unlocks the decisive test:** a Python/pytest evaluation adapter that conforms to the
existing deterministic bridge interface (`stz bridge eval`'s `{passed,total,passRate}` contract).
SWE-Bench oracles are repo-native pytest suites; without this adapter we cannot run the benchmark
faithfully to the field's norms (the whole justification — "absolute better outcomes demonstrable
on SWE-Bench").

> **Codebase hygiene (user guidance 2026-06-22):** keep ALL of this in `experiments/` — do NOT
> modify production `src/`. The adapter is a pilot instrument under `experiments/swebench-pilot/`
> that *mirrors* the bridge `{passed,total,passRate}` contract (drop-in compatible: `resolved`
> maps to `passRate===1`), exactly as cron/ipv4/hexcolor pilots carry their own instruments.

### Build order (this milestone)
1. **[done above]** Patch this HANDOFF — supersede the controls NEXT STEP (below, archived).
2. **Pytest eval adapter** under `experiments/swebench-pilot/`, a sibling PRODUCER of the
   `{passed,total,passRate}` contract (NOT routed through `fullEval` — coverage/mutation are
   JS-only & meaningless for a Python patch; `detectHacks` is JS-pattern-only). Oracle =
   SWE-Bench `resolved`: **ALL FAIL_TO_PASS pass AND ALL PASS_TO_PASS still pass**, running ONLY
   those named tests → mapped to `passRate===1` so the existing gate semantics carry over.
   **Environment provisioning (decided): drive the official `swebench` harness** (Docker per
   instance → `report.json` with resolved status) and parse that; ALSO support a direct
   named-pytest mode for an already-provisioned cwd. Rolling our own grading is rejected — it
   reintroduces the spec-gap-assisted-win confound cron/hexcolor fought.
3. **SWE-Bench Verified/Lite pilot**, 3 conditions (criteria pre-registered below).

### Pre-registered pilot decision criteria (commit BEFORE running — Opus thread mandate)
Metric = **instance resolved-rate** (fraction of pilot instances where the selected patch is
`resolved`). N small (Lite/Verified subset, e.g. 10–25 instances), report n explicitly.
Conditions: **(A) STZ best-of-N sealed-selected** · **(B) naive best-of-N public-selected** ·
**(C) frontier best-of-1** (or published frontier baseline).
| outcome | reading | action |
|---------|---------|--------|
| A resolved ≈ C (frontier) | weak model + harness reaches frontier via samples | STZ value = selection signal; **0.8.0 loop NOT needed** — scale samples |
| A resolved > B, same N | edge is the selection oracle, not the draws | core STZ claim confirmed |
| A plateaus < C AND N-scaling doesn't close it | samples insufficient | **greenlight 0.8.0**; spec/build, test at equal token budget |
| A ≈ B | selection adds nothing here | escalate to harder/less spec-gap task before any build |

**Discipline carried over (non-negotiable):** (a) **Blindness** — specimens NEVER see the
FAIL_TO_PASS set (held-out oracle) or PASS_TO_PASS internals; they get the issue text only.
(b) **No judge "accuracy rate" claim** — any verification probe built from a judge's own cited
bugs is circular; report selection wins, not an oracle-accuracy number. (c) Separate genuine
correctness from spec-gap-assisted wins.

---

## ⛔ ARCHIVED (DONE / superseded) — controls NEXT STEP

> Superseded by the section above. The three UPDATE blocks at the top of this file record what the
> controls + disambiguating + hexcolor runs found; this block is kept for the decision chain only.
> **Do not execute it** — the decision it informed ("build the 0.8.0 loop?") is now answered
> "not yet; build the SWE-Bench substrate first."

### (archived) run 1 seed of the controls (~$5–10)

Cheap go/no-go before committing to 3 seeds or the convergence-loop build. Reuses the cron task
(already built + blind-sealed). One seed only.

### Assets to reuse (all exist)
- Contract handed to implementers: `cron-pilot/slice/CONTRACT-VAGUE.md`
- Public suite (B's signal): `cron-pilot/suites/cron.public.mjs`
- **Blind sealed suite (selection signal for A/C/best-of-N):** `cron-pilot/suites-v2/cron.sealed.mjs`
- **Truth oracle (grade only):** `cron-pilot/truth-suite/cron.truth.mjs`
- Existing seed-1 Haiku specimens (4) at `cron-pilot/runs/seed-1-haiku-vague/A/prototypes/specimen-{a,b,c,d}/index.mjs`
  — can be REUSED as part of the best-of-N pool (no need to respawn them).

### Conditions to produce (1 seed)
| label | agents | model | selection | dir |
|-------|--------|-------|-----------|-----|
| **best-of-N** | 8 specimens (reuse the 4 seed-1 + 4 new) | haiku | highest blind-sealed pass-rate | `cron-pilot/runs/control-seed-1/bestN/` |
| **best-of-4-naive** | 4 naive agents | haiku | naive picks highest **public** pass-rate | `cron-pilot/runs/control-seed-1/naive4/` |
| **frontier ref** | 2 specimens (best-of-1, take best) | opus (default) | highest blind-sealed | `cron-pilot/runs/control-seed-1/frontier/` |

### Procedure
1. `mkdir -p cron-pilot/runs/control-seed-1/{bestN,naive4,frontier}/specimen-{a..h}` (as needed).
2. **best-of-N (4 new Haiku specimens)** — spawn `stz-specimen`, `model: haiku`. Each READS ONLY
   `slice/CONTRACT-VAGUE.md` + `suites/cron.public.mjs`; must NOT read `slice/CONTRACT.md`,
   `suites-v2/`, `truth-suite/`. Output `index.mjs` exporting `nextRun(expr, after)`, UTC, Node
   built-ins. Vary strategy hints (minute-step / component-carry / day-scan / set-iterate) for
   diversity. (Same prompt shape as the committed seed-1 specimens — see git history of those
   files or the prior session's agent calls.)
3. **best-of-4-naive (4 Haiku)** — spawn plain `claude` agents, `model: haiku`, naive framing:
   "make my test suite pass" pointing ONLY at `suites/cron.public.mjs`; iterate ≤4 rounds. Naive
   selects the winner by **public** pass-rate (NOT sealed — that's the point).
4. **frontier (2 Opus)** — same specimen prompt as step 2 but default (Opus) model.
5. **Score** every produced `index.mjs` on blind-sealed + truth. Reuse the scorer pattern (a
   prior version is at `$CLAUDE_JOB_DIR/tmp/score.mjs` if still present; else inline:
   `node <suite> <abs-impl>` → parse the final JSON line's `passRate`). Capture `subagent_tokens`
   per agent from each Agent result for cost.
6. Record one row per condition: condition, winner truth-passRate, total tokens, winner sealed-rate.

### Decision criteria (pre-commit, apply after the 1 seed)
- **best-of-N (sealed-select) truth ≈ frontier truth** → weak-model-+-harness reaches frontier on
  this task via samples alone. STZ's value = the **selection signal**, not iteration → the
  convergence loop is likely unnecessary; scale samples instead.
- **best-of-N > best-of-4-naive** (both draw 4+; only the SELECTION suite differs) → confirms the
  edge is the **blind sealed suite**, not the N draws. This is the core STZ claim.
- **best-of-N plateaus < frontier** → samples aren't enough; the convergence loop (pressure-log
  steering, ROADMAP 0.8.0) earns its cost — proceed to spec/build it, test at equal token budget.
- **best-of-N ≈ best-of-4-naive** → selection signal adds nothing here; STZ's tournament is
  theatre on this task → escalate to a harder/less spec-gap-assisted task before any build.

n=1 is directional only. If signal is promising, expand to 3 seeds (~$15–30) before building.

---

## Guardrails / gotchas (learned the hard way)

- **Blindness = no leakage.** Specimens/naive never see `suites-v2/` or `truth-suite/`. The sealed
  suite was authored by `stz-test-author` blind to truth — do NOT "improve" sealed by copying
  cases you saw fail on truth (train-on-test; voids the result).
- **Truth oracle caveat:** the `7`-as-Sunday penalty is partly a convention the vague brief
  under-specified. When interpreting, separate genuine bugs (step-0 hang, leap, rollover) from
  spec-gap cases.
- **Strict gate degenerates** at `passRate===1` (all-pass = no discrimination, or all-fail = DNF).
  Select by **rank** (highest sealed pass-rate), not a hard 1.0 gate.
- **Mutation-survival is uninformative** for this code (numeric mutators vs string/date logic).
  Primary metric = truth-passRate.
- **Brute-force specimens are slow** on the truth suite's multi-year Feb-29 case — use a ≥60s
  per-call timeout when scoring; a hang on `*/0` is itself a real defect (score DNF).
- **Token capture works** via `subagent_tokens` in each Agent tool result — sum per condition.
- Don't trust the Console "not using caching" banner — caching is confirmed live (~98%).

## Inventory
- `slugify-pilot/` — instrument + DRY-RUN-FINDINGS.md (STZ ≈ naive, easy task).
- `cron-pilot/` — task, suites, blind sealed, 3 seeds, FINDINGS.md (STZ ≥ naive, hard task).
- `cron-pilot/seal.mjs` — standalone sealer (`node seal.mjs verify <dir>`).
- Branch `experiments/naive-vs-stz-pilots`, commit `a846c02` (68 files). Not pushed.
- ROADMAP 0.8.0 convergence-loop design: `docs/ROADMAP.md` §239–625 (planned, not built).
