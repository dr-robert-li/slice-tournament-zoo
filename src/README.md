# Module map (`src/`)

Production spine: `types.ts` (schema), `taxonomy.ts` (tree and frontmatter),
`state.ts` (checkpoint and recovery), `grpo.ts`, `selection.ts`,
`hack-detector.ts`, `escalation.ts`, `budget.ts`, `cost-tracker.ts`,
`pressure.ts`, `specdiff.ts`, `eval-runner.ts` (real tests, coverage, mutation),
`project.ts` (the project DAG driver), and `bridge.ts` (the in-session CLI,
per-slice and project subcommands).

The `mock/` subfolder is the no-network testing harness (the `stz run` demo):
its orchestrator, the model-layer seam, and the deterministic mock. Not part of
the production path — see [`mock/`](./mock).

## Further reading

- The requirement-to-test mapping is in [`docs/TESTPLAN.md`](../docs/TESTPLAN.md).
- What is real versus deferred is in [`docs/AS-BUILT.md`](../docs/AS-BUILT.md).
- Running the engine locally / in CI: [`docs/development/local-and-testing.md`](../docs/development/local-and-testing.md).
- The deterministic bridge CLI: [`docs/development/bridge-cli.md`](../docs/development/bridge-cli.md).
