/**
 * STZ 0.9.6 — append-only promotion ledger (PHASED-PLAN Phase 5).
 *
 * The only auditable path by which a candidate artifact becomes trusted. Mirrors
 * seal.ts / 60-harness/MANIFEST.json discipline: append-only, content-order IS
 * the audit sequence, NO timestamps in the core (N6 determinism/replay). Reuses,
 * never loosens, the existing six-gate promotion guard (harness.ts:285) — Phase 5
 * only adds the 7th human-accept gate for contract-bearing kinds.
 */
export type LedgerEventType =
  | "artifact_proposed"
  | "artifact_accepted"
  | "artifact_quarantined"
  | "artifact_rejected"
  | "artifact_sunset";

/** One append-only ledger event. `seq` is the monotonic audit index (N6). */
export interface LedgerEvent {
  seq: number;
  type: LedgerEventType;
  artifactId: string;
  artifactKind: string;
  reasons: string[];
  /** Evidence run ids that justify this decision. */
  evidenceRuns: string[];
}

/** Append an event to an in-memory ledger, assigning the next seq. Pure. */
export function appendLedgerEvent(
  ledger: LedgerEvent[],
  event: Omit<LedgerEvent, "seq">,
): LedgerEvent[] {
  const seq = ledger.length === 0 ? 0 : ledger[ledger.length - 1]!.seq + 1;
  return [...ledger, { ...event, seq }];
}

/** Serialize a ledger to JSONL (one event per line) for `.stz/ledger/events.jsonl`. */
export function serializeLedger(ledger: LedgerEvent[]): string {
  return ledger.map((e) => JSON.stringify(e)).join("\n") + (ledger.length ? "\n" : "");
}

/** Parse a JSONL ledger. */
export function parseLedger(jsonl: string): LedgerEvent[] {
  return jsonl
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as LedgerEvent);
}
