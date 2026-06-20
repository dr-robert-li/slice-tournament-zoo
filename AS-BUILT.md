# STZ — As-Built Note (intent vs. as-built, applied to this kernel)

In the spirit of F13, this note states what the CLAUDE.md design intends vs.
what this commit actually delivers, so "to the best of my ability" is auditable.

## What this is

A **slice-00 kernel** (per F18 / R7: the hand-written minimal kernel STZ would
then dogfood from). It implements the **deterministic, auditable spine** of the
design for real and fully tested, and puts the non-deterministic model layer
behind thin interfaces with a deterministic mock so the entire pipeline runs
end-to-end without a network call.

Scope was chosen deliberately: the full roadmap (§6) is ~30 days. Depth on the
spine that every other component depends on beats a broad layer of hollow stubs.

## Real and fully tested (the spine)

- **Data model + taxonomy** (F4/F5/N2): `state.json` schema, the 13-tier `.stz/`
  markdown tree, frontmatter (de)serializer with summary-field progressive
  disclosure. Round-trip + scaffold tested.
- **GRPO advantage** (F8): exact `(rᵢ−μ)/(σ+ε)`, ε-guard on the all-equal edge.
- **Two-stage selection** (F7): eval-gate elimination → pairwise win-count
  ranking (the plain deterministic aggregation, V votes/pair). GRPO advantage is
  computed over the **whole specimen group** (incl. gate-eliminated specimens)
  so the pressure log can weight losers' diffs (F8/F9). Tie-breaks deterministic.
- **Hack-pattern detector** (F10/L3): line-scan for test-skip, assertion
  mutation, network-bypass, fixture-keyed branching, hardcoded sentinels — with
  remediation strings re-injected on replan. No-false-positive tested.
- **Bounded escalation FSM** (F14, the R1 headline mitigation): 1 retry → 1
  replan → halt. The ceiling is proven to hold and halt is absorbing.
- **Complexity→budget allocator + calibration** (F15/N5): monotonic, pool-capped.
  The hard per-slice cap is **enforced** at the one metering point (`charge()`):
  a would-be overrun throws `BudgetExceededError` (R3 kill-switch), not merely
  tracked. Tested by running a slice against a deliberately tiny pool.
- **Cost/call ledger** (N5/N6): JSONL, replay round-trip.
- **State checkpoint + crash recovery** (F16): resume the interrupted phase.
- **Pressure log + PDR top-K refinement** (F9).
- **Spec-diff** (F13): structural intent vs as-built, faithfulness check.
- **Orchestrator** (F1): sequences all 8 phases, checkpoints at every boundary,
  charges the budget per call, runs the tournament, and materializes the full
  audit tree. E2E tested on both the **success path** and the **failure path**
  (no passers → retry → replan → halt + structured failure report).
- **CLI** (F17): `stz init` / `stz run`.

## Behind interfaces, mocked (not built — see `src/llm/interfaces.ts`)

These are faithful seams with a deterministic mock; a live impl drops in without
touching the tested spine. The mock EvalRunner still runs the **real**
hack-detector, so the anti-hacking layer is exercised for real.

- Live Claude Code / Codex **specimen / judge / test-author / documenter**
  subagent calls (§3 Generative AI Layer).
- **Python eval drivers**: Hypothesis property-based generators, mutation
  testing (mutmut/Stryker), coverage (F7/F11) — `EvalResult` is real, the runner
  that produces it is mocked.
- **git worktrees** per specimen (F6) → stood in by `prototypes/specimen-X/`
  directories. Per-worktree **ephemeral observability stacks** — not spun up.
- **Local embeddings / cross-slice RAG** (N2/R4) — not built.
- **L1/L2 enforcement** via git read-only attributes + pre-commit hook — the
  sealed suite is written to `30-tests/held-out/` and only loaded by the judge
  seam, but OS-level read-only attribution is not applied.
- Inoculation prompting text (F10/L4) — belongs in live system prompts; n/a to mock.

## Honest spec-diff for this kernel

- **Delivered as planned:** the entire deterministic spine + 8-phase orchestration
  + CLI + audit trail, all tested.
- **Planned but deferred (documented, not missing-by-accident):** the live model
  layer and the Python/observability/RAG/worktree infrastructure above — every
  one has a real interface seam.
- **Built beyond the literal plan:** a deterministic mock model layer and a
  66-test suite that proves the spine, plus this audit note.
