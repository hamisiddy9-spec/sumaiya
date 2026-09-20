import { describe, it, expect } from "vitest";
import {
  classifyRoute,
  isAppPath,
  isMarketingPath,
  isProtectedPath,
  missingSupabasePublicEnv,
  SUPABASE_PUBLIC_ENV,
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

// Regression guard for the Sept 2026 production outage: the public Supabase env
// vars were empty in the deploy, so createServerClient() threw inside the Edge
// middleware. Vercel reports a middleware exception as
// MIDDLEWARE_INVOCATION_FAILED, which took out EVERY protected route with a
// generic 500 while the marketing pages stayed 200. The middleware now consults
// this helper first and redirects to /sign-in instead of throwing.
describe("missingSupabasePublicEnv", () => {
  it("reports nothing when both public Supabase values are set", () => {
    expect(
      missingSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      }),
    ).toEqual([]);
  });

  it("ignores unrelated env vars", () => {
    expect(
      missingSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
        DATABASE_URL: "postgres://x",
        SUPABASE_SERVICE_ROLE_KEY: "service-role",
        PATH: "/usr/bin",
      }),
    ).toEqual([]);
  });

  it("treats an EMPTY value as missing — the exact prod failure mode", () => {
    // The deploy had the variables defined but empty, so `!env[key]` is the
    // condition that must catch it. A truthiness bug here would reproduce the
    // outage.
    expect(
      missingSupabasePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
      }),
    ).toEqual([...SUPABASE_PUBLIC_ENV]);
  });

  it("names the specific variable that is absent", () => {
    expect(missingSupabasePublicEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key" })).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);
    expect(missingSupabasePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" })).toEqual([
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it("reports both when the env bag is empty", () => {
    expect(missingSupabasePublicEnv({})).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });
});
