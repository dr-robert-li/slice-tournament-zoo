/**
 * STZ 0.9.6 — Contract traceability (PHASED-PLAN Phase 1).
 *
 * Auto-generated requirement → predicate edges (N1 auditability). Validates that
 * the contract graph is well-formed before a slice is trusted: every accepted
 * requirement has ≥1 predicate, and every predicate links to an existing
 * requirement. Cheap, pure, deterministic.
 */
import type { Predicate, Requirement } from "./contract-types.js";

export interface TraceEdge {
  requirement: string;
  predicate: string;
}

export interface TraceabilityReport {
  edges: TraceEdge[];
  /** Accepted requirements with no predicate — cannot be verified. */
  orphanRequirements: string[];
  /** Predicates pointing at a requirement that does not exist. */
  danglingPredicates: string[];
  valid: boolean;
}

export function buildTraceability(
  requirements: Requirement[],
  predicates: Predicate[],
): TraceabilityReport {
  const reqIds = new Set(requirements.map((r) => r.id));
  const edges: TraceEdge[] = [];
  const danglingPredicates: string[] = [];

  for (const p of predicates) {
    if (reqIds.has(p.requirement)) {
      edges.push({ requirement: p.requirement, predicate: p.id });
    } else {
      danglingPredicates.push(p.id);
    }
  }

  const covered = new Set(edges.map((e) => e.requirement));
  const orphanRequirements = requirements
    .filter((r) => r.state === "accepted" || r.state === "active")
    .filter((r) => !covered.has(r.id))
    .map((r) => r.id);

  return {
    edges,
    orphanRequirements,
    danglingPredicates,
    valid: orphanRequirements.length === 0 && danglingPredicates.length === 0,
  };
}
