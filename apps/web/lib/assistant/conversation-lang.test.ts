import { describe, expect, it } from "vitest";
import { countIdenticalUserMessages, detectMessageLang, normalizeMessage } from "./conversation-lang";

describe("detectMessageLang", () => {
  it("detects Swahili conversation on an English default", () => {
    expect(detectMessageLang("nataka kutengeneza CV yangu tafadhali")).toBe("sw");
    expect(detectMessageLang("hii haionekani kama tangazo la kazi")).toBe("sw");
    expect(detectMessageLang("naweza kuona kazi zinazofanana na mimi?")).toBe("sw");
    expect(detectMessageLang("asante sana, endelea")).toBe("sw");
  });

  it("detects English conversation on a Swahili default", () => {
    expect(detectMessageLang("I want to create my CV please")).toBe("en");
    expect(detectMessageLang("this doesn't look like a job posting")).toBe("en");
    expect(detectMessageLang("can you show me matching jobs?")).toBe("en");
    expect(detectMessageLang("thank you very much, continue")).toBe("en");
  });

  it("returns null on a tie or no signal (keep current language)", () => {
    expect(detectMessageLang("")).toBeNull();
    expect(detectMessageLang("hello")).toBeNull(); // "hello" is in neither list
    expect(detectMessageLang("12345")).toBeNull();
    expect(detectMessageLang("okay hmm")).toBeNull();
  });

  it("treats the loanword 'cv' as English", () => {
    expect(detectMessageLang("cv")).toBe("en");
  });

  it("does not flip on a pasted job description (content, not conversation)", () => {
    // A typical English job ad has lots of English words — but even a mixed
    // one must not be treated as conversation; callers skip JD-looking text.
    expect(detectMessageLang("Software Engineer at Acme. Requirements: 5 years experience, skills in React.")).toBe("en");
  });
});

describe("countIdenticalUserMessages", () => {
  const mk = (role: string, content: string) => ({ role, content });

  it("counts previous identical user messages, ignoring case/punctuation", () => {
    const messages = [
      mk("assistant", "hi there"),
      mk("user", "Hello!  How are you?"),
      mk("assistant", "I'm well"),
      mk("user", "hello how are you"),
    ];
    expect(countIdenticalUserMessages(messages, "hello how are you")).toBe(2);
  });

  it("excludes the message being submitted (not yet in the thread)", () => {
    const messages = [mk("user", "hi"), mk("user", "hi"), mk("user", "bye")];
    expect(countIdenticalUserMessages(messages, "hi")).toBe(2);
    expect(countIdenticalUserMessages(messages, "bye")).toBe(1);
  });

  it("treats attached-content differently from raw text", () => {
    const messages = [{ role: "user", content: "my resume", apiContent: "[The user attached a file]. Content below..." }];
    expect(countIdenticalUserMessages(messages, "my resume")).toBe(0);
    expect(countIdenticalUserMessages(messages, "[The user attached a file]. Content below...")).toBe(1);
  });

  it("returns 0 for empty or whitespace", () => {
    expect(countIdenticalUserMessages([mk("user", "x")], "")).toBe(0);
    expect(countIdenticalUserMessages([mk("user", "x")], "   ")).toBe(0);
  });

  it("normalizeMessage collapses punctuation and case", () => {
    expect(normalizeMessage("  Hello,  WORLD!!! ")).toBe("hello world");
    expect(normalizeMessage("")).toBe("");
  });
});
