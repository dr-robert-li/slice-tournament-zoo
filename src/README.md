# Module map (`src/`)

Production spine: `types.ts` (schema), `taxonomy.ts` (tree and frontmatter),
`state.ts` (checkpoint and recovery), `grpo.ts`, `selection.ts`,
`hack-detector.ts`, `escalation.ts`, `budget.ts`, `cost-tracker.ts`,
`pressure.ts`, `specdiff.ts`, `eval-runner.ts` (real tests, coverage, mutation),
`project.ts` (the project DAG driver), and `bridge.ts` (the in-session CLI,
per-slice and project subcommands).

The `mock/` subfolder is the no-network testing harness (the `stz run` demo):
its orchestrator, the model-layer seam, and the deterministic mock. Not part of
the production path — see [`mock/`](https://github.com/dr-robert-li/slice-tournament-zoo/tree/main/src/mock).

## Further reading

- The requirement-to-test mapping is in [`docs/TESTPLAN.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/TESTPLAN.md).
- What is built, deferred, and planned next is in [`docs/ROADMAP.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/ROADMAP.md).
- Running the engine locally / in CI: [`docs/development/local-and-testing.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/development/local-and-testing.md).
- The deterministic bridge CLI: [`docs/development/bridge-cli.md`](https://github.com/dr-robert-li/slice-tournament-zoo/blob/main/docs/development/bridge-cli.md).
