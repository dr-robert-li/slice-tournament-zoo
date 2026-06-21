import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBridge } from "../src/bridge.js";
import { STZ_DIR } from "../src/taxonomy.js";
import { freshState, saveState, setPhaseStatus } from "../src/state.js";
import { PHASES } from "../src/types.js";

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
