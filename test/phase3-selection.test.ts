/**
 * EARN Phase 3 (guarded on the canonical TS core): an accepted predicate changes
 * tournament selection. Runs the real contract-verifier against real observations
 * produced by executing the dep-constraint substrate candidates — so this test,
 * unlike the result.json assertions, exercises src/verifiers/contract-verifier.ts
 * end-to-end against the substrate.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Predicate } from "../src/contract/contract-types.js";
import { evaluatePredicates, type Observations } from "../src/contract/predicate-eval.js";
import {
  scoreContract,
  contractChangesSelection,
  testsOnlyRank,
  contractAwareRank,
  type RankableCandidate,
} from "../src/verifiers/contract-verifier.js";
import { measureCodeHealth } from "../src/eval-runner.js";
import { evalReward } from "../src/selection.js";
import type { EvalResult } from "../src/types.js";

const SUB = join(__dirname, "..", "experiments", "0.9.6-evolution", "earn-phase1-depconstraint");
const contract = JSON.parse(readFileSync(join(SUB, "predicates.json"), "utf8")) as { predicates: Predicate[] };
const suiteJs = join(SUB, "good-faith-suite.mjs");
const depCheck = join(SUB, "check-no-new-dep.mjs");
const baseline = join(SUB, "baseline");

function observe(dir: string): { testPassRate: number; observed: Observations } {
  const suite = JSON.parse(execFileSync("node", [suiteJs, dir], { encoding: "utf8" }).trim()) as { passRate: number };
  const observed: Observations = {
    "no-new-dep": execFileSync("node", [depCheck, baseline, dir], { encoding: "utf8" }).trim(),
    canonical: suite.passRate >= 1 ? "true" : "false",
  };
  return { testPassRate: suite.passRate, observed };
}

function candidate(id: string, dir: string): RankableCandidate {
  const { testPassRate, observed } = observe(dir);
  const results = evaluatePredicates(contract.predicates, observed);
  return { candidateId: id, testPassRate, contract: scoreContract(id, results) };
}

describe("Phase 3 — contract changes selection (funded hypothesis)", () => {
  // naive listed FIRST so tests-only (tie → first) would pick the wrong one.
  const cands = [candidate("naive", join(SUB, "naive")), candidate("correct", baseline)];

  it("both candidates pass the functional suite (tests-only cannot distinguish)", () => {
    expect(cands.every((c) => c.testPassRate === 1)).toBe(true);
    expect(testsOnlyRank(cands).winner).toBe("naive"); // the non-conforming one, by tie order
  });

  it("STZ's REAL multi-objective reward also cannot distinguish them (not a strawman baseline)", () => {
    // codeHealth reads a single impl source; it never reads package.json, so the
    // gratuitous dependency is invisible to it. The two impls are logically
    // identical, so every reward component ties → evalReward ties → STZ's shipped
    // selection cannot down-rank the dep-adder. The predicate is NOT redundant
    // with codeHealth; it supplies a signal STZ's real reward structurally lacks.
    const chNaive = measureCodeHealth(join(SUB, "naive", "pad.mjs"));
    const chCorrect = measureCodeHealth(join(baseline, "pad.mjs"));
    expect(chNaive).toBe(chCorrect); // dependency is invisible to codeHealth
    const mk = (specimen: string, codeHealth: number): EvalResult => ({
      specimen, passedGate: true, testPassRate: 1, coverage: 1, mutationScore: 0,
      hackFindings: [], codeHealth, suspicion: 0,
    });
    expect(evalReward(mk("naive", chNaive))).toBe(evalReward(mk("correct", chCorrect)));
  });

  it("the high-severity predicate hard-fails the dep-adding candidate", () => {
    const naive = cands.find((c) => c.candidateId === "naive")!;
    expect(naive.contract.hardFail).toBe(true);
    expect(naive.contract.hardFailReasons).toContain("pred.pad.no-new-dependency.v1");
  });

  it("contract-aware selection changes the winner to the correct candidate", () => {
    expect(contractAwareRank(cands).winner).toBe("correct");
    const change = contractChangesSelection(cands);
    expect(change.changed).toBe(true);
    expect(change.testsOnlyWinner).toBe("naive");
    expect(change.contractAwareWinner).toBe("correct");
  });

  it("committed result.json reflects the earned selection change", () => {
    const r = JSON.parse(
      readFileSync(join(__dirname, "..", "experiments", "0.9.6-evolution", "earn-phase3-selection", "result.json"), "utf8"),
    ) as { changed: boolean; contractAwareWinner: string };
    expect(r.changed).toBe(true);
    expect(r.contractAwareWinner).toBe("correct");
  });
});
