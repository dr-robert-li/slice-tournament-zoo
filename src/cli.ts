/**
 * STZ CLI (F17). `npx stz <command>`.
 *
 *   stz init [dir]        scaffold the .stz/ taxonomy + AGENTS.md
 *   stz run  [dir]        run the bundled demo slice through the mock pipeline
 *   stz help
 */
import { join } from "node:path";
import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { scaffold, writeDoc, STZ_DIR, TIERS } from "./taxonomy.js";
import { runSlice } from "./mock/orchestrator.js";
import { runBridge } from "./bridge.js";
import { MockModelLayer, defaultMockConfig } from "./mock/mock.js";
import type { SliceManifest } from "./types.js";

const AGENTS_MD = `# AGENTS.md — STZ table of contents

This repo is managed by **slice-tournament-zoo (STZ)**. Progressive disclosure:
load the tier summary you need, fetch full bodies only on named-anchor reference.

| Tier | Purpose |
|------|---------|
| \`.stz/00-intent/\`    | elicitation transcript, questionnaire, done-predicates |
| \`.stz/10-research/\`  | external/internal research, validated claims, spikes |
| \`.stz/20-standards/\` | conventions (versioned), architecture decisions |
| \`.stz/30-tests/\`     | test plan, rubric, **sealed held-out suite** (read-only) |
| \`.stz/40-slices/\`    | per-slice manifest, plan, prototypes, tournament, spec-diff |
| \`.stz/50-pressure/\`  | culled specimens' diffs + critiques (the pressure log) |
| \`.stz/90-audit/\`     | journal, call ledger, cost, state.json |

Vocabulary (the zoo metaphor): *specimens* = agents, *environment* = eval
suite + conventions, *propagation* = winner's pattern carried forward,
*selection pressure* = the culling mechanism, *pressure log* = the artifact.
`;

const DEMO_MANIFEST: SliceManifest = {
  id: "slice-01",
  name: "demo-slice",
  contract: "export function run(input: Request): Result",
  donePredicates: [
    { id: "schema", expr: "returns_schema(Result)", kind: "schema" },
    { id: "latency", expr: "p95_latency_ms < 200", kind: "metric" },
  ],
  traceTier: "minimal",
  complexity: 2,
  dependsOn: [],
  judge: { votesPerPair: 8 },
  summary: "Demo slice exercising the full STZ pipeline against the mock model layer.",
};

async function cmdInit(dir: string): Promise<void> {
  const created = await scaffold(dir);
  await writeFile(join(dir, "AGENTS.md"), AGENTS_MD, "utf8");
  await writeDoc(dir, join("00-intent", "bootstrap.md"), {
    frontmatter: { summary: "Bootstrap (slice-00): hand-written minimal kernel; STZ produces itself from slice-01 (R7/F18)." },
    body: "# Bootstrap\n\nSlice-00 is this kernel. STZ dogfoods from slice-01 onward.\n",
  });
  console.log(`Scaffolded ${STZ_DIR}/ (${TIERS.length} tiers, ${created.length} created) + AGENTS.md at ${dir}`);
}

async function cmdRun(dir: string): Promise<void> {
  if (!existsSync(join(dir, STZ_DIR))) await scaffold(dir);
  const model = new MockModelLayer(defaultMockConfig());
  const result = await runSlice({ root: dir, manifest: DEMO_MANIFEST, model, n: 4, log: console.log });
  console.log("\n── result ──");
  console.log(`winner: ${result.winner ? "specimen-" + result.winner : "none (halted)"}`);
  console.log(`faithful (no planned-but-missing): ${result.faithful}`);
  console.log(`rounds: ${result.rounds}`);
  console.log(`artifacts: ${result.artifacts.length} under ${STZ_DIR}/`);
}

const LOGO = String.raw`
  ██████╗  ████████╗ ███████╗
 ██╔════╝  ╚══██╔══╝ ╚══███╔╝
 ╚█████╗      ██║      ███╔╝
  ╚═══██╗     ██║     ███╔╝
 ██████╔╝     ██║    ███████╗
 ╚═════╝      ╚═╝    ╚══════╝
`;

function cmdHelp(): void {
  console.log(LOGO);
  console.log(`slice-tournament-zoo: adversarial slice tournaments with a replayable audit trail

Usage:
  stz init [dir]       scaffold the .stz/ taxonomy + AGENTS.md (default: cwd)
  stz run  [dir]       run the bundled demo slice through the mock pipeline
  stz bridge <cmd>     deterministic orchestration bridge (used by the /stz:* commands)
  stz help             show this help

In Claude Code, install the plugin and drive the full pipeline with /stz:new,
/stz:research, /stz:slice, /stz:pipeline, and friends. See the README.
`);
}

async function main(): Promise<void> {
  const [cmd, dirArg] = process.argv.slice(2);
  const dir = dirArg ?? process.cwd();
  switch (cmd) {
    case "init":
      await cmdInit(dir);
      break;
    case "run":
      await cmdRun(dir);
      break;
    case "bridge":
      // Deterministic orchestration bridge called by the /stz:run command
      // between Task-subagent spawns. Everything after "bridge" is its argv.
      await runBridge(process.argv.slice(3));
      break;
    case "help":
    case undefined:
      cmdHelp();
      break;
    default:
      console.error(`unknown command: ${cmd}\n`);
      cmdHelp();
      process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
