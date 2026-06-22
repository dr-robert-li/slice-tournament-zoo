# Contributing to slice-tournament-zoo (STZ)

Thanks for your interest in STZ. This guide covers how to get set up, the
architecture you need to hold in your head, and the bar for a change to land.

## Getting set up

Requirements: Node.js 20+. No database, no API keys for the deterministic engine.

```bash
git clone https://github.com/dr-robert-li/slice-tournament-zoo
cd slice-tournament-zoo
npm install
npm test            # the deterministic test suite (vitest)
npm run typecheck   # tsc --noEmit, must be clean
```

More detail on running the engine without Claude Code, the mock pipeline, and
CI-style checks is in
[`docs/development/local-and-testing.md`](./docs/development/local-and-testing.md).

## The one architectural rule

STZ has two halves, and the boundary between them is the most important thing to
respect:

- **The deterministic spine** (`src/`, minus `src/mock/`) — every *exact* decision:
  the eval gate, hack detection, GRPO, selection, state, the spec-diff, the audit
  trail. This is pure, replayable TypeScript, exercised by the test suite, and
  exposed as the `stz bridge` CLI (JSON in, JSON out). See
  [`src/README.md`](./src/README.md) for the module map and
  [`docs/development/bridge-cli.md`](./docs/development/bridge-cli.md) for the CLI.
- **The orchestration layer** (`commands/*.md`, `agents/*.md`) — the model-side
  work the Claude Code session drives: spawning specimens, judges, the documenter.
  This is prompt markdown, not code, and no test executes it.

**The rule:** if a decision involves a tally, a comparison, a ranking, or any
arithmetic, it belongs in the deterministic spine with a test — never in command
markdown. The command owns *spawn-and-collect*; the bridge owns *compute*. When in
doubt, push logic down into `src/` so it can be tested and replayed.

## Adding a bridge subcommand

1. Write the logic in the relevant `src/` module (e.g. `project.ts`, `specdiff.ts`)
   as a pure, exported function.
2. Add a thin handler in `src/bridge.ts` that reads `--flags`, calls the function,
   and `print()`s one JSON object. Register it in the `runBridge` switch.
3. Add tests next to the existing ones in `test/`.
4. If a `/stz:*` command should call it, update that command's markdown in
   `commands/`.

## Tests & quality bar

- `npm test` and `npm run typecheck` must both be green. CI runs them on Node 20
  and 22.
- New deterministic behaviour needs a test. Prefer tests that pin the *contract*
  (inputs → outputs), including the failure and edge cases.
- Changes to the markdown↔bridge contract (the JSON keys a command reads from a
  bridge call) can't be caught by a test — trace them by hand against the keys the
  bridge actually emits, and add a round-trip test on the bridge side where
  possible.
- Keep the evolutionary-zoo vocabulary consistent: *specimens*, *environment*,
  *propagation*, *selection pressure*, *pressure log*.

## Commits & pull requests

- Conventional-commit style subjects (`feat:`, `fix:`, `docs:`, `chore:`).
- One logical change per commit; keep the deterministic spine and its tests in the
  same commit.
- Update `CHANGELOG.md` (under `[Unreleased]` or the next version) and bump the
  version in `package.json`, `package-lock.json`, `.claude-plugin/plugin.json`, and
  `.claude-plugin/marketplace.json` together when releasing.
- Run the full suite before pushing.

## Releasing

Releases are tag-driven. Pushing a `v*` tag runs `.github/workflows/release.yml`,
which gates (typecheck + tests), publishes to npm with **`--provenance`** via
**Trusted Publishing** (OIDC — no token; the package requires 2FA and disallows
tokens), then opens the GitHub release from the matching `CHANGELOG` section.

```bash
# bump all four version sites + CHANGELOG, commit, then:
git tag -a vX.Y.Z -m "vX.Y.Z" && git push --follow-tags origin main
```

**Do CI/release-pipeline fixes on a short-lived branch and squash-merge into
`main` — never iterate the workflow with debug commits directly on the default
branch.** npm provenance immutably binds each release to the exact commit it was
built from; that commit is whatever the tag points to. If the tag lands on a
commit buried in a chain of `ci: fix… / ci: debug…` churn, you can't tidy the
history afterward without either orphaning the provenance commit (breaking the
badge) or leaving the release commit off `main`'s line. Squash-merge first, *then*
tag, so the release binds to one clean commit and `main` stays linear.

The tag must match `package.json` `version` (the workflow guards this) and must be
**annotated** (`git tag -a`) — `git push --follow-tags` skips lightweight tags.

## License

By contributing you agree your contributions are licensed under the project's
[Apache-2.0](./LICENSE) license.
