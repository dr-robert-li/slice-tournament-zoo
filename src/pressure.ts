/**
 * Selection pressure — the pressure log (F9, N12 vocabulary).
 *
 * Culled specimens' diffs + judge critiques + hack findings are persisted to
 * `50-pressure/slice-NN/` as structured negative-exemplar context. If the
 * failure-replan loop activates, the top-K=4 surviving summaries (PDR pattern)
 * form the refinement context for the next round of specimens.
 */
import type { Advantage, HackFinding, SpecimenId } from "./types.js";
import { mostInformative } from "./grpo.js";

export const PDR_K = 4;

export interface CulledSpecimen {
  specimen: SpecimenId;
  /** Why it was culled (gate-fail reason or judge rank). */
  reason: string;
  /** Unified diff of the specimen's attempt (negative exemplar). */
  diff: string;
  /** Judge critique prose, if it reached the judge. */
  critique: string;
  hackFindings: HackFinding[];
}

export interface PressureLog {
  sliceId: string;
  culled: CulledSpecimen[];
}

/** Render the pressure log as a markdown doc body for 50-pressure/slice-NN/. */
export function renderPressureLog(log: PressureLog): string {
  const parts: string[] = [`# Pressure log — ${log.sliceId}\n`];
  for (const c of log.culled) {
    parts.push(`## specimen-${c.specimen}`);
    parts.push(`- **culled because:** ${c.reason}`);
    if (c.hackFindings.length > 0) {
      parts.push(
        `- **hack findings:** ${c.hackFindings
          .map((f) => `${f.pattern} @ ${f.location}`)
          .join("; ")}`,
      );
    }
    if (c.critique) parts.push(`- **judge critique:** ${c.critique}`);
    parts.push("\n```diff\n" + c.diff.trim() + "\n```\n");
  }
  return parts.join("\n");
}

/**
 * Build the PDR-style refinement context (F9): the top-K most informative
 * surviving summaries to seed the next round of specimens. We rank culled
 * specimens by |GRPO advantage| (most informative first) and take K.
 */
export function refinementContext(
  log: PressureLog,
  advantages: Advantage[],
  k = PDR_K,
): string {
  const order = mostInformative(advantages);
  const byName = new Map(log.culled.map((c) => [c.specimen, c]));
  const picked: CulledSpecimen[] = [];
  for (const s of order) {
    const c = byName.get(s);
    if (c) picked.push(c);
    if (picked.length >= k) break;
  }
  // If fewer advantages than culled (e.g. all eliminated pre-judge), top up.
  for (const c of log.culled) {
    if (picked.length >= k) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return [
    "# Refinement context (PDR top-K negative exemplars)",
    ...picked.map(
      (c, i) =>
        `## ${i + 1}. specimen-${c.specimen} — avoid this failure mode\n${c.reason}\n${
          c.hackFindings.map((f) => `- avoid: ${f.remediation}`).join("\n") || ""
        }`,
    ),
  ].join("\n\n");
}
