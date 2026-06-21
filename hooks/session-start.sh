#!/usr/bin/env bash
# STZ SessionStart hook. Injects the harness context so the orchestrator knows
# STZ is available and uses the zoo vocabulary consistently (N12). Prints to
# stdout, which Claude Code folds into the session context.
set -euo pipefail

# Only speak up if this project actually uses STZ (a .stz tree or the plugin).
if [ -d ".stz" ] || [ -f ".claude-plugin/plugin.json" ]; then
  cat <<'CTX'
```
  ██████╗  ████████╗ ███████╗
 ██╔════╝  ╚══██╔══╝ ╚══███╔╝
 ╚█████╗      ██║      ███╔╝
  ╚═══██╗     ██║     ███╔╝
 ██████╔╝     ██║    ███████╗
 ╚═════╝      ╚═╝    ╚══════╝
```
# slice-tournament-zoo (STZ) is active

Run a slice as an in-session tournament with: /stz:run [slice-id]

You are the orchestrator. Spawn specimen/judge/test-author/documenter work as
parallel Task subagents; call the `stz bridge` CLI for every deterministic
decision (eval gate, hack detection, GRPO, selection, audit). Never tally or
rank in your own head.

Vocabulary (use consistently): specimens = the competing agents; environment =
sealed suite + conventions; selection pressure = the culling mechanism;
pressure log = the file artifact of culled specimens; propagation = the winner's
pattern carried forward.

Audit tree lives under .stz/ (00-intent .. 90-audit). Every decision is
replayable from the markdown tree + state.json.
CTX
fi
