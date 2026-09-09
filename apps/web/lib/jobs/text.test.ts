import { describe, it, expect } from "vitest";
import { decodeEntities, cleanHtml, clean, sanitizePromptText } from "@/lib/jobs/text";

describe("cleanHtml", () => {
  it("strips raw HTML tags", () => {
    expect(cleanHtml("<div><p>Hello <b>world</b></p></div>")).toBe("Hello world");
  });

  it("decodes entities BEFORE stripping tags — encoded tags never survive", () => {
    // The historical bug: tags were stripped first, then &lt;div&gt; decoded
    // into literal <div> text inside the feed.
    expect(cleanHtml("&lt;div&gt;About us&lt;/div&gt;")).toBe("About us");
    expect(cleanHtml("<p>&lt;strong&gt;Lead&lt;/strong&gt; role</p>")).toBe("Lead role");
    expect(cleanHtml("We need &lt;b&gt;React&lt;/b&gt; devs")).toBe("We need React devs");
  });

  it("decodes numeric decimal and hex entities", () => {
    expect(cleanHtml("&#60;div&#62;Sales&#60;/div&#62;")).toBe("Sales");
    expect(cleanHtml("&#x3C;div&#x3E;Marketing&#x3C;/div&#x3E;")).toBe("Marketing");
    expect(cleanHtml("O&#39;Brien &amp; Sons")).toBe("O'Brien & Sons");
  });

  it("handles double-encoded entities in one pass", () => {
    expect(cleanHtml("&amp;lt;div&amp;gt;Hello&amp;lt;/div&amp;gt;")).toBe("Hello");
  });

  it("decodes curly quotes, dashes and common symbols", () => {
    expect(cleanHtml("It&rsquo;s a &ldquo;great&rdquo; role &mdash; apply now&hellip;"))
      .toBe("It\u2019s a \u201Cgreat\u201D role \u2014 apply now\u2026");
    expect(cleanHtml("Salary \u20AC50k &pound;40k &yen;5M &copy; 2026")).toBe("Salary \u20AC50k \u00A340k \u00A55M \u00A9 2026");
  });

  it("collapses whitespace from block tags instead of gluing words", () => {
    expect(cleanHtml("<ul><li>One</li><li>Two</li></ul><p>Three</p>")).toBe("One Two Three");
    expect(cleanHtml("line1\n\nline2\ttabbed")).toBe("line1 line2 tabbed");
  });

  it("respects the max length", () => {
    expect(cleanHtml("a".repeat(100), 20)).toHaveLength(20);
  });

  it("handles empty / nullish input", () => {
    expect(cleanHtml("")).toBe("");
    expect(cleanHtml(null as unknown as string)).toBe("");
  });

  it("keeps legitimate comparison operators readable", () => {
    expect(cleanHtml("5+ years (10 &gt; candidates)")).toBe("5+ years (10 > candidates)");
  });

  it("strips unterminated tag-like text at end of string (truncated source output)", () => {
    // A source API truncated mid-tag — "<span style=\"fo" has no ">" ever.
    expect(cleanHtml("Growth Strategy & Market Intelligence [20%] <span style=\"fo")).toBe(
      "Growth Strategy & Market Intelligence [20%]",
    );
    // Encoded variant materializes to the same thing after decode.
    expect(cleanHtml("Lead the team &lt;span style=\"fo")).toBe("Lead the team");
    // Comparison operators (space after <) must NOT be eaten.
    expect(cleanHtml("Salary must be < 100k")).toBe("Salary must be < 100k");
  });
});

describe("decodeEntities", () => {
  it("does not throw on invalid numeric codepoints", () => {
    expect(() => decodeEntities("&#99999999;")).not.toThrow();
    expect(() => decodeEntities("&#xFFFFFF;")).not.toThrow();
  });

  it("handles malformed entities without a trailing semicolon", () => {
    expect(decodeEntities("A&nbspB")).toBe("A B");
    expect(decodeEntities("AT&ampT")).toBe("AT&T");
  });

  it("leaves unknown entity-like text alone", () => {
    expect(decodeEntities("R&D is fine")).toBe("R&D is fine");
  });
});

describe("clean", () => {
  it("normalizes short fields", () => {
    expect(clean("  Sales &amp; Marketing  Manager ")).toBe("Sales & Marketing Manager");
    expect(clean("O&#39;Brien")).toBe("O'Brien");
    expect(clean("x".repeat(500), 10)).toHaveLength(10);
  });
});

describe("sanitizePromptText", () => {
  it("strips HTML/entities from untrusted text before it reaches a prompt", () => {
    expect(sanitizePromptText('<div class="content-intro"><p>About <b>IonQ</b></p></div>'))
      .toBe("About IonQ");
    expect(sanitizePromptText("&lt;div&gt;Lead role&lt;/div&gt;")).toBe("Lead role");
  });

  it("never collapses all-markup input to empty (non-destructive)", () => {
    expect(sanitizePromptText("<div><span></span></div>")).toBe("<div><span></span></div>");
    expect(sanitizePromptText("")).toBe("");
  });

  it("respects the cap", () => {
    expect(sanitizePromptText("a".repeat(100) + " <b>b</b>", 50)).toHaveLength(50);
  });
});
