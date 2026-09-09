import { describe, expect, it } from "vitest";
import {
  analyzeConversation,
  buildConversationGuidance,
  classifyIntent,
  isCareerAsk,
  looksLikeNameReply,
  resolveDocKind,
  type MessageLike,
} from "./intent";

const turn = (role: "user" | "assistant", content: string): MessageLike => ({ role, content });

describe("classifyIntent", () => {
  it("greetings (sw + en)", () => {
    for (const g of ["Hi", "hello", "hey!", "Mambo", "habari", "hujambo", "Vipi", "Karibu", "niaje", "good morning", "sasa"]) {
      expect(classifyIntent(g), g).toBe("greeting");
    }
    // one-word slang only: inside a sentence "sasa"/"poa" are adverbs
    expect(classifyIntent("kazi sasa")).toBe("general");
  });

  it("casual chit-chat", () => {
    expect(classifyIntent("Tupige story")).toBe("chitchat");
    expect(classifyIntent("hebu tupige story tu")).toBe("chitchat");
    expect(classifyIntent("vipi leo?")).toBe("chitchat");
    expect(classifyIntent("siku yako imeendaje?")).toBe("chitchat");
    expect(classifyIntent("umekuwaje")).toBe("chitchat");
  });

  it("questions about Sumaiya herself", () => {
    expect(classifyIntent("Upo wapi wewe?")).toBe("about-you");
    expect(classifyIntent("uko wapi?")).toBe("about-you");
    expect(classifyIntent("wewe ni nani?")).toBe("about-you");
    expect(classifyIntent("unafanya nini?")).toBe("about-you");
    expect(classifyIntent("are you a robot?")).toBe("about-you");
  });

  it("sports beats greeting words inside the same message", () => {
    expect(classifyIntent("Vipi matokeo ya mpira leo?")).toBe("sports");
    expect(classifyIntent("matokeo ya premier league")).toBe("sports");
    expect(classifyIntent("simba walicheza vipi")).toBe("sports");
    expect(classifyIntent("naomba matokeo ya mechi")).toBe("sports");
  });

  it("career refusals are caught before anything else", () => {
    expect(classifyIntent("Acha story za kazi kwanza")).toBe("career-refusal");
    expect(classifyIntent("acha story za kazi")).toBe("career-refusal");
    expect(classifyIntent("tosha!")).toBe("career-refusal");
    expect(classifyIntent("basta na maswali")).toBe("career-refusal");
    expect(classifyIntent("usiniulize tena")).toBe("career-refusal");
    expect(classifyIntent("stop with the CV questions")).toBe("career-refusal");
    expect(classifyIntent("nimechoka na kazi")).toBe("career-refusal");
  });

  it("career asks (cv / job / doc)", () => {
    expect(classifyIntent("nataka kutengeneza CV")).toBe("cv");
    expect(classifyIntent("nipe resume yangu")).toBe("cv");
    expect(classifyIntent("naomba kazi ya IT")).toBe("job");
    expect(classifyIntent("nisaidie na maombi ya kazi")).toBe("job");
    expect(classifyIntent("andika barua ya maombi")).toBe("doc");
    expect(classifyIntent("nataka barua ya kazi")).toBe("doc");
    expect(classifyIntent("kadi ya biashara")).toBe("doc");
    expect(classifyIntent("barua rasmi ya kujiuzulu")).toBe("doc");
  });

  it("passing job mentions are NOT career asks", () => {
    expect(classifyIntent("nimeona kazi poa leo")).toBe("general");
    expect(classifyIntent("kazi yangu ni ngumu")).toBe("general");
    expect(isCareerAsk("nimeona kazi nzuri")).toBe(false);
    expect(isCareerAsk("naomba kazi ya IT")).toBe(true);
  });

  it("thanks and bye", () => {
    expect(classifyIntent("asante sana")).toBe("thanks");
    expect(classifyIntent("thank you!")).toBe("thanks");
    expect(classifyIntent("kwaheri")).toBe("bye");
    expect(classifyIntent("see you later")).toBe("bye");
  });

  it("general smalltalk falls through to general", () => {
    expect(classifyIntent("leo kuna jua kali")).toBe("general");
    expect(classifyIntent("nimeamka vizuri")).toBe("general");
  });

  it("playful dismissals are chit-chat, not career signals", () => {
    expect(classifyIntent("Hamna hata karibu")).toBe("chitchat");
  });
});

describe("looksLikeNameReply", () => {
  it("accepts a bare name", () => {
    expect(looksLikeNameReply("Hamis")).toBe(true);
    expect(looksLikeNameReply("John")).toBe(true);
    expect(looksLikeNameReply("Asha Omar")).toBe(true);
    expect(looksLikeNameReply("Jina langu ni Neema")).toBe(true);
    expect(looksLikeNameReply("my name is Grace")).toBe(true);
  });
  it("rejects greetings / questions / career words / long text", () => {
    expect(looksLikeNameReply("Hi")).toBe(false);
    expect(looksLikeNameReply("Mambo vipi")).toBe(false);
    expect(looksLikeNameReply("Upo wapi?")).toBe(false);
    expect(looksLikeNameReply("nataka CV")).toBe(false);
    expect(looksLikeNameReply("nimefanya kazi kwa miaka mitano na...")).toBe(false);
  });
});

describe("resolveDocKind", () => {
  it("maps specific asks to the right doc", () => {
    expect(resolveDocKind("nataka CV yangu")).toBe("cv");
    expect(resolveDocKind("barua ya maombi")).toBe("cover-letter");
    expect(resolveDocKind("cover letter")).toBe("cover-letter");
    expect(resolveDocKind("kadi ya biashara")).toBe("business-card");
    expect(resolveDocKind("barua rasmi")).toBe("letter");
    expect(resolveDocKind("naomba kazi ya meneja")).toBe("cv");
  });
  it("returns null for non-doc messages", () => {
    expect(resolveDocKind("Hi")).toBeNull();
    expect(resolveDocKind("tupige story")).toBeNull();
    expect(resolveDocKind("nimeona kazi nzuri")).toBeNull();
  });
});

describe("analyzeConversation — companion first, never a CV questionnaire", () => {
  it("greeting on turn one → general chat, NO intake", () => {
    const s = analyzeConversation([turn("user", "Hi")], null);
    expect(s.latest).toBe("greeting");
    expect(s.isFirstUserTurn).toBe(true);
    expect(s.docMode).toBeNull();
    expect(s.intakeActive).toBe(false);
    expect(s.lockout).toBe(false);
  });

  it("'tupige story' after a greeting stays general chat", () => {
    const msgs = [turn("user", "Hi"), turn("assistant", "Mambo!"), turn("user", "Tupige story")];
    const s = analyzeConversation(msgs, null);
    expect(s.latest).toBe("chitchat");
    expect(s.docMode).toBeNull();
    expect(s.intakeActive).toBe(false);
  });

  it("'upo wapi' is a natural question, not a CV prompt", () => {
    const s = analyzeConversation([turn("user", "Upo wapi wewe?")], null);
    expect(s.latest).toBe("about-you");
    expect(s.docMode).toBeNull();
    expect(s.intakeActive).toBe(false);
  });

  it("sports mid-chat never triggers intake", () => {
    const msgs = [
      turn("user", "Mambo"),
      turn("assistant", "Poa! Vipi wewe?"),
      turn("user", "Vipi matokeo ya mpira leo?"),
    ];
    const s = analyzeConversation(msgs, null);
    expect(s.latest).toBe("sports");
    expect(s.docMode).toBeNull();
    expect(s.intakeActive).toBe(false);
  });

  it("explicit CV ask engages cv intake", () => {
    const msgs = [turn("user", "Hi"), turn("assistant", "Karibu!"), turn("user", "nataka kutengeneza CV")];
    const s = analyzeConversation(msgs, null);
    expect(s.latest).toBe("cv");
    expect(s.docMode).toBe("cv");
    expect(s.intakeActive).toBe(true);
  });

  it("a doc chip (docType param) keeps intake active on answers", () => {
    const msgs = [
      turn("user", "CV / Wasifu"),
      turn("assistant", "Unatafuta kazi gani?"),
      turn("user", "nilifanya kazi TPDC kama network engineer"),
    ];
    const s = analyzeConversation(msgs, "cv");
    expect(s.latest).toBe("general");
    expect(s.docMode).toBe("cv");
    expect(s.intakeActive).toBe(true);
  });

  it("guest funnel: first-turn name starts a CV build", () => {
    const s = analyzeConversation([turn("user", "Hamis")], null);
    expect(s.latest).toBe("name");
    expect(s.docMode).toBe("cv");
    expect(s.intakeActive).toBe(true);
  });

  it("topic switch mid-build pauses intake (this turn only)", () => {
    const msgs = [
      turn("user", "CV / Wasifu"),
      turn("assistant", "Unatafuta kazi gani?"),
      turn("user", "Vipi matokeo ya mpira leo?"),
    ];
    const s = analyzeConversation(msgs, "cv");
    expect(s.latest).toBe("sports");
    expect(s.docMode).toBe("cv"); // still chosen, not locked yet
    expect(s.intakeActive).toBe(false); // but do NOT gather this turn
    expect(s.lockout).toBe(false);
    expect(s.leaveDocMode).toBe(false);
  });

  it("second topic switch mid-build locks career out and clears doc mode", () => {
    const msgs = [
      turn("user", "CV / Wasifu"),
      turn("assistant", "Unatafuta kazi gani?"),
      turn("user", "Vipi matokeo ya mpira leo?"),
      turn("assistant", "😄 sijui hiyo"),
      turn("user", "Tupige story"),
    ];
    const s = analyzeConversation(msgs, "cv");
    expect(s.lockout).toBe(true);
    expect(s.lockoutThisTurn).toBe(true);
    expect(s.docMode).toBeNull();
    expect(s.intakeActive).toBe(false);
    expect(s.leaveDocMode).toBe(true); // client should drop the CV chip
  });

  it("explicit refusals lock out even with a doc selected", () => {
    const msgs = [
      turn("user", "CV / Wasifu"),
      turn("assistant", "Kazi gani unayolenga?"),
      turn("user", "Acha story za kazi kwanza"),
    ];
    const s = analyzeConversation(msgs, "cv");
    expect(s.careerRefusals).toBeGreaterThanOrEqual(1);
    // one refusal alone does not lock yet
    expect(s.lockout).toBe(false);
    expect(s.intakeActive).toBe(false);

    const msgs2 = [...msgs, turn("assistant", "sawa 😄"), turn("user", "sijui, acha kabisa")];
    const s2 = analyzeConversation(msgs2, "cv");
    expect(s2.lockout).toBe(true);
    expect(s2.leaveDocMode).toBe(true);
  });

  it("a career re-ask after lockout resets it", () => {
    const locked = [
      turn("user", "CV / Wasifu"),
      turn("assistant", "Kazi gani?"),
      turn("user", "acha hizo"),
      turn("assistant", "sawa"),
      turn("user", "tupige story"),
    ];
    expect(analyzeConversation(locked, "cv").lockout).toBe(true);

    const reengaged = [...locked, turn("assistant", "hehe sawa"), turn("user", "sawa ngoja, nataka kutengeneza CV sasa")];
    const s = analyzeConversation(reengaged, "cv");
    expect(s.lockout).toBe(false);
    expect(s.docMode).toBe("cv");
    expect(s.intakeActive).toBe(true);
  });

  it("greetings during an active build do NOT lock the user out", () => {
    const msgs = [
      turn("user", "CV / Wasifu"),
      turn("assistant", "Kazi gani?"),
      turn("user", "Mambo, pole pole"),
      turn("assistant", "Karibu 😄"),
      turn("user", "kazi ya meneja wa mauzo"),
    ];
    const s = analyzeConversation(msgs, "cv");
    expect(s.lockout).toBe(false);
    expect(s.docMode).toBe("cv");
  });
});

describe("buildConversationGuidance", () => {
  it("greeting guidance forbids CV gathering", () => {
    const s = analyzeConversation([turn("user", "Hi")], null);
    const g = buildConversationGuidance(s);
    expect(g).toContain("greeting");
    expect(g).toContain("Do NOT start gathering CV/job details");
  });

  it("lockout guidance forbids career offers", () => {
    const msgs = [
      turn("user", "CV / Wasifu"),
      turn("assistant", "Kazi gani?"),
      turn("user", "acha hizo"),
      turn("assistant", "sawa"),
      turn("user", "tupige story"),
    ];
    const s = analyzeConversation(msgs, "cv");
    const g = buildConversationGuidance(s);
    expect(g).toContain("CAREER LOCKOUT IS ACTIVE");
  });

  it("sports guidance bans invented scores", () => {
    const s = analyzeConversation([turn("user", "Vipi matokeo ya mpira leo?")], null);
    const g = buildConversationGuidance(s);
    expect(g).toContain("NEVER invent scores");
  });

  it("about-you guidance answers who/where Sumaiya is", () => {
    const s = analyzeConversation([turn("user", "Upo wapi wewe?")], null);
    const g = buildConversationGuidance(s);
    expect(g).toContain("Sumaiya");
  });

  it("no-doc guidance stops the 'unataka kutengeneza nini' interrogation", () => {
    const s = analyzeConversation([turn("user", "Mambo")], null);
    const g = buildConversationGuidance(s);
    expect(g).toContain("Do NOT ask");
  });
});
