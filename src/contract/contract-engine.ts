/**
 * STZ 0.9.6 — Contract engine (PHASED-PLAN Phase 1).
 *
 * Deterministic core: state-machine transitions, the human 7th gate, and the
 * contract-slice compiler. All LLM work (drafting requirements, proposing
 * predicates) lives in markdown subagents; this module only validates and
 * persists the typed result — mirroring the bridge's "deterministic decisions,
 * agents do the generation" split.
 */
import {
  CONTRACT_TRANSITIONS,
  type ContractArtifact,
  type ContractSlice,
  type ContractState,
  type Predicate,
  type Requirement,
} from "./contract-types.js";

/** Agent role identities that must NEVER appear as a human approver. Accepting
 *  a contract artifact is the α>0 exogenous signal — an agent cannot supply it. */
export const AGENT_ROLE_IDENTITIES = new Set<string>([
  "contract-architect",
  "clarifier",
  "contract-verifier",
  "specimen",
  "candidate-patcher",
  "edge-explorer",
  "rubric-author",
  "rubric-judge",
  "promoter",
  "planner",
  "judge",
  "test-author",
  "documenter",
  "researcher",
  "agent",
  "automatic",
  "system",
]);

export class ContractStateError extends Error {
  constructor(message: string) {
    super(`[contract] ${message}`);
    this.name = "ContractStateError";
  }
}

export class HumanGateError extends Error {
  constructor(message: string) {
    super(`[contract:human-gate] ${message}`);
    this.name = "HumanGateError";
  }
}

/** Validate + apply one state transition. Throws on an illegal edge. */
export function transition<T extends ContractArtifact>(artifact: T, to: ContractState): T {
  const allowed = CONTRACT_TRANSITIONS[artifact.state];
  if (!allowed.includes(to)) {
    throw new ContractStateError(
      `illegal transition ${artifact.state} → ${to} for ${artifact.id} ` +
        `(allowed: ${allowed.join(", ") || "none"})`,
    );
  }
  return { ...artifact, state: to };
}

/**
 * The human 7th gate. Cross a proposed artifact into `accepted` — the ONLY path
 * to trusted contract state. `approver` must be a non-empty human identity, not
 * an agent role. This asymmetry is what makes STZ's RSI bounded and defensible.
 */
export function humanAccept<T extends ContractArtifact>(
  artifact: T,
  approver: string,
  acceptedAt: string,
): T {
  const id = approver.trim();
  if (id === "") {
    throw new HumanGateError(`accept of ${artifact.id} requires a non-empty human approver`);
  }
  if (AGENT_ROLE_IDENTITIES.has(id.toLowerCase())) {
    throw new HumanGateError(
      `approver "${approver}" is an agent role — only a human may accept contract ` +
        `artifacts (the α>0 exogenous signal). Supply a real human identity.`,
    );
  }
  if (artifact.state !== "proposed") {
    throw new ContractStateError(
      `${artifact.id} must be in state 'proposed' to be accepted, is '${artifact.state}'`,
    );
  }
  const accepted = transition(artifact, "accepted");
  return {
    ...accepted,
    provenance: { ...accepted.provenance, acceptedBy: id, acceptedAt },
  };
}

/**
 * Phase-2 propose-not-apply guard. Candidate arena agents may EMIT contract
 * deltas but may never apply them — any candidate-emitted delta must be in
 * `draft` or `proposed`, never already-trusted (`accepted`/`active`). Throws on
 * a delta a candidate tried to self-apply. This is the arena-side half of the
 * "no direct writes to trusted state" boundary.
 */
export function assertProposalsNotApplied(deltas: ContractArtifact[]): void {
  const applied = deltas.find((d) => d.state !== "draft" && d.state !== "proposed");
  if (applied) {
    throw new ContractStateError(
      `candidate-emitted artifact ${applied.id} is '${applied.state}' — arena agents may ` +
        `only propose (draft/proposed); trusted state is reached solely via the human accept gate`,
    );
  }
}

/**
 * Compile a run-ready contract slice from accepted artifacts only. Rejects any
 * non-accepted artifact — an arena run may only target trusted contract state.
 */
export function buildContractSlice(
  sliceId: string,
  requirements: Requirement[],
  predicates: Predicate[],
): ContractSlice {
  const isTrusted = (s: ContractState) => s === "accepted" || s === "active";
  const badReq = requirements.find((r) => !isTrusted(r.state));
  if (badReq) {
    throw new ContractStateError(
      `requirement ${badReq.id} is '${badReq.state}', not accepted/active — cannot enter a run slice`,
    );
  }
  const badPred = predicates.find((p) => !isTrusted(p.state));
  if (badPred) {
    throw new ContractStateError(
      `predicate ${badPred.id} is '${badPred.state}', not accepted/active — cannot enter a run slice`,
    );
  }
  return { schemaVersion: 1, sliceId, requirements, predicates };
}
