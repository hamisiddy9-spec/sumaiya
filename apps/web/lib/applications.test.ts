import { describe, it, expect } from "vitest";
import { canTransitionStatus, legalStatusTargets, APPLICATION_STATUSES } from "./applications";

describe("canTransitionStatus — application lifecycle state machine", () => {
  it("no-op (same status) is always allowed, even from terminal", () => {
    expect(canTransitionStatus("applied", "applied")).toBe(true);
    expect(canTransitionStatus("rejected", "rejected")).toBe(true);
    expect(canTransitionStatus("archived", "archived")).toBe(true);
  });

  it("terminal states are TERMINAL — a resolved application can never be revived", () => {
    expect(canTransitionStatus("rejected", "applied")).toBe(false);
    expect(canTransitionStatus("rejected", "interviewing")).toBe(false);
    expect(canTransitionStatus("rejected", "offer")).toBe(false);
    expect(canTransitionStatus("archived", "offer")).toBe(false);
    expect(canTransitionStatus("archived", "draft")).toBe(false);
  });

  it("any active pipeline state may move to a terminal outcome", () => {
    expect(canTransitionStatus("draft", "rejected")).toBe(true);
    expect(canTransitionStatus("applied", "rejected")).toBe(true);
    expect(canTransitionStatus("interviewing", "archived")).toBe(true);
    expect(canTransitionStatus("offer", "rejected")).toBe(true);
    expect(canTransitionStatus("offer", "archived")).toBe(true);
  });

  it("forward pipeline moves allowed, including skipping stages", () => {
    expect(canTransitionStatus("draft", "applied")).toBe(true);
    expect(canTransitionStatus("applied", "interviewing")).toBe(true);
    expect(canTransitionStatus("interviewing", "offer")).toBe(true);
    expect(canTransitionStatus("draft", "offer")).toBe(true); // skip applied + interviewing
  });

  it("backward corrections among active states allowed (users misclick)", () => {
    expect(canTransitionStatus("interviewing", "applied")).toBe(true);
    expect(canTransitionStatus("offer", "applied")).toBe(true);
  });

  it("unknown statuses are rejected", () => {
    expect(canTransitionStatus("applied", "bogus")).toBe(false);
    expect(canTransitionStatus("bogus", "applied")).toBe(false);
  });
});

describe("legalStatusTargets", () => {
  it("a terminal application can only stay where it is", () => {
    expect(legalStatusTargets("rejected")).toEqual(["rejected"]);
    expect(legalStatusTargets("archived")).toEqual(["archived"]);
  });

  it("an active application can move forward, backward, or to terminal", () => {
    const targets = legalStatusTargets("applied");
    expect(targets).toContain("applied");        // stay
    expect(targets).toContain("interviewing");   // forward
    expect(targets).toContain("offer");          // skip forward
    expect(targets).toContain("rejected");       // terminal
    expect(targets).toContain("archived");       // terminal
    expect(targets.sort()).toEqual([...APPLICATION_STATUSES].sort());
  });
});
