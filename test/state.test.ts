import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  freshState,
  saveState,
  loadState,
  setPhaseStatus,
  appendEvent,
  resumePhase,
  isComplete,
  stateExists,
} from "../src/state.js";
import { PHASES } from "../src/types.js";

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "stz-state-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

describe("F16 state.json checkpoint + recovery", () => {
  it("fresh state starts all phases pending at phase 1", () => {
    const s = freshState("slice-01", 2);
    expect(s.currentPhase).toBe(PHASES[0]);
    expect(Object.values(s.phaseStatus).every((v) => v === "pending")).toBe(true);
  });

  it("save then load round-trips the state (N1 durable)", async () => {
    let s = freshState("slice-01", 3);
    s = setPhaseStatus(s, "elicitation", "done");
    await saveState(root, s);
    expect(stateExists(root, "slice-01")).toBe(true);
    const back = await loadState(root, "slice-01");
    expect(back.phaseStatus.elicitation).toBe("done");
    expect(back.events.length).toBe(s.events.length);
  });

  it("appends a monotonic event sequence (replay spine)", () => {
    let s = freshState("slice-01");
    s = appendEvent(s, "lifecycle", "start", "begin");
    s = appendEvent(s, "elicitation", "note", "x");
    expect(s.events.map((e) => e.seq)).toEqual([0, 1]);
  });

  it("resumePhase re-enters an interrupted running phase (crash recovery)", () => {
    let s = freshState("slice-01");
    s = setPhaseStatus(s, "elicitation", "done");
    s = setPhaseStatus(s, "research", "running"); // crashed mid-research
    expect(resumePhase(s)).toBe("research");
  });

  it("resumePhase advances to first pending when nothing is running", () => {
    let s = freshState("slice-01");
    s = setPhaseStatus(s, "elicitation", "done");
    s = setPhaseStatus(s, "research", "done");
    expect(resumePhase(s)).toBe("ground-truth-validation");
  });

  it("resumePhase returns null when complete, and isComplete is true", () => {
    let s = freshState("slice-01");
    for (const p of PHASES) s = setPhaseStatus(s, p, "done");
    expect(isComplete(s)).toBe(true);
    expect(resumePhase(s)).toBeNull();
  });

  it("halted slice does not resume", () => {
    let s = freshState("slice-01");
    s.escalation = "halted";
    expect(resumePhase(s)).toBeNull();
  });
});
