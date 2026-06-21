/**
 * Cross-slice merge integrity — sealed-invariant supersession (F13-adjacent).
 *
 * When several slice winners are assembled into one integrated crate, an EARLIER
 * slice's sealed suite can legitimately fail: it encodes an invariant that was
 * correct in isolation but is obsolete under a LATER slice's composition. The
 * canonical case from the dogfood run: slice-03's suite asserts "aliens never
 * respawn", which slice-05's wave-clear deliberately supersedes. The assembled
 * crate fails slice-03's suite — but that is not a merge defect.
 *
 * The danger is the orchestrator hand-waving that distinction ("looks like the
 * expected interaction, moving on") — exactly the unaudited, gameable judgment
 * STZ exists to eliminate. This module makes the call deterministic and audited
 * instead. A failing sealed suite is only sanctioned when ALL of:
 *
 *   1. a **signature-pinned** compat entry matches the actual failure text (not
 *      the test name alone — the exact panic/assert substring),
 *   2. the **superseding invariant also passes** on the same assembled crate
 *      (you cannot claim supersession when the replacement isn't even proven),
 *   3. the entry is **approved** (the merge agent may propose but not self-bless).
 *
 * Trust boundary (be honest, same split as `eval` vs `record-eval`): this module
 * does NOT run the suites — it can't, the assembled crate may be Rust. It
 * consumes the *reported* per-suite results and deterministically ADJUDICATES
 * those failures against the audited compat rules. A dishonest results file
 * defeats it; the orchestration contract (run the suites in an ephemeral scratch
 * copy, never the canonical crate) lives in the merge command doc.
 *
 * Rules 3 (ephemeral scratch) and the "agent can't self-approve" half of rule 1
 * are conventions backed by AUDIT, not hard barriers: the append-only `history`
 * makes a self-approval a visible anomaly rather than a silent one — STZ's
 * auditability-over-prevention posture (N1). A compat entry is transitional debt:
 * it points at a pending wave-aware amendment and is retired once that
 * `seal-amend` lands and the amended (wave-aware) suite replaces the old one.
 */
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { stzPath } from "./taxonomy.js";

/** The replacement invariant whose passing proves a supersession is legitimate. */
export interface ReplacementInvariant {
  /** Sealed suite (slice id) whose passing proves the superseding invariant. */
  slice: string;
  /** Optional specific test within that suite (informational; suite-level enforced). */
  test?: string;
}

/** One audited "this old invariant is superseded by a later slice" entry. */
export interface MergeCompatEntry {
  id: string;
  /** The sealed suite that now fails on the assembled crate. */
  supersededSlice: string;
  /** Optional test target/name within the superseded suite. */
  supersededTest?: string;
  /** Signature-pinned: the exact panic/assert substring that must appear in the
   *  reported failure. Matching the test name alone is forbidden — that is how a
   *  genuinely new bug in the same test would be laundered as "expected". */
  panicSubstring: string;
  /** The slice whose newer invariant legitimately supersedes the old one. */
  supersededBy: string;
  /** The replacement invariant that MUST simultaneously pass (rule 2). */
  replacement: ReplacementInvariant;
  reason: string;
  /** Pointer to the pending wave-aware amendment that retires this entry (debt). */
  pendingAmendment: string;
  /** Approval gate (rule 3): the merge agent proposes false; an approver flips true. */
  approved: boolean;
  /** Who/why, recorded on approval — a self-approval is then an auditable anomaly. */
  approvedBy?: string;
}

export interface MergeCompatHistoryEvent {
  seq: number;
  action: "propose" | "approve" | "retire";
  id: string;
  detail: string;
}

export interface MergeCompatManifest {
  schemaVersion: 1;
  entries: MergeCompatEntry[];
  /** Append-only audit of propose/approve/retire — the protection for rules 1/3. */
  history: MergeCompatHistoryEvent[];
}

/** One reported sealed-suite result on the assembled crate (caller-supplied). */
export interface SealedSuiteResult {
  slice: string;
  passed: boolean;
  /** The failure/panic text (signature) when passed === false. */
  failure?: string;
}

export interface MergeVerdict {
  ok: boolean;
  /** Failures sanctioned by a matched + superseding-proven + approved entry. */
  sanctioned: { slice: string; entryId: string; supersededBy: string }[];
  /** Matched + superseding passes but NOT approved → blocks, awaits approval. */
  pendingApproval: { slice: string; entryId: string }[];
  /** Matched but the replacement invariant did NOT pass → blocks even if approved. */
  invalid: { slice: string; entryId: string; reason: string }[];
  /** No entry matches the signature → blocks; suspect a real merge defect. */
  unsanctioned: { slice: string; reason: string }[];
  /** Approved entries that sanctioned nothing this run — informational retire candidates. */
  unused: string[];
}

// ── paths + persistence ──────────────────────────────────────────────────────

const COMPAT_REL = join("90-audit", "merge-compat.json");

export function mergeCompatPath(root: string): string {
  return stzPath(root, COMPAT_REL);
}

export function freshCompatManifest(): MergeCompatManifest {
  return { schemaVersion: 1, entries: [], history: [] };
}

export function loadCompat(root: string): MergeCompatManifest {
  const p = mergeCompatPath(root);
  if (!existsSync(p)) return freshCompatManifest();
  return JSON.parse(readFileSync(p, "utf8")) as MergeCompatManifest;
}

export function saveCompat(root: string, manifest: MergeCompatManifest): void {
  const p = mergeCompatPath(root);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

function appendHistory(m: MergeCompatManifest, action: MergeCompatHistoryEvent["action"], id: string, detail: string): void {
  m.history.push({ seq: m.history.length, action, id, detail });
}

// ── mutations (propose / approve / retire) ───────────────────────────────────

export type ProposeInput = Omit<MergeCompatEntry, "approved" | "approvedBy">;

/**
 * Propose a compat entry. Always lands `approved:false` regardless of the input
 * (the merge agent cannot self-approve — rule 3). Rejects an empty
 * `panicSubstring` (it would match every failure) and a duplicate id.
 */
export function proposeCompat(m: MergeCompatManifest, entry: ProposeInput): { ok: true } | { ok: false; error: string } {
  if (!entry.id) return { ok: false, error: "entry id is required" };
  if (!entry.panicSubstring || entry.panicSubstring.trim() === "") {
    return { ok: false, error: "panicSubstring must be non-empty (an empty signature would match every failure)" };
  }
  if (!entry.pendingAmendment || entry.pendingAmendment.trim() === "") {
    return { ok: false, error: "pendingAmendment is required — a compat entry is transitional debt and must name the amendment that retires it" };
  }
  if (m.entries.some((e) => e.id === entry.id)) return { ok: false, error: `duplicate entry id: ${entry.id}` };
  m.entries.push({ ...entry, approved: false });
  appendHistory(m, "propose", entry.id, `${entry.supersededSlice} superseded by ${entry.supersededBy}; sig="${entry.panicSubstring}"`);
  return { ok: true };
}

/** Approve a proposed entry. Records who/why so a self-approval is auditable. */
export function approveCompat(m: MergeCompatManifest, id: string, by: string): { ok: true } | { ok: false; error: string } {
  const e = m.entries.find((x) => x.id === id);
  if (!e) return { ok: false, error: `no such compat entry: ${id}` };
  if (e.approved) return { ok: false, error: `already approved: ${id}` };
  e.approved = true;
  e.approvedBy = by;
  appendHistory(m, "approve", id, `approved by ${by}`);
  return { ok: true };
}

/**
 * Retire an entry — the transitional-debt end state (rule 5). Should correspond
 * to a `seal-amend` of the superseded suite (now wave-aware); the amendment
 * reference is recorded so the audit links the two.
 */
export function retireCompat(m: MergeCompatManifest, id: string, amendmentRef: string): { ok: true } | { ok: false; error: string } {
  const idx = m.entries.findIndex((x) => x.id === id);
  if (idx < 0) return { ok: false, error: `no such compat entry: ${id}` };
  m.entries.splice(idx, 1);
  appendHistory(m, "retire", id, `retired; superseded suite amended via ${amendmentRef}`);
  return { ok: true };
}

// ── the deterministic verdict (the heart) ────────────────────────────────────

/**
 * Adjudicate reported sealed-suite results against the compat manifest. Pure and
 * total: same inputs → same verdict (N6). A failing suite is sanctioned only when
 * a signature-matched entry is approved AND its replacement invariant passes;
 * matched-but-unapproved is `pendingApproval`, matched-but-replacement-fails is
 * `invalid`, and no-match is `unsanctioned`. Any non-empty pendingApproval /
 * invalid / unsanctioned blocks the merge.
 */
export function validateMerge(results: SealedSuiteResult[], manifest: MergeCompatManifest): MergeVerdict {
  const bySlice = new Map(results.map((r) => [r.slice, r]));
  const passing = (slice: string): boolean => bySlice.get(slice)?.passed === true;

  const sanctioned: MergeVerdict["sanctioned"] = [];
  const pendingApproval: MergeVerdict["pendingApproval"] = [];
  const invalid: MergeVerdict["invalid"] = [];
  const unsanctioned: MergeVerdict["unsanctioned"] = [];
  const used = new Set<string>();

  for (const r of results) {
    if (r.passed) continue;
    const failure = r.failure ?? "";
    // Signature-pinned: the entry's panicSubstring must appear in the actual text.
    const matches = manifest.entries.filter(
      (e) => e.supersededSlice === r.slice && e.panicSubstring.length > 0 && failure.includes(e.panicSubstring),
    );
    if (matches.length === 0) {
      unsanctioned.push({ slice: r.slice, reason: "no compat entry matches the failure signature — suspect a real merge defect" });
      continue;
    }
    // Best outcome first: approved + replacement-proven → sanctioned.
    const sanction = matches.find((e) => e.approved && passing(e.replacement.slice));
    if (sanction) {
      sanctioned.push({ slice: r.slice, entryId: sanction.id, supersededBy: sanction.supersededBy });
      used.add(sanction.id);
      continue;
    }
    // Replacement proven but not yet approved → pending (rule 3).
    const pend = matches.find((e) => !e.approved && passing(e.replacement.slice));
    if (pend) {
      pendingApproval.push({ slice: r.slice, entryId: pend.id });
      used.add(pend.id);
      continue;
    }
    // Matched but the replacement invariant is not proven → invalid, blocks even
    // if approved (rule 2: no supersession claim without a proven replacement).
    // Distinguish "ran and failed" from "never reported" — saying a suite "did
    // not pass" when it simply wasn't run is the same misleading verdict this
    // whole feature replaces.
    const inv = matches[0]!;
    const reason = bySlice.has(inv.replacement.slice)
      ? `replacement invariant ${inv.replacement.slice} did not pass — supersession unproven`
      : `replacement suite ${inv.replacement.slice} was not in the reported results — cannot prove supersession; run and report it`;
    invalid.push({ slice: r.slice, entryId: inv.id, reason });
    used.add(inv.id);
  }

  const unused = manifest.entries.filter((e) => e.approved && !used.has(e.id)).map((e) => e.id);
  const ok = unsanctioned.length === 0 && invalid.length === 0 && pendingApproval.length === 0;
  return { ok, sanctioned, pendingApproval, invalid, unsanctioned, unused };
}
