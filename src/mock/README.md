# Mock testing harness

This folder holds the **deterministic mock run** — a self-contained, no-network
demo of the STZ pipeline. It is a testing and illustration aid, not part of the
production path. The production harness runs in-session through the `/stz:*`
commands and the `stz bridge` CLI (`src/bridge.ts`, `src/project.ts`); none of
those depend on anything in this folder.

## What is here

- `orchestrator.ts` — a single-process pipeline that drives one slice through all
  eight phases against a fake model layer. Used only by `stz run` and by
  `test/orchestrator.test.ts`.
- `interfaces.ts` — the model-layer seam (`Specimen`, `Judge`, `TestAuthor`,
  `Documenter`, `ModelLayer`). A live TypeScript model implementation would
  implement these; today only the mock does.
- `mock.ts` — the deterministic `MockModelLayer`. Specimen quality is configured,
  not sampled, so every run is reproducible (N6). The mock eval runner still runs
  the **real** hack-detector, so the anti-reward-hacking layer is exercised for
  real even though the model is fake.

## Run it

```bash
stz run <dir>     # or: node bin/stz.mjs run <dir>
```

This drives the demo slice end to end: four specimens compete, a test-skipping
specimen is disqualified by the hack-detector, a GRPO-weighted winner is chosen,
and the full `.stz/` audit tree is written under `<dir>`. No API keys, no
network, no subagents.

## Why it exists

The mock proves the deterministic spine (taxonomy, state, selection, GRPO,
escalation, budget, pressure log, spec-diff, audit) end to end without spending
tokens. The same spine powers the real in-session tournament; the only thing the
mock replaces is the model layer. It is covered by `test/orchestrator.test.ts`
(success path, bounded-escalation failure path, budget kill-switch, determinism,
anti-hacking integration).
