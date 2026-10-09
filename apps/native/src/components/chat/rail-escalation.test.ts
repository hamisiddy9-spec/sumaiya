import { RAIL_ESCALATE_AFTER_S, shouldEscalate } from "./rail-escalation";
import type { ChatStep, ChatStepState } from "./chat-progress";

/** A step list at the given states, in the rail's own order. */
const steps = (...states: ChatStepState[]): ChatStep[] =>
  states.map((state, i) => ({ id: "think", state, label: { en: `Step ${i}`, sw: `Hatua ${i}` } })) as ChatStep[];

describe("when the rail opens itself", () => {
  it("keeps the quiet one-liner while the turn is healthy and brief", () => {
    expect(shouldEscalate(steps("done", "current"), 0)).toBe(false);
    expect(shouldEscalate(steps("done", "current"), 4)).toBe(false);
    expect(shouldEscalate(steps("done", "current"), RAIL_ESCALATE_AFTER_S - 1)).toBe(false);
  });

  it("opens itself once the wait is long enough to deserve an explanation", () => {
    expect(shouldEscalate(steps("done", "current"), RAIL_ESCALATE_AFTER_S)).toBe(true);
    expect(shouldEscalate(steps("done", "current"), 30)).toBe(true);
  });

  it("opens IMMEDIATELY on a failed step, whatever the clock says", () => {
    // This is the whole reason the surface exists. Three pulsing dots look identical whether the
    // request is healthy or dead, and on metered data a user who cannot tell re-sends and pays
    // twice — so a failure must never be allowed to keep looking like a healthy wait.
    expect(shouldEscalate(steps("done", "failed"), 0)).toBe(true);
    expect(shouldEscalate(steps("failed"), 1)).toBe(true);
  });

  it("treats the failed step as a trigger even when it is not last", () => {
    expect(shouldEscalate(steps("done", "failed", "pending"), 0)).toBe(true);
  });

  it("never escalates an empty list on a failure it does not have", () => {
    expect(shouldEscalate([], 0)).toBe(false);
    expect(shouldEscalate([], RAIL_ESCALATE_AFTER_S)).toBe(true); // time alone is still enough
  });

  it("takes the threshold as a parameter, so the policy is testable without waiting", () => {
    expect(shouldEscalate(steps("current"), 5, 5)).toBe(true);
    expect(shouldEscalate(steps("current"), 5, 6)).toBe(false);
  });
});
