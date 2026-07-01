// EARN Phase 5 — promotion ledger decision matrix (deterministic).
// Feeds five synthetic evidence records through the 7-gate decision logic and
// emits an append-only ledger. Mirrors src/ledger/promotion-engine.ts (guarded
// by test/ledger.test.ts, which runs the canonical TS core).
// Usage: node run.mjs  (writes result.json + events.jsonl; exit 0 iff the matrix
// shows ≥1 promote AND ≥1 quarantine-from-test-sharpening — the Phase-5 earn).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const GATES_OK = { hackClean: true, sealOk: true, interfaceParity: true, diversityOk: true, beatsIncumbent: true, rubricCalibrated: true };
const CONTRACT_BEARING = new Set(["predicate", "contract_delta", "rubric"]);
const CFG = { minSampleSize: 8, requiredPositiveDelta: 0.03 };

function decide(e) {
  if (e.heldOutRegression) return { decision: "reject", reasons: ["severe regression on held-out set"] };
  const failed = Object.entries(e.sixGates).find(([, ok]) => !ok);
  if (failed) return { decision: "reject", reasons: [`six-gate failed: ${failed[0]}`] };
  if (CONTRACT_BEARING.has(e.kind) && !e.humanAccepted)
    return { decision: "quarantine", reasons: ["contract-bearing: requires human 7th-gate acceptance"] };
  if (e.kind === "test" && e.contractDelta <= 0)
    return { decision: "quarantine", reasons: ["execution-test-only win — test-sharpening guard (docs/PAPER.md)"] };
  if (e.sampleSize < CFG.minSampleSize) return { decision: "quarantine", reasons: [`sample ${e.sampleSize} < ${CFG.minSampleSize}`] };
  const composite = 0.5 * e.executionDelta + 0.5 * e.contractDelta;
  if (composite < CFG.requiredPositiveDelta) return { decision: "quarantine", reasons: [`composite ${composite.toFixed(4)} < ${CFG.requiredPositiveDelta}`] };
  return { decision: "promote", reasons: [`composite +${(composite * 100).toFixed(2)}%`] };
}

const scenarios = [
  { artifactId: "pred.filter-nonmutation.v1", kind: "predicate", humanAccepted: true, sixGates: GATES_OK, heldOutRegression: false, executionDelta: 0.04, contractDelta: 0.06, sampleSize: 8 },
  { artifactId: "pred.no-dep.v1", kind: "predicate", humanAccepted: false, sixGates: GATES_OK, heldOutRegression: false, executionDelta: 0.05, contractDelta: 0.05, sampleSize: 8 },
  { artifactId: "test.sharpened-suite.v1", kind: "test", humanAccepted: true, sixGates: GATES_OK, heldOutRegression: false, executionDelta: 0.20, contractDelta: 0.0, sampleSize: 12 },
  { artifactId: "contract_delta.bad.v1", kind: "contract_delta", humanAccepted: true, sixGates: GATES_OK, heldOutRegression: true, executionDelta: 0.1, contractDelta: 0.1, sampleSize: 10 },
  { artifactId: "pred.interface-broken.v1", kind: "predicate", humanAccepted: true, sixGates: { ...GATES_OK, interfaceParity: false }, heldOutRegression: false, executionDelta: 0.1, contractDelta: 0.1, sampleSize: 10 },
];

const EVENT_TYPE = { promote: "artifact_accepted", quarantine: "artifact_quarantined", reject: "artifact_rejected", sunset: "artifact_sunset" };
const ledger = [];
const decisions = scenarios.map((s) => {
  const v = decide(s);
  ledger.push({ seq: ledger.length, type: EVENT_TYPE[v.decision], artifactId: s.artifactId, artifactKind: s.kind, reasons: v.reasons, evidenceRuns: ["synthetic"] });
  return { artifactId: s.artifactId, kind: s.kind, ...v };
});

const promoted = decisions.filter((d) => d.decision === "promote");
const quarantinedTestSharpening = decisions.filter((d) => d.decision === "quarantine" && d.reasons.join(" ").includes("test-sharpening"));
const earned = promoted.length >= 1 && quarantinedTestSharpening.length >= 1;

const result = {
  substrate: "promotion-ledger-decision-matrix",
  decisions,
  earned,
  verdict: earned
    ? "EARNED — a contract-bearing artifact PROMOTES; a test-only win QUARANTINES (proven test-sharpening guard fires); the 7th human gate and six-gate guard both decline correctly."
    : "NOT EARNED — decision matrix did not show both a promote and a test-sharpening quarantine.",
};
writeFileSync(join(HERE, "events.jsonl"), ledger.map((e) => JSON.stringify(e)).join("\n") + "\n");
writeFileSync(join(HERE, "result.json"), JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify(result, null, 2));
process.exit(earned ? 0 : 1);
