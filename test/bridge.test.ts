import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBridge } from "../src/bridge.js";
import { STZ_DIR } from "../src/taxonomy.js";
import type { SliceManifest } from "../src/types.js";

let root: string;
let captured: string;
const origWrite = process.stdout.write.bind(process.stdout);

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-bridge-"));
  captured = "";
  // Capture the JSON the bridge prints to stdout (the command parses this).
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

const manifest: SliceManifest = {
  id: "slice-01",
  name: "demo",
  contract: "export function run(input: Request): Result",
  donePredicates: [{ id: "schema", expr: "returns_schema(Result)", kind: "schema" }],
  traceTier: "minimal",
  complexity: 2,
  dependsOn: [],
  judge: { votesPerPair: 2 },
  summary: "bridge demo",
};

async function writeSpecimen(spec: string, files: Record<string, string>): Promise<void> {
  const dir = join(root, STZ_DIR, "40-slices", "slice-01", "prototypes", `specimen-${spec}`, "src");
  await mkdir(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await writeFile(join(dir, name), content, "utf8");
  }
}

async function metricsFile(m: object): Promise<string> {
  const p = join(root, `metrics.json`);
  await writeFile(p, JSON.stringify(m), "utf8");
  return p;
}

describe("in-session bridge — the deterministic half the /stz:run command calls", () => {
  it("drives begin → record-eval → gate → votes → select → finalize end to end", async () => {
    // begin
    const manifestPath = join(root, "m.json");
    await writeFile(manifestPath, JSON.stringify(manifest), "utf8");
    await runBridge(["begin", "--root", root, "--manifest", manifestPath]);
    expect(lastJSON<{ sliceId: string }>().sliceId).toBe("slice-01");

    // two clean specimens + one with a planted hack (test-skip)
    await writeSpecimen("a", { "impl.ts": "export const run = (x:number)=>x*2;\n" });
    await writeSpecimen("b", { "impl.ts": "export const run = (x:number)=>x+x;\n" });
    await writeSpecimen("c", { "impl.ts": "export const run = (x:number)=>x*2;\n", "cheat.test.ts": "it.skip('contract',()=>{});\n" });

    // record-eval for each (eval runner supplied these metrics; hack-detector runs in-bridge)
    captured = "";
    await runBridge(["record-eval", "--root", root, "--slice", "slice-01", "--specimen", "a", "--metrics", await metricsFile({ testPassRate: 1, coverage: 0.95, mutationScore: 0.1 })]);
    expect(lastJSON<{ passedGate: boolean }>().passedGate).toBe(true);

    captured = "";
    await runBridge(["record-eval", "--root", root, "--slice", "slice-01", "--specimen", "b", "--metrics", await metricsFile({ testPassRate: 1, coverage: 0.85, mutationScore: 0.2 })]);
    expect(lastJSON<{ passedGate: boolean }>().passedGate).toBe(true);

    // c passes its tests but planted an it.skip → hack-detector disqualifies it
    captured = "";
    await runBridge(["record-eval", "--root", root, "--slice", "slice-01", "--specimen", "c", "--metrics", await metricsFile({ testPassRate: 1, coverage: 0.9, mutationScore: 0.15 })]);
    const cEval = lastJSON<{ passedGate: boolean; hackFindings: unknown[] }>();
    expect(cEval.passedGate).toBe(false);
    expect(cEval.hackFindings.length).toBeGreaterThan(0);

    // gate: a,b pass; c eliminated; pairings = [[a,b]]
    captured = "";
    await runBridge(["gate", "--root", root, "--slice", "slice-01"]);
    const g = lastJSON<{ passers: string[]; eliminated: unknown[]; pairings: string[][] }>();
    expect(g.passers.sort()).toEqual(["a", "b"]);
    expect(g.eliminated.length).toBe(1);
    expect(g.pairings).toEqual([["a", "b"]]);

    // record-votes: judge agents voted a over b twice (V=2)
    captured = "";
    const votesPath = join(root, "votes.json");
    await writeFile(votesPath, JSON.stringify([
      { a: "a", b: "b", winner: "a" },
      { a: "a", b: "b", winner: "a" },
    ]), "utf8");
    await runBridge(["record-votes", "--root", root, "--slice", "slice-01", "--votes", votesPath]);
    expect(lastJSON<{ recorded: number }>().recorded).toBe(2);

    // select: winner a; GRPO spans the whole group (a,b,c incl. eliminated c)
    captured = "";
    await runBridge(["select", "--root", root, "--slice", "slice-01"]);
    const sel = lastJSON<{ winner: string; ranking: string[]; advantages: { specimen: string }[] }>();
    expect(sel.winner).toBe("a");
    expect(sel.ranking).toEqual(["a", "b"]);
    expect(sel.advantages.map((x) => x.specimen).sort()).toEqual(["a", "b", "c"]);

    // finalize: spec-diff + pressure + audit
    captured = "";
    const intentPath = join(root, "intent.json");
    const asbuiltPath = join(root, "asbuilt.json");
    await writeFile(intentPath, JSON.stringify({ claims: ["doubles the input", "exposes run()"] }), "utf8");
    await writeFile(asbuiltPath, JSON.stringify({ claims: ["doubles the input", "exposes run()", "via multiply"] }), "utf8");
    await runBridge(["finalize", "--root", root, "--slice", "slice-01", "--intent", intentPath, "--asbuilt", asbuiltPath]);
    const fin = lastJSON<{ winner: string; faithful: boolean; culled: number }>();
    expect(fin.winner).toBe("a");
    expect(fin.faithful).toBe(true);
    expect(fin.culled).toBe(2); // b and c are non-winners

    // artifacts materialized
    const tournament = await readFile(join(root, STZ_DIR, "40-slices/slice-01/tournament.md"), "utf8");
    expect(tournament).toMatch(/winner:\*\* specimen-a/);
    const pressure = await readFile(join(root, STZ_DIR, "50-pressure/slice-01/pressure.md"), "utf8");
    expect(pressure).toMatch(/specimen-c/);
    expect(pressure).toMatch(/test-skip/);
    const specdiff = await readFile(join(root, STZ_DIR, "40-slices/slice-01/spec-diff.md"), "utf8");
    expect(specdiff).toMatch(/Planned but missing \(0\)/);
  });
});
