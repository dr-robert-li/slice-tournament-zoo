import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runBridge } from "../src/bridge.js";
import { STZ_DIR } from "../src/taxonomy.js";
import {
  validateMerge,
  proposeCompat,
  approveCompat,
  retireCompat,
  freshCompatManifest,
  type MergeCompatManifest,
  type SealedSuiteResult,
} from "../src/merge.js";

// The real dogfood fixture: slice-03's sealed suite asserts "aliens must not
// respawn"; slice-05's wave-clear legitimately supersedes it. The assembled
// crate fails slice-03 with this exact panic.
const SLICE03_PANIC = "seed 1: alien_count() rose within a run (1 -> 55); aliens must not respawn mid-run";
const SIG = "alien_count() rose";

function entry(approved: boolean) {
  return {
    id: "wave-respawn",
    supersededSlice: "slice-03",
    supersededTest: "hit_kill_score_exact_score_and_count_delta",
    panicSubstring: SIG,
    supersededBy: "slice-05",
    replacement: { slice: "slice-05" },
    reason: "wave-clear respawns the formation; slice-03's no-respawn invariant predates waves",
    pendingAmendment: "amend slice-03 suite to be wave-aware",
    approved,
    approvedBy: approved ? "orchestrator: confirmed wave interaction" : undefined,
  };
}

function manifestWith(approved: boolean): MergeCompatManifest {
  return { schemaVersion: 1, entries: [entry(approved)], history: [] };
}

describe("validateMerge — deterministic supersession verdict (the four buckets)", () => {
  const supersededFail: SealedSuiteResult = { slice: "slice-03", passed: false, failure: SLICE03_PANIC };

  it("SANCTIONED: signature matches + replacement passes + approved", () => {
    const v = validateMerge([supersededFail, { slice: "slice-05", passed: true }], manifestWith(true));
    expect(v.ok).toBe(true);
    expect(v.sanctioned).toEqual([{ slice: "slice-03", entryId: "wave-respawn", supersededBy: "slice-05" }]);
    expect(v.pendingApproval).toEqual([]);
    expect(v.invalid).toEqual([]);
    expect(v.unsanctioned).toEqual([]);
  });

  it("PENDING APPROVAL: matched + replacement passes but not approved → blocks", () => {
    const v = validateMerge([supersededFail, { slice: "slice-05", passed: true }], manifestWith(false));
    expect(v.ok).toBe(false);
    expect(v.pendingApproval).toEqual([{ slice: "slice-03", entryId: "wave-respawn" }]);
    expect(v.sanctioned).toEqual([]);
  });

  it("INVALID: matched + approved but the replacement invariant ALSO fails → blocks (rule 2)", () => {
    // slice-05 itself fails on the assembled crate → supersession is unproven.
    const v = validateMerge([supersededFail, { slice: "slice-05", passed: false, failure: "wave never clears" }], manifestWith(true));
    expect(v.ok).toBe(false);
    expect(v.invalid).toHaveLength(1);
    expect(v.invalid[0]!.entryId).toBe("wave-respawn");
    expect(v.sanctioned).toEqual([]);
  });

  it("INVALID distinguishes 'replacement not reported' from 'replacement failed'", () => {
    // slice-05 omitted entirely from results — it didn't fail, it never ran.
    const v = validateMerge([supersededFail], manifestWith(true));
    expect(v.ok).toBe(false);
    expect(v.invalid).toHaveLength(1);
    expect(v.invalid[0]!.reason).toMatch(/was not in the reported results/);
    // vs. the genuine "ran and failed" reason
    const failed = validateMerge([supersededFail, { slice: "slice-05", passed: false, failure: "x" }], manifestWith(true));
    expect(failed.invalid[0]!.reason).toMatch(/did not pass/);
  });

  it("UNSANCTIONED: a different panic in the same suite is NOT laundered by test name", () => {
    const realBug: SealedSuiteResult = { slice: "slice-03", passed: false, failure: "index out of bounds: the len is 55 but the index is 99" };
    const v = validateMerge([realBug, { slice: "slice-05", passed: true }], manifestWith(true));
    expect(v.ok).toBe(false);
    expect(v.unsanctioned).toHaveLength(1);
    expect(v.unsanctioned[0]!.slice).toBe("slice-03");
    expect(v.sanctioned).toEqual([]);
  });

  it("all-pass is OK and reports an approved-but-unused entry as a retire candidate", () => {
    const v = validateMerge([{ slice: "slice-03", passed: true }, { slice: "slice-05", passed: true }], manifestWith(true));
    expect(v.ok).toBe(true);
    expect(v.unused).toEqual(["wave-respawn"]);
  });

  it("empty manifest: any failure is unsanctioned", () => {
    const v = validateMerge([supersededFail], freshCompatManifest());
    expect(v.ok).toBe(false);
    expect(v.unsanctioned).toHaveLength(1);
  });
});

describe("compat mutations — propose cannot self-approve; debt is named", () => {
  it("propose lands unapproved and rejects empty signature / missing amendment / dup", () => {
    const m = freshCompatManifest();
    const base = entry(true); // even if caller passes approved:true…
    const r = proposeCompat(m, base);
    expect(r.ok).toBe(true);
    expect(m.entries[0]!.approved).toBe(false); // …it is forced false (rule 3)
    expect(m.history[0]!.action).toBe("propose");

    expect(proposeCompat(m, base).ok).toBe(false); // duplicate id
    expect(proposeCompat(freshCompatManifest(), { ...base, panicSubstring: "  " }).ok).toBe(false);
    expect(proposeCompat(freshCompatManifest(), { ...base, pendingAmendment: "" }).ok).toBe(false);
  });

  it("approve records who/why; retire links the amendment; history is append-only", () => {
    const m = freshCompatManifest();
    proposeCompat(m, entry(true));
    expect(approveCompat(m, "wave-respawn", "orchestrator: confirmed").ok).toBe(true);
    expect(m.entries[0]!.approved).toBe(true);
    expect(m.entries[0]!.approvedBy).toMatch(/confirmed/);
    expect(approveCompat(m, "wave-respawn", "x").ok).toBe(false); // already approved
    expect(retireCompat(m, "wave-respawn", "SEAL amend #2").ok).toBe(true);
    expect(m.entries).toHaveLength(0);
    expect(m.history.map((h) => h.action)).toEqual(["propose", "approve", "retire"]);
  });
});

// ── CLI-level e2e through runBridge (mirrors how seal-crosscheck is exercised) ──

let root: string;
let captured: string;
const origWrite = process.stdout.write.bind(process.stdout);
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-merge-"));
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
async function file(obj: unknown): Promise<string> {
  const p = join(root, `arg-${Math.abs(JSON.stringify(obj).length)}.json`);
  await writeFile(p, JSON.stringify(obj), "utf8");
  return p;
}

describe("merge bridge CLI — propose → validate(block) → approve → validate(ok) → retire", () => {
  const results = [
    { slice: "slice-03", passed: false, failure: SLICE03_PANIC },
    { slice: "slice-05", passed: true },
  ];

  it("blocks (exit 1) while pending approval, passes (exit 0) once approved", async () => {
    const code = process.exitCode;

    // propose (forced unapproved)
    const { approved, ...proposeFields } = entry(true);
    captured = "";
    await runBridge(["merge-compat-propose", "--root", root, "--entry", await file(proposeFields)]);
    expect(lastJSON<{ approved: boolean }>().approved).toBe(false);

    // validate now → pending approval → BLOCKED, exit 1
    const resultsPath = await file(results);
    captured = "";
    await runBridge(["merge-validate", "--root", root, "--results", resultsPath]);
    let v = lastJSON<{ ok: boolean; pendingApproval: unknown[]; sanctioned: unknown[] }>();
    expect(v.ok).toBe(false);
    expect(v.pendingApproval).toHaveLength(1);
    expect(process.exitCode).toBe(1);
    process.exitCode = code;

    // approve (with who/why)
    captured = "";
    await runBridge(["merge-compat-approve", "--root", root, "--id", "wave-respawn", "--by", "orchestrator: confirmed wave interaction"]);
    expect(lastJSON<{ approved: string }>().approved).toBe("wave-respawn");

    // validate again → sanctioned → OK, exit clean
    captured = "";
    await runBridge(["merge-validate", "--root", root, "--results", resultsPath]);
    v = lastJSON<{ ok: boolean; pendingApproval: unknown[]; sanctioned: unknown[] }>();
    expect(v.ok).toBe(true);
    expect(v.sanctioned).toHaveLength(1);
    expect(process.exitCode ?? 0).toBe(0);

    // audit doc + manifest reflect the lifecycle
    const doc = await readFile(join(root, STZ_DIR, "90-audit/merge-validation.md"), "utf8");
    expect(doc).toMatch(/OK — merge may proceed/);
    const compatDoc = await readFile(join(root, STZ_DIR, "90-audit/merge-compat.md"), "utf8");
    expect(compatDoc).toMatch(/wave-respawn/);

    // retire requires the amendment ref
    captured = "";
    await runBridge(["merge-compat-retire", "--root", root, "--id", "wave-respawn", "--amendment", "seal-amend: wave-aware slice-03"]);
    expect(lastJSON<{ retired: string }>().retired).toBe("wave-respawn");
    captured = "";
    await runBridge(["merge-compat-list", "--root", root]);
    const m = lastJSON<MergeCompatManifest>();
    expect(m.entries).toHaveLength(0);
    expect(m.history.map((h) => h.action)).toEqual(["propose", "approve", "retire"]);
  });

  it("merge-compat-approve without --by exits non-zero (self-approval must be auditable)", async () => {
    const code = process.exitCode;
    const { approved, ...proposeFields } = entry(true);
    await runBridge(["merge-compat-propose", "--root", root, "--entry", await file(proposeFields)]);
    captured = "";
    await runBridge(["merge-compat-approve", "--root", root, "--id", "wave-respawn"]);
    expect(process.exitCode).toBe(1);
    process.exitCode = code;
  });

  it("a real merge defect (unmatched panic) BLOCKS with exit 1", async () => {
    const code = process.exitCode;
    const { approved, ...proposeFields } = entry(true);
    await runBridge(["merge-compat-propose", "--root", root, "--entry", await file(proposeFields)]);
    await runBridge(["merge-compat-approve", "--root", root, "--id", "wave-respawn", "--by", "x"]);
    const bug = [
      { slice: "slice-03", passed: false, failure: "index out of bounds: len 55 index 99" },
      { slice: "slice-05", passed: true },
    ];
    captured = "";
    await runBridge(["merge-validate", "--root", root, "--results", await file(bug)]);
    expect(lastJSON<{ ok: boolean; unsanctioned: unknown[] }>().unsanctioned).toHaveLength(1);
    expect(process.exitCode).toBe(1);
    process.exitCode = code;
  });
});
