import { splitReplyIntoBubbles } from "./reply-bubbles";

describe("splitReplyIntoBubbles", () => {
  it("returns nothing for empty/whitespace text", () => {
    expect(splitReplyIntoBubbles("")).toEqual([]);
    expect(splitReplyIntoBubbles("   \n  ")).toEqual([]);
  });

  it("keeps a short reply as one bubble even with a paragraph break", () => {
    const short = "Sawa.\n\nNiambie zaidi.";
    expect(splitReplyIntoBubbles(short)).toEqual([short]);
  });

  it("keeps a single long paragraph as one bubble — nothing to split on", () => {
    const long = "x".repeat(300);
    expect(splitReplyIntoBubbles(long)).toEqual([long]);
  });

  it("splits a long multi-paragraph reply into separate bubbles", () => {
    const p1 = "First paragraph that is reasonably long on its own and keeps going a bit more.";
    const p2 = "Second paragraph continuing the thought with quite a bit more detail than the first.";
    const text = `${p1}\n\n${p2}`;
    expect(splitReplyIntoBubbles(text)).toEqual([p1, p2]);
  });

  it("caps at 3 bubbles, folding overflow into the last one", () => {
    const parts = [
      "one long enough paragraph here to matter on its own",
      "two long enough paragraph here to matter on its own",
      "three long enough paragraph here to matter on its own",
      "four long enough paragraph here to matter on its own",
    ];
    const text = parts.join("\n\n");
    const out = splitReplyIntoBubbles(text);
    expect(out).toHaveLength(3);
    expect(out[0]).toBe(parts[0]);
    expect(out[1]).toBe(parts[1]);
    expect(out[2]).toBe(`${parts[2]}\n\n${parts[3]}`);
    // Nothing lost — every original paragraph's text still appears somewhere.
    for (const p of parts) expect(out.join("\n\n")).toContain(p);
  });
});
