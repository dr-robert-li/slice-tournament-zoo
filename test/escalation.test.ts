import { describe, it, expect } from "vitest";
import {
  initialEscalation,
  onNoPassers,
  isHalted,
  escalationTrace,
  MAX_RETRIES,
  MAX_REPLANS,
} from "../src/escalation.js";

describe("F14 bounded escalation FSM (R1 headline mitigation)", () => {
  it("first failure → GRPO retry", () => {
    const { next, action } = onNoPassers(initialEscalation());
    expect(action.type).toBe("retry");
    expect(next.stage).toBe("grpo-retry");
    expect(next.retryCount).toBe(1);
  });

  it("second failure → replan", () => {
    let s = initialEscalation();
    s = onNoPassers(s).next;
    const { next, action } = onNoPassers(s);
    expect(action.type).toBe("replan");
    expect(next.stage).toBe("replan");
    expect(next.replanCount).toBe(1);
  });

  it("third failure → halt", () => {
    let s = initialEscalation();
    s = onNoPassers(s).next;
    s = onNoPassers(s).next;
    const { next, action } = onNoPassers(s);
    expect(action.type).toBe("halt");
    expect(isHalted(next)).toBe(true);
  });

  it("CEILING HOLDS: trace is exactly retry → replan → halt and terminates", () => {
    const actions = escalationTrace();
    expect(actions.map((a) => a.type)).toEqual(["retry", "replan", "halt"]);
    expect(actions).toHaveLength(MAX_RETRIES + MAX_REPLANS + 1);
  });

  it("halt is absorbing: further calls never escape it", () => {
    let s = initialEscalation();
    for (let i = 0; i < 10; i++) s = onNoPassers(s).next;
    expect(s.stage).toBe("halted");
    expect(s.retryCount).toBeLessThanOrEqual(MAX_RETRIES);
    expect(s.replanCount).toBeLessThanOrEqual(MAX_REPLANS);
  });
});
