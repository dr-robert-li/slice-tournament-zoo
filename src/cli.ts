/**
 * STZ CLI (F17). `npx stz <command>`.
 *
 *   stz init [dir]        scaffold the .stz/ taxonomy + AGENTS.md
 *   stz run  [dir]        run the bundled demo slice through the mock pipeline
 *   stz update            check npm for a newer release + channel drift (F19)
 *   stz migrate [dir]     bring an existing .stz/ tree up to the current schema (F19)
 *   stz --version
 *   stz help
 */
import { join } from "node:path";
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { scaffold, writeDoc, STZ_DIR, TIERS } from "./taxonomy.js";
import { runSlice } from "./mock/orchestrator.js";
import { runBridge } from "./bridge.js";
import { MockModelLayer, defaultMockConfig } from "./mock/mock.js";
import type { SliceManifest } from "./types.js";
import { STZ_VERSION } from "./version.js";
import { checkLatest, buildVerdict, formatVerdict } from "./update.js";
import { writeManifest, migrate } from "./migrate.js";

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
  await writeManifest(dir); // F19: stamp the tree so `stz migrate` can detect drift later
  await writeFile(join(dir, "AGENTS.md"), AGENTS_MD, "utf8");
  await writeDoc(dir, join("00-intent", "bootstrap.md"), {
    frontmatter: { summary: "Bootstrap (slice-00): hand-written minimal kernel; STZ produces itself from slice-01 (R7/F18)." },
    body: "# Bootstrap\n\nSlice-00 is this kernel. STZ dogfoods from slice-01 onward.\n",
  });
  console.log(`Scaffolded ${STZ_DIR}/ (${TIERS.length} tiers, ${created.length} created) + AGENTS.md at ${dir}`);
}

/**
 * Discover the Claude Code plugin's bundled engine version, for drift detection
 * (F19). The plugin sets `CLAUDE_PLUGIN_ROOT`; fall back to a manifest in cwd so
 * a developer running inside the repo still sees drift. Returns null when no
 * plugin manifest is reachable (a pure npm-CLI user has no second channel).
 */
async function readPluginVersion(dir: string): Promise<string | null> {
  const roots = [process.env.CLAUDE_PLUGIN_ROOT, dir].filter(Boolean) as string[];
  for (const root of roots) {
    const p = join(root, ".claude-plugin", "plugin.json");
    if (!existsSync(p)) continue;
    try {
      const manifest = JSON.parse(await readFile(p, "utf8")) as { version?: unknown };
      if (typeof manifest.version === "string") return manifest.version;
    } catch {
      // Unreadable/malformed manifest -> treat as "no plugin info", not a crash.
    }
  }
  return null;
}

async function cmdUpdate(): Promise<void> {
  const asJson = process.argv.includes("--check") || process.argv.includes("--json");
  const latest = await checkLatest();
  // Plugin discovery uses the working directory (and CLAUDE_PLUGIN_ROOT), not a
  // positional — `update` takes flags, not a dir, so the operator's cwd is the
  // right place to look for a co-located plugin manifest.
  const pluginVersion = await readPluginVersion(process.cwd());
  const verdict = buildVerdict({
    installed: STZ_VERSION,
    latest: latest.version,
    pluginVersion,
    reason: latest.ok ? undefined : latest.reason,
  });
  if (asJson) {
    console.log(JSON.stringify(verdict, null, 2));
  } else {
    console.log(formatVerdict(verdict));
  }
  // Exit non-zero when action is required, so scripts/CI can gate on it.
  if (verdict.stale || verdict.drift) process.exitCode = 1;
}

async function cmdMigrate(dir: string): Promise<void> {
  const noBackup = process.argv.includes("--no-backup");
  const report = await migrate(dir, { backup: !noBackup });
  if (report.upToDate) {
    console.log(`${STZ_DIR}/ already at schema ${report.toSchema} — nothing to migrate.`);
    return;
  }
  console.log(
    `Migrated ${STZ_DIR}/ schema ${report.fromSchema} → ${report.toSchema} ` +
      `(${report.created.length} tier(s) created).`,
  );
  if (report.backedUpTo) console.log(`Backup of the prior tree: ${report.backedUpTo}`);
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
  stz update [--check] check npm for a newer release + plugin/CLI drift
  stz migrate [dir]    bring an existing .stz/ tree up to the current schema
  stz bridge <cmd>     deterministic orchestration bridge (used by the /stz:* commands)
  stz --version        print the installed version
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
    case "update":
      await cmdUpdate();
      break;
    case "migrate":
      await cmdMigrate(dir);
      break;
    case "--version":
    case "-v":
    case "version":
      console.log(STZ_VERSION);
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
