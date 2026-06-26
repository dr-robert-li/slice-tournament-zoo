/**
 * Harness-contract hash + interface parity (0.9.0).
 *
 * This is the relocated `interfaceHash` the shelved 0.8.0 only specced. Two jobs:
 *
 *  1. **Content-address a variant** — hash its substituted genes into a stable
 *     `variantId` so the archive is deterministic and an identical genome never
 *     spawns twice (N6). Modeled on `seal.ts computeHashes`: sorted keys, sha256,
 *     byte-stable across machines.
 *
 *  2. **Interface parity** — a harness variant may evolve prompts, batteries,
 *     weights, and fan-out, but it may NOT change the bridge command interface
 *     the per-slice slices depend on (the typed contract), nor any frozen file.
 *     Parity = "the variant's interface signature hashes equal the incumbent's."
 *     A mismatch means the variant changed the substrate, not the policy — the
 *     constraint that kept 0.8.0 from collapsing the interface. Rejected at the
 *     promotion gate.
 */
import { createHash } from "node:crypto";
import type { HarnessGenome } from "./types.js";

const sha256 = (s: string): string => createHash("sha256").update(s).digest("hex");

/** Canonical JSON with sorted keys — byte-stable regardless of field order. */
function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(",")}}`;
}

/** Content-addressed variant id from the genome (12-hex prefix is plenty). */
export function genomeHash(genome: HarnessGenome): string {
  return sha256(canonical(genome)).slice(0, 16);
}

/**
 * The interface signature a variant must preserve. The bridge command surface
 * (the dispatch arms a slice depends on) is the typed contract; passing the
 * sorted list here means a variant declaring a different command surface fails
 * parity. The incumbent's signature is computed once from the live dispatch
 * table and pinned.
 */
export function interfaceSignature(bridgeCommands: string[]): string {
  return sha256(canonical([...bridgeCommands].sort()));
}

export interface ParityResult {
  ok: boolean;
  incumbent: string;
  variant: string;
}

/** Parity holds iff the variant's interface signature equals the incumbent's. */
export function checkParity(incumbentCommands: string[], variantCommands: string[]): ParityResult {
  const incumbent = interfaceSignature(incumbentCommands);
  const variant = interfaceSignature(variantCommands);
  return { ok: incumbent === variant, incumbent, variant };
}
