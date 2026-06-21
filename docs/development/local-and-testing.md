# Local development & testing

Running STZ's deterministic engine without Claude Code — for contributors,
CI, and quick smoke tests. The operator-facing install and usage live in the
[top-level README](../../README.md).

## As a library / local CLI only

If you only want the deterministic engine and the mock pipeline:

```bash
git clone https://github.com/dr-robert-li/slice-tournament-zoo
cd slice-tournament-zoo
npm install
npm test            # 93 deterministic tests
npm run typecheck
```

## Mock run (testing only, no network)

A self-contained mock drives the whole pipeline with no API keys, network, or
subagents — handy as a fast smoke test of the deterministic spine. It is a
testing aid, not the production path. See [`src/mock/`](../../src/mock).

```bash
stz run <dir>       # drive the demo slice end to end against the mock model
```

The standalone mock demo runs all eight phases inside a single slice for a
self-contained, no-network smoke test. The real in-session flow is the two-level
split described in the README's pipeline section.

## CI-style local check (no Claude Code)

```bash
npm test && npm run typecheck && stz run /tmp/stz-smoke
```
