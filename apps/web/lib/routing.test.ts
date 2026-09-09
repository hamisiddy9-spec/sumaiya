import { describe, it, expect } from "vitest";
import { classifyRoute, isAppPath, isMarketingPath, isProtectedPath } from "./routing";

describe("route classification", () => {
  it("marketing paths rewrite into the [locale] tree", () => {
    for (const p of ["/", "/templates", "/templates/rift-cl", "/jobs", "/blog/x", "/about", "/app"]) {
      const d = classifyRoute(p, "sw");
      expect(d.kind).toBe("marketing-rewrite");
      if (d.kind === "marketing-rewrite") expect(d.to).toBe(`/sw${p}`);
    }
    expect(classifyRoute("/pricing", "en")).toEqual({ kind: "marketing-rewrite", to: "/en/pricing" });
  });

  it("known (app) routes pass through (or gate if protected)", () => {
    expect(classifyRoute("/assistant", "sw").kind).toBe("passthrough");
    expect(classifyRoute("/editor/cv/try", "sw").kind).toBe("passthrough");
    expect(classifyRoute("/voice", "sw").kind).toBe("passthrough");
    expect(classifyRoute("/dashboard", "sw").kind).toBe("protected");
    expect(classifyRoute("/settings/account", "sw").kind).toBe("protected");
    expect(classifyRoute("/editor/cv/abc123", "sw").kind).toBe("protected"); // saved doc
  });

  it("/api and /_next pass through untouched", () => {
    expect(classifyRoute("/api/anything", "sw").kind).toBe("passthrough");
    expect(classifyRoute("/_next/data/x", "sw").kind).toBe("passthrough");
  });

  it("UNKNOWN bare paths route into [locale] (→ clean 404, never 500)", () => {
    for (const p of ["/nope-xyz", "/old-blog-link", "/templatess", "/xyz/abc"]) {
      const d = classifyRoute(p, "sw");
      expect(d.kind).toBe("unknown-rewrite");
      if (d.kind === "unknown-rewrite") expect(d.to).toBe(`/sw${p}`);
    }
  });

  it("root static files pass through — NOT rewritten (regression guard)", () => {
    for (const p of ["/sw.js", "/manifest.json", "/robots.txt", "/sitemap.xml", "/opensearch.xml", "/favicon.ico", "/apple-touch-icon.png"]) {
      expect(classifyRoute(p, "sw").kind).toBe("passthrough");
    }
  });

  it("prefix matching is boundary-safe (no /assistantx false positive)", () => {
    expect(isAppPath("/assistantx")).toBe(false);
    expect(isAppPath("/assistant")).toBe(true);
    expect(isAppPath("/assistant/history")).toBe(true);
    expect(isMarketingPath("/jobsxyz")).toBe(false);
    expect(isProtectedPath("/dashboardx")).toBe(false);
  });
});
