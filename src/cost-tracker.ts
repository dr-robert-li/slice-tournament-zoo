/**
 * Cost / token tracker (N5 cost governance, N6 replay).
 *
 * Middleware around every Anthropic/OpenAI SDK call. Persists each call as a
 * JSONL record under `90-audit/calls/` and aggregates spend into `state.json`.
 * A replay command can reconstruct any decision from these records.
 */
import type { CallRecord, Phase } from "./types.js";

export class CostTracker {
  private seq = 0;
  private records: CallRecord[] = [];

  /** Record one call. Returns the persisted record (with assigned seq). */
  record(input: Omit<CallRecord, "seq">): CallRecord {
    const rec: CallRecord = { ...input, seq: this.seq++ };
    this.records.push(rec);
    return rec;
  }

  all(): CallRecord[] {
    return [...this.records];
  }

  /** Total tokens (prompt + completion) across all recorded calls. */
  totalTokens(): number {
    return this.records.reduce(
      (a, r) => a + r.promptTokens + r.completionTokens,
      0,
    );
  }

  tokensForPhase(phase: Phase): number {
    return this.records
      .filter((r) => r.phase === phase)
      .reduce((a, r) => a + r.promptTokens + r.completionTokens, 0);
  }

  count(): number {
    return this.records.length;
  }

  /** Serialize the ledger as JSONL for 90-audit/calls/*.jsonl. */
  toJSONL(): string {
    return this.records.map((r) => JSON.stringify(r)).join("\n");
  }

  /** Rebuild a tracker from persisted JSONL (replay/recovery). */
  static fromJSONL(jsonl: string): CostTracker {
    const t = new CostTracker();
    const lines = jsonl.split("\n").filter((l) => l.trim().length > 0);
    for (const line of lines) {
      const rec = JSON.parse(line) as CallRecord;
      t.records.push(rec);
      t.seq = Math.max(t.seq, rec.seq + 1);
    }
    return t;
  }
}
