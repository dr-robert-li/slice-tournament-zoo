import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBridge } from "../src/bridge.js";
import { STZ_DIR } from "../src/taxonomy.js";
import { freshState, saveState, setPhaseStatus } from "../src/state.js";
import { PHASES, type RunConfig } from "../src/types.js";
import { normalizeRunConfig, defaultRunConfig, loadRunConfig } from "../src/project.js";

let root: string;
let captured: string;
const origWrite = process.stdout.write.bind(process.stdout);

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-project-"));
  captured = "";
  (process.stdout.write as unknown as (s: string) => boolean) = (s: string) => {
    captured += s;
    return true;
  };
});
afterEach(async () => {
  process.stdout.write = origWrite;
  await rm(root, { recursive: true, force: true });
});

function lastJSON<T>(): T {
  return JSON.parse(captured) as T;
}

async function initProject(): Promise<void> {
  const m = { schemaVersion: 1, projectId: "proj", name: "Demo", summary: "demo project", slices: [] };
  const p = join(root, "project.json");
  await writeFile(p, JSON.stringify(m), "utf8");
  await runBridge(["project-init", "--root", root, "--manifest", p]);
}

async function add(id: string, depends?: string): Promise<void> {
  captured = "";
  const args = ["slice-add", "--root", root, "--id", id, "--name", id];
  if (depends) args.push("--depends", depends);
  await runBridge(args);
}

async function status<T>(): Promise<T> {
  captured = "";
  await runBridge(["project-status", "--root", root]);
  return lastJSON<T>();
}

/** Mark a per-slice state.json fully done (or halted) to drive derivation. */
async function markSlice(id: string, opts: { halted?: boolean } = {}): Promise<void> {
  let s = freshState(id, 1);
  for (const ph of PHASES) s = setPhaseStatus(s, ph, "done");
  if (opts.halted) s.escalation = "halted";
  await saveState(root, s);
}

describe("project driver — multi-slice DAG (deterministic layer)", () => {
  it("init + slice-add + project-status gives a valid topological order", async () => {
    await initProject();
    await add("slice-01");
    await add("slice-02", "slice-01");
    await add("slice-03", "slice-01");
    // slicing not done yet → gated
    const gated = await status<{ blocked: boolean; next: string | null; order: string[] }>();
    expect(gated.blocked).toBe(true);
    expect(gated.next).toBeNull();
    expect(gated.order).toEqual(["slice-01", "slice-02", "slice-03"]); // 02,03 id-sorted after 01

    // open the gate
    captured = "";
    await runBridge(["project-phase", "--root", root, "--phase", "slice-disaggregation"]);
    const open = await status<{ blocked: boolean; next: string | null; frontier: string[] }>();
    expect(open.blocked).toBe(false);
    expect(open.next).toBe("slice-01"); // only 01 has no deps
    expect(open.frontier).toEqual(["slice-01"]);
  });

  it("frontier advances when a slice's state.json becomes done", async () => {
    await initProject();
    await add("slice-01");
    await add("slice-02", "slice-01");
    await add("slice-03", "slice-01");
    await runBridge(["project-phase", "--root", root, "--phase", "slice-disaggregation"]);
    await markSlice("slice-01");
    const s = await status<{ sliceStatus: Record<string, string>; frontier: string[]; next: string }>();
    expect(s.sliceStatus["slice-01"]).toBe("done");
    expect(s.frontier).toEqual(["slice-02", "slice-03"]);
    expect(s.next).toBe("slice-02"); // id tiebreak
  });

  it("project-phase marks status, writes a tier marker, appends an event", async () => {
    await initProject();
    captured = "";
    await runBridge(["project-phase", "--root", root, "--phase", "standards"]);
    expect(lastJSON<{ phase: string; status: string; tier: string }>()).toMatchObject({ phase: "standards", status: "done", tier: "20-standards" });
    const state = JSON.parse(await readFile(join(root, STZ_DIR, "90-audit/project-state.json"), "utf8"));
    expect(state.phaseStatus.standards).toBe("done");
    expect(state.events.some((e: { kind: string }) => e.kind === "phase-done")).toBe(true);
    const marker = await readFile(join(root, STZ_DIR, "20-standards/standards.md"), "utf8");
    expect(marker).toMatch(/standards/);
  });

  it("rejects an unknown project phase", async () => {
    await initProject();
    const code = process.exitCode;
    captured = "";
    await runBridge(["project-phase", "--root", root, "--phase", "not-a-phase"]);
    expect(process.exitCode).toBe(1);
    process.exitCode = code; // restore
  });

  it("detects a cycle in the DAG", async () => {
    await initProject();
    await add("slice-a", "slice-b");
    await add("slice-b", "slice-a");
    const code = process.exitCode;
    const s = await status<{ error: string; cycle: string[] }>();
    expect(s.error).toBe("cycle");
    expect(s.cycle.sort()).toEqual(["slice-a", "slice-b"]);
    process.exitCode = code;
  });

  it("detects a dangling dependency", async () => {
    await initProject();
    await add("slice-x", "slice-missing");
    const code = process.exitCode;
    const s = await status<{ error: string; from: string; missing: string }>();
    expect(s.error).toBe("dangling");
    expect(s.from).toBe("slice-x");
    expect(s.missing).toBe("slice-missing");
    process.exitCode = code;
  });

  it("excludes a halted slice from the frontier", async () => {
    await initProject();
    await add("slice-01");
    await add("slice-02", "slice-01");
    await runBridge(["project-phase", "--root", root, "--phase", "slice-disaggregation"]);
    await markSlice("slice-01", { halted: true });
    const s = await status<{ sliceStatus: Record<string, string>; frontier: string[] }>();
    expect(s.sliceStatus["slice-01"]).toBe("halted");
    // slice-02 depends on slice-01 which never reached done → not runnable
    expect(s.frontier).not.toContain("slice-02");
  });

  it("project-seed-slices writes manifests and seeds early phases done", async () => {
    await initProject();
    const dag = [
      { id: "slice-01", name: "first", contract: "f()", donePredicates: [], traceTier: "minimal", complexity: 2, dependsOn: [], judge: { votesPerPair: 2 }, summary: "s1" },
      { id: "slice-02", name: "second", contract: "g()", donePredicates: [], traceTier: "minimal", complexity: 1, dependsOn: ["slice-01"], judge: { votesPerPair: 2 }, summary: "s2" },
    ];
    const p = join(root, "dag.json");
    await writeFile(p, JSON.stringify(dag), "utf8");
    captured = "";
    await runBridge(["project-seed-slices", "--root", root, "--dag", p]);
    expect(lastJSON<{ created: string[] }>().created).toEqual(["slice-01", "slice-02"]);
    // seeded state: the four early phases are done, tournament half pending
    const st = JSON.parse(await readFile(join(root, STZ_DIR, "40-slices/slice-01/state.json"), "utf8"));
    expect(st.phaseStatus.elicitation).toBe("done");
    expect(st.phaseStatus.standards).toBe("done");
    expect(st.phaseStatus.tournament).toBe("pending");
    // and registered in the DAG with dependency preserved
    await runBridge(["project-phase", "--root", root, "--phase", "slice-disaggregation"]);
    const s = await status<{ order: string[]; next: string }>();
    expect(s.order).toEqual(["slice-01", "slice-02"]);
    expect(s.next).toBe("slice-01");
  });

  it("project-status carries computed progress totals + dashboard-ready slice rows", async () => {
    await initProject();
    await add("slice-01");
    await add("slice-02", "slice-01");
    await runBridge(["project-phase", "--root", root, "--phase", "slice-disaggregation"]);
    // stage slice-01 as a finished, faithful tournament with a winner
    await mkdir(join(root, STZ_DIR, "40-slices/slice-01/tournament"), { recursive: true });
    await writeFile(join(root, STZ_DIR, "40-slices/slice-01/tournament/judgment.json"), JSON.stringify({ winner: "c", ranking: ["c", "a"] }), "utf8");
    await writeFile(join(root, STZ_DIR, "40-slices/slice-01/spec-diff.md"), "---\nsummary: \"Spec diff slice-01: 0 missing, 0 added, 3 kept.\"\n---\n\nbody\n", "utf8");
    await markSlice("slice-01");

    const s = await status<{
      progress: { phases: { done: number; total: number }; slices: { total: number; done: number; running: number; halted: number; pending: number } };
      slices: { id: string; dependsOn: string[]; status: string; winner: string | null; faithful: boolean | null }[];
    }>();
    // progress is computed, not eyeballed
    expect(s.progress.slices).toEqual({ total: 2, done: 1, running: 0, halted: 0, pending: 1 });
    expect(s.progress.phases.total).toBe(6);
    expect(s.progress.phases.done).toBeGreaterThanOrEqual(1); // slice-disaggregation marked done
    // enriched rows carry winner + faithful so the dashboard table renders directly
    const row1 = s.slices.find((r) => r.id === "slice-01")!;
    expect(row1).toMatchObject({ status: "done", winner: "c", faithful: true, dependsOn: [] });
    const row2 = s.slices.find((r) => r.id === "slice-02")!;
    expect(row2).toMatchObject({ status: "pending", winner: null, faithful: null, dependsOn: ["slice-01"] });
  });

  it("summary aggregates winners and writes the completion report", async () => {
    await initProject();
    await add("slice-01");
    await add("slice-02");
    // stage slice-01 as a finished tournament
    await mkdir(join(root, STZ_DIR, "40-slices/slice-01/tournament"), { recursive: true });
    await writeFile(join(root, STZ_DIR, "40-slices/slice-01/tournament/judgment.json"), JSON.stringify({ winner: "a", ranking: ["a", "b"] }), "utf8");
    await mkdir(join(root, STZ_DIR, "40-slices/slice-01"), { recursive: true });
    await writeFile(join(root, STZ_DIR, "40-slices/slice-01/spec-diff.md"), "---\nsummary: \"Spec diff slice-01: 0 missing, 1 added, 3 kept.\"\n---\n\nbody\n", "utf8");
    await mkdir(join(root, STZ_DIR, "50-pressure/slice-01"), { recursive: true });
    await writeFile(join(root, STZ_DIR, "50-pressure/slice-01/pressure.md"), "---\nsummary: \"Pressure log slice-01: 2 culled.\"\n---\n\nbody\n", "utf8");
    await markSlice("slice-01");
    captured = "";
    await runBridge(["summary", "--root", root]);
    const out = lastJSON<{ slices: { id: string; winner: string | null; faithful: boolean | null; culled: number | null }[]; done: number }>();
    const s1 = out.slices.find((r) => r.id === "slice-01")!;
    expect(s1.winner).toBe("a");
    expect(s1.faithful).toBe(true);
    expect(s1.culled).toBe(2);
    expect(out.done).toBe(1);
    const report = await readFile(join(root, STZ_DIR, "90-audit/completion-report.md"), "utf8");
    expect(report).toMatch(/slice-01/);
    expect(report).toMatch(/Completion: 1 done/);
  });
});

async function setConfig(partial: Partial<RunConfig>): Promise<void> {
  const p = join(root, "config.json");
  await writeFile(p, JSON.stringify(partial), "utf8");
  captured = "";
  await runBridge(["project-set-config", "--root", root, "--config", p]);
}

describe("run configuration — 0.3.0 elicitation choices, consumed downstream", () => {
  it("normalizeRunConfig fills every field from a sparse partial", () => {
    const c = normalizeRunConfig({ fanout: 6 });
    const d = defaultRunConfig();
    expect(c.fanout).toBe(6);
    expect(c.granularity).toBe(d.granularity);
    expect(c.models).toEqual(d.models);
    expect(c.strictness).toEqual(d.strictness);
  });

  it("clamps fanout to [2, 16] and coverageTarget to [0, 1]", () => {
    expect(normalizeRunConfig({ fanout: 99 }).fanout).toBe(16);
    expect(normalizeRunConfig({ fanout: 1 }).fanout).toBe(2);
    expect(normalizeRunConfig({ fanout: 3.6 }).fanout).toBe(4); // rounded then in-range
    expect(normalizeRunConfig({ strictness: { coverageTarget: 2 } as RunConfig["strictness"] }).strictness.coverageTarget).toBe(1);
    expect(normalizeRunConfig({ strictness: { coverageTarget: -1 } as RunConfig["strictness"] }).strictness.coverageTarget).toBe(0);
  });

  it("rejects invalid enum values (a typo must not silently default)", () => {
    expect(() => normalizeRunConfig({ granularity: "huge" as RunConfig["granularity"] })).toThrow(/granularity/);
    expect(() => normalizeRunConfig({ strictness: { mutationPolicy: "max" } as unknown as RunConfig["strictness"] })).toThrow(/mutationPolicy/);
    expect(() => normalizeRunConfig({ strictness: { conventions: "loose" } as unknown as RunConfig["strictness"] })).toThrow(/conventions/);
  });

  it("keeps model values free-form (the get-shit-done Other pattern)", () => {
    const c = normalizeRunConfig({ models: { judging: "my-custom-model-id" } as RunConfig["models"] });
    expect(c.models.judging).toBe("my-custom-model-id");
    expect(c.models.research).toBe(defaultRunConfig().models.research); // untouched roles keep defaults
  });

  it("project-status carries default run config before any is set", async () => {
    await initProject();
    const s = await status<{ runConfig: RunConfig; runConfigSet: boolean }>();
    expect(s.runConfigSet).toBe(false);
    expect(s.runConfig).toEqual(defaultRunConfig());
  });

  it("set-config → status round-trip exposes every downstream-consumed field", async () => {
    await initProject();
    await setConfig({
      granularity: "fine",
      fanout: 5,
      models: { judging: "opus", research: "haiku", execution: "sonnet" } as RunConfig["models"],
      strictness: { coverageTarget: 0.95, mutationPolicy: "strict", conventions: "strict" },
    });
    const resolved = lastJSON<RunConfig>();
    expect(resolved.fanout).toBe(5);

    const s = await status<{ runConfig: RunConfig; runConfigSet: boolean }>();
    expect(s.runConfigSet).toBe(true);
    // granularity → /stz:slice
    expect(s.runConfig.granularity).toBe("fine");
    // fanout → /stz:run N
    expect(typeof s.runConfig.fanout).toBe("number");
    expect(s.runConfig.fanout).toBe(5);
    // models → per-role subagents
    expect(s.runConfig.models.judging).toBe("opus");
    expect(s.runConfig.models.research).toBe("haiku");
    expect(s.runConfig.models.testing).toBe(defaultRunConfig().models.testing); // unspecified role defaulted
    // strictness → /stz:standards + /stz:tests
    expect(s.runConfig.strictness.coverageTarget).toBe(0.95);
    expect(s.runConfig.strictness.mutationPolicy).toBe("strict");
    expect(s.runConfig.strictness.conventions).toBe("strict");

    // persisted to disk and reloadable
    const onDisk = await loadRunConfig(root);
    expect(onDisk).toEqual(resolved);
    const md = await readFile(join(root, STZ_DIR, "00-intent/run-config.md"), "utf8");
    expect(md).toMatch(/fine/);
    expect(md).toMatch(/fan-out \(N\):\*\* 5/);
  });

  it("project-config reads back the persisted config (defaults flagged)", async () => {
    await initProject();
    captured = "";
    await runBridge(["project-config", "--root", root]);
    expect(lastJSON<{ isDefault: boolean }>().isDefault).toBe(true);
    await setConfig({ fanout: 7 });
    captured = "";
    await runBridge(["project-config", "--root", root]);
    const c = lastJSON<RunConfig & { isDefault: boolean }>();
    expect(c.isDefault).toBe(false);
    expect(c.fanout).toBe(7);
  });

  it("project-status survives a corrupt run-config.json (falls back to defaults)", async () => {
    await initProject();
    await setConfig({ fanout: 5 });
    // hand-corrupt the persisted config with an invalid enum
    await writeFile(join(root, STZ_DIR, "00-intent/run-config.json"), JSON.stringify({ granularity: "BROKEN" }), "utf8");
    const s = await status<{ runConfig: RunConfig; runConfigSet: boolean; runConfigBroken?: boolean }>();
    expect(s.runConfigBroken).toBe(true);
    expect(s.runConfigSet).toBe(false);
    expect(s.runConfig).toEqual(defaultRunConfig()); // status still works
  });

  it("set-config rejects an invalid enum and exits non-zero", async () => {
    await initProject();
    const code = process.exitCode;
    const p = join(root, "bad.json");
    await writeFile(p, JSON.stringify({ granularity: "nope" }), "utf8");
    captured = "";
    await runBridge(["project-set-config", "--root", root, "--config", p]);
    expect(process.exitCode).toBe(1);
    process.exitCode = code;
  });
});

describe("dark-factory mode — 0.4.0 autonomous run flag", () => {
  it("defaults to off and accepts a true/'true' literal", () => {
    expect(defaultRunConfig().darkFactory).toBe(false);
    expect(normalizeRunConfig({}).darkFactory).toBe(false);
    expect(normalizeRunConfig({ darkFactory: true }).darkFactory).toBe(true);
    expect(normalizeRunConfig({ darkFactory: "true" } as unknown as Partial<RunConfig>).darkFactory).toBe(true);
    expect(normalizeRunConfig({ darkFactory: "false" } as unknown as Partial<RunConfig>).darkFactory).toBe(false);
  });

  it("set-config persists darkFactory and status surfaces it (hoisted + in runConfig)", async () => {
    await initProject();
    await setConfig({ fanout: 6, darkFactory: true });
    const s = await status<{ darkFactory: boolean; runConfig: RunConfig }>();
    expect(s.darkFactory).toBe(true);
    expect(s.runConfig.darkFactory).toBe(true);
  });

  it("project-dark-factory toggle is load-modify-save — it never resets other fields", async () => {
    await initProject();
    // Set a fully non-default config first.
    await setConfig({
      granularity: "fine",
      fanout: 7,
      models: { judging: "opus", research: "haiku" } as RunConfig["models"],
      strictness: { coverageTarget: 0.95, mutationPolicy: "strict", conventions: "strict" },
    });
    // Engage dark-factory mid-run via the dedicated command.
    captured = "";
    await runBridge(["project-dark-factory", "--root", root, "--on"]);
    const out = lastJSON<{ darkFactory: boolean; runConfig: RunConfig }>();
    expect(out.darkFactory).toBe(true);
    // The regression this guards: every other field survives the toggle.
    expect(out.runConfig.granularity).toBe("fine");
    expect(out.runConfig.fanout).toBe(7);
    expect(out.runConfig.models.judging).toBe("opus");
    expect(out.runConfig.strictness.coverageTarget).toBe(0.95);
    expect(out.runConfig.strictness.mutationPolicy).toBe("strict");

    // Persisted to disk with everything intact.
    const onDisk = await loadRunConfig(root);
    expect(onDisk.darkFactory).toBe(true);
    expect(onDisk.fanout).toBe(7);
    expect(onDisk.granularity).toBe("fine");

    // The doc reflects the engaged state, and an event was journaled.
    const md = await readFile(join(root, STZ_DIR, "00-intent/run-config.md"), "utf8");
    expect(md).toMatch(/Dark-factory mode:\*\* \*\*on\*\*/);
    const pstate = JSON.parse(await readFile(join(root, STZ_DIR, "90-audit/project-state.json"), "utf8"));
    expect(pstate.events.some((e: { kind: string }) => e.kind === "dark-factory")).toBe(true);
  });

  it("project-dark-factory --off disengages without touching other fields", async () => {
    await initProject();
    await setConfig({ fanout: 5, darkFactory: true });
    captured = "";
    await runBridge(["project-dark-factory", "--root", root, "--off"]);
    const out = lastJSON<{ darkFactory: boolean; runConfig: RunConfig }>();
    expect(out.darkFactory).toBe(false);
    expect(out.runConfig.fanout).toBe(5);
  });

  it("dark-factory can be engaged before any config is set (defaults preserved)", async () => {
    await initProject();
    captured = "";
    await runBridge(["project-dark-factory", "--root", root]); // bare = --on
    const out = lastJSON<{ darkFactory: boolean; runConfig: RunConfig }>();
    expect(out.darkFactory).toBe(true);
    expect(out.runConfig).toMatchObject({ ...defaultRunConfig(), darkFactory: true });
  });
});
