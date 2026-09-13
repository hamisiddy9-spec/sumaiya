import { describe, it, expect } from "vitest";
import {
  classifyRoute,
  isAppPath,
  isAssistantOnlyPath,
  isMarketingPath,
  isProtectedPath,
  isTemplateHubHost,
} from "./routing";

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

// ─── The host split ─────────────────────────────────────────────────────────
// Two products share this deployment. These tests pin the two things that were
// actually wrong in production: templatehub.pro rendered the Sumaiya landing at
// its root (the vercel.json `has: host` rewrite never fired — middleware runs
// first and rewrote `/` to /sw before the edge rewrite could match), and the
// assistant's surfaces were servable on the catalog's domain.
describe("host split", () => {
  it("templatehub.pro serves the TemplateHub landing at its root, in the visitor's language", () => {
    expect(classifyRoute("/", "sw", "templatehub.pro")).toEqual({
      kind: "marketing-rewrite",
      to: "/sw/pro",
    });
    expect(classifyRoute("/", "en", "templatehub.pro")).toEqual({
      kind: "marketing-rewrite",
      to: "/en/pro",
    });
  });

  it("www, case, port and the FQDN trailing dot are the same host", () => {
    for (const h of ["www.templatehub.pro", "TEMPLATEHUB.PRO", "templatehub.pro:443", "templatehub.pro."]) {
      expect(classifyRoute("/", "sw", h).kind).toBe("marketing-rewrite");
      expect(isTemplateHubHost(h)).toBe(true);
    }
  });

  it("sumaiya.app keeps its own landing at the root", () => {
    // `/sw/` and not `/sw`: the bare-path rewrite is `/${lang}${pathname}` and
    // pathname is "/" — unchanged from before the split, and Next normalises it.
    expect(classifyRoute("/", "sw", "sumaiya.app")).toEqual({
      kind: "marketing-rewrite",
      to: "/sw/",
    });
    expect(classifyRoute("/", "sw", "www.sumaiya.app")).toEqual({
      kind: "marketing-rewrite",
      to: "/sw/",
    });
  });

  it("a host we don't recognise gets the full app, not the TemplateHub shell", () => {
    // Preview URLs, localhost, an IP, a bare Vercel domain. Defaulting to
    // "unknown host ⇒ full app" is the safe direction: every surface works
    // there, so a misconfigured host degrades to today's behaviour instead of
    // hiding the product.
    for (const h of [undefined, null, "", "localhost:3000", "127.0.0.1", "sumaiya-abc.vercel.app", "notemplatehub.pro"]) {
      expect(classifyRoute("/", "sw", h)).toEqual({ kind: "marketing-rewrite", to: "/sw/" });
      expect(isTemplateHubHost(h)).toBe(false);
    }
  });

  it("assistant surfaces on templatehub.pro go to sumaiya.app", () => {
    for (const p of ["/assistant", "/assistant/history", "/studio", "/studio/abc", "/voice", "/interview", "/snap", "/dashboard", "/applications", "/brief", "/career-interview"]) {
      expect(classifyRoute(p, "sw", "templatehub.pro")).toEqual({
        kind: "cross-host",
        to: `https://sumaiya.app${p}`,
      });
    }
  });

  it("the same surfaces stay put on sumaiya.app", () => {
    expect(classifyRoute("/assistant", "sw", "sumaiya.app").kind).toBe("passthrough");
    expect(classifyRoute("/dashboard", "sw", "sumaiya.app").kind).toBe("protected");
    expect(classifyRoute("/assistant", "sw").kind).toBe("passthrough");
  });

  it("shared surfaces stay on both hosts — the split divides pages, not products", () => {
    // The catalog, the tools, the editor, auth and legal pages are the same
    // product on either host.
    for (const p of ["/templates", "/templates/rift-cl", "/tools", "/editor/cv/try", "/cv", "/sign-in", "/terms"]) {
      expect(classifyRoute(p, "sw", "templatehub.pro").kind).toBe(
        classifyRoute(p, "sw", "sumaiya.app").kind,
      );
    }
  });

  it("the split divides PAGES, never ENDPOINTS — the shipped APK lives on /api", () => {
    // pro.sumaiya.app 1.6.11 has www.templatehub.pro baked in as its API base
    // and its App Links host. If this ever stops being "passthrough" on the
    // TemplateHub host, every installed user breaks.
    for (const p of ["/api/health", "/api/app/update", "/api/auth/callback", "/api/cron/jobs"]) {
      expect(classifyRoute(p, "sw", "templatehub.pro").kind).toBe("passthrough");
    }
    // App Links / deep links: .well-known must serve, and it is file-like.
    expect(classifyRoute("/.well-known/assetlinks.json", "sw", "templatehub.pro").kind).toBe("passthrough");
    expect(classifyRoute("/downloads/sumaiya.apk", "sw", "templatehub.pro").kind).toBe("passthrough");
  });

  it("prefix matching for assistant-only paths is boundary-safe", () => {
    // /snap-to-apply and /snap-export are NOT /snap.
    expect(isAssistantOnlyPath("/snap-to-apply")).toBe(false);
    expect(isAssistantOnlyPath("/snap")).toBe(true);
    expect(isAssistantOnlyPath("/snap/abc")).toBe(true);
    expect(isAssistantOnlyPath("/voicex")).toBe(false);
    expect(isAssistantOnlyPath("/assistant")).toBe(true);
    expect(classifyRoute("/snap-to-apply", "sw", "templatehub.pro").kind).toBe("marketing-rewrite");
  });
});
