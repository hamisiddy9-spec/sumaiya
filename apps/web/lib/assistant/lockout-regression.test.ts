import { describe, it, expect } from "vitest";
import { analyzeConversation } from "./intent";

/* Regression guard for the lockout inversion.
 *
 * "sijui" (I don't know) and "siwezi" (I can't) are how a low-literacy Swahili
 * speaker asks for HELP. They were in REFUSAL_RE, so two of them triggered the
 * hard career lockout and shut the user out of the product. These tests pin the
 * distinction between incapacity (help me) and withdrawal (leave me alone). */

const m = (text: string) => ({ role: "user" as const, content: text });

describe("incapacity must not be read as refusal", () => {
  it("'sijui kuandika' after asking for a job does NOT lock the user out", () => {
    const s = analyzeConversation(
      [m("nataka kazi"), m("siwezi kuandika"), m("sijui kuandika")],
      "cv",
    );
    expect(s.lockout).toBe(false);
    expect(s.careerRefusals).toBe(0);
  });

  it("a bare 'sijui' is not a refusal", () => {
    const s = analyzeConversation([m("nataka kazi"), m("sijui")], "cv");
    expect(s.lockout).toBe(false);
    expect(s.careerRefusals).toBe(0);
  });

  it("'siwezi' alone is not a refusal", () => {
    const s = analyzeConversation([m("nataka kazi"), m("siwezi")], "cv");
    expect(s.lockout).toBe(false);
  });

  it("intake stays ACTIVE, so Sumaiya keeps helping", () => {
    const s = analyzeConversation(
      [m("nataka kazi"), m("sijui kuandika")],
      "cv",
    );
    expect(s.intakeActive).toBe(true);
  });
});

describe("genuine withdrawal still locks out", () => {
  it("'basta' + 'tosha' locks the user out", () => {
    const s = analyzeConversation([m("nataka kazi"), m("basta"), m("tosha")], "cv");
    expect(s.lockout).toBe(true);
  });

  it("a bare 'acha' does NOT match — REFUSAL_RE needs a complement ('acha story')", () => {
    // Recorded deliberately: bare "acha" (stop/leave it) is a real withdrawal in
    // Swahili but slips through, so a user who says only "acha" is not counted.
    // That errs toward HELPING rather than locking out, which is the safe side,
    // but it is a known gap — see the improvements list.
    const s = analyzeConversation([m("nataka kazi"), m("acha")], "cv");
    expect(s.careerRefusals).toBe(0);
    expect(s.lockout).toBe(false);
  });

  it("'acha story' IS a refusal", () => {
    const s = analyzeConversation([m("nataka kazi"), m("acha story"), m("basta")], "cv");
    expect(s.lockout).toBe(true);
  });

  it("'sitaki' (I don't want) still counts as a refusal", () => {
    const s = analyzeConversation([m("nataka kazi"), m("sitaki"), m("sitaki")], "cv");
    expect(s.lockout).toBe(true);
  });

  it("'sihitaji' (I don't need) still counts", () => {
    const s = analyzeConversation([m("nataka kazi"), m("sihitaji"), m("sihitaji")], "cv");
    expect(s.lockout).toBe(true);
  });
});
