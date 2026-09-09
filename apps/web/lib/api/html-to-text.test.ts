import { describe, it, expect } from "vitest";
import { htmlToText } from "@/lib/api/page-text";

describe("htmlToText", () => {
  it("decodes entities BEFORE stripping tags — encoded tags never materialize", () => {
    expect(htmlToText("&lt;div&gt;Hello&lt;/div&gt;")).toBe("Hello");
    expect(htmlToText("We need &lt;b&gt;React&lt;/b&gt; devs")).toBe("We need React devs");
  });

  it("drops script/style/noscript content entirely", () => {
    const out = htmlToText(
      "<p>Real job text</p><script>alert('xss')</script><style>.x{}</style><noscript>no</noscript>",
    );
    expect(out).toContain("Real job text");
    expect(out).not.toContain("alert");
    expect(out).not.toContain("xss");
    expect(out).not.toContain(".x{}");
    expect(out).not.toContain("no");
  });

  it("preserves block-level line breaks", () => {
    const out = htmlToText("<div>One</div><div>Two</div><ul><li>A</li><li>B</li></ul>");
    expect(out).toBe("One\nTwo\nA\nB");
  });

  it("strips unterminated tag-like text at end of string", () => {
    expect(htmlToText("Role: Engineer <span style=\"fo")).toBe("Role: Engineer");
  });

  it("decodes numeric and named entities", () => {
    expect(htmlToText("O&#39;Brien &amp; Sons &mdash; it&rsquo;s live")).toBe("O'Brien & Sons \u2014 it\u2019s live");
  });

  it("keeps comparison operators readable", () => {
    expect(htmlToText("Salary < 100k &gt; average")).toBe("Salary < 100k > average");
  });
});
