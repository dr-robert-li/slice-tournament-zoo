/**
 * STZ 0.9.6 — Contract Plane types (PHASED-PLAN Phase 1).
 *
 * The contract is the net-new bounded correctness object: a typed layer of
 * `requirement`, `predicate`, `contract_delta`, each with provenance and an
 * explicit state machine. It is NOT a full formal-spec system — predicates are
 * machine-checkable-where-cheap (diff / file / JSON / CLI-output / targeted
 * assertion), never runtime pre/post/invariant instrumentation across arbitrary
 * repos (that was the non-implementable part of the earlier plans).
 *
 * Design anchors inherited from `types.ts`: N1 (auditability — every field is
 * reconstructible), N6 (determinism — no timestamps in the content-addressed
 * core; provenance carries an explicit human-accept event instead).
 */

/** Contract artifact lifecycle (PHASED-PLAN §3). Agents may only advance to
 *  `proposed`; only a human may cross into `accepted` (the 7th gate). */
export type ContractState =
  | "draft"
  | "proposed"
  | "accepted"
  | "active"
  | "challenged"
  | "superseded"
  | "sunset";

/** Legal state transitions. Any edge not listed is rejected by `transition`. */
export const CONTRACT_TRANSITIONS: Record<ContractState, ContractState[]> = {
  draft: ["proposed", "sunset"],
  proposed: ["accepted", "draft", "sunset"],
  accepted: ["active", "challenged", "superseded", "sunset"],
  active: ["challenged", "superseded", "sunset"],
  challenged: ["active", "superseded", "sunset"],
  superseded: [],
  sunset: [],
};

/** Predicate kinds — the cheap, machine-checkable subset only. */
export type PredicateType =
  | "invariant"
  | "postcondition"
  | "non-mutation"
  | "boundary-condition"
  | "compatibility-check";

/**
 * A machine-checkable predicate check. `output-assertion` runs an implementation
 * on `input` and compares stdout to `expect`; `diff-constraint` asserts a
 * property of the candidate diff (e.g. touched-file globs); `json-invariant`
 * asserts a JSON-path equality. All are cheap and deterministic — no runtime
 * instrumentation. The evaluator core is PURE: it consumes an already-observed
 * value (`observed[checkId]`) and compares; the IO shell (experiment runner /
 * bridge) produces observations by executing the impl.
 */
export interface PredicateCheck {
  /** Stable id, unique within the predicate. */
  checkId: string;
  kind: "output-assertion" | "diff-constraint" | "json-invariant" | "file-invariant";
  /** For output-assertion: the input passed to the impl. */
  input?: string;
  /** The expected observation (string-compared to the produced observation). */
  expect: string;
  /** Human-readable description of what this check enforces. */
  description: string;
}

/** One machine-checkable success predicate bound to code symbols. */
export interface Predicate {
  schemaVersion: 1;
  id: string; // e.g. "pred.ipv4.octet-range.v1"
  kind: "predicate";
  state: ContractState;
  /** Owning requirement id. */
  requirement: string;
  type: PredicateType;
  /** Code symbols this predicate is anchored to (unfaithfulness mitigation). */
  scope: { symbols: string[] };
  /** The machine-checkable checks; a predicate PASSES iff every check passes. */
  checks: PredicateCheck[];
  severity: "low" | "medium" | "high";
  provenance: Provenance;
}

/** A user/business intent, gated by human acceptance. */
export interface Requirement {
  schemaVersion: 1;
  id: string; // e.g. "req.ipv4.strict-validation.v1"
  kind: "requirement";
  state: ContractState;
  title: string;
  statement: string;
  rationale: string;
  owner: string;
  acceptance: { predicates: string[]; tests: string[] };
  risk: { severity: "low" | "medium" | "high"; surfaces: string[] };
  provenance: Provenance;
}

/** A proposed change to the contract, emitted by arena agents, accepted by humans. */
export interface ContractDelta {
  schemaVersion: 1;
  id: string;
  kind: "contract_delta";
  state: ContractState;
  op: "add" | "modify" | "sunset";
  /** Target artifact id (or new id for `add`). */
  target: string;
  /** Runs that evidence this delta (edge-hunt survivors, candidate proposals). */
  evidenceRuns: string[];
  provenance: Provenance;
}

/**
 * Provenance carries the human-accept event — the α>0 exogenous signal. An agent
 * proposes (`proposedByRun`); a human alone may accept (`acceptedBy` must be a
 * non-empty human identity, never an agent role — enforced by the engine).
 */
export interface Provenance {
  proposedByRun: string;
  acceptedBy?: string;
  acceptedAt?: string;
}

export type ContractArtifact = Requirement | Predicate | ContractDelta;

/** A run-ready contract slice: accepted artifacts only. */
export interface ContractSlice {
  schemaVersion: 1;
  sliceId: string;
  requirements: Requirement[];
  predicates: Predicate[];
}
