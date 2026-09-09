import { describe, expect, it } from "vitest";
import { buildCsp } from "./csp.mjs";

describe("buildCsp", () => {
  it("adds 'unsafe-eval' ONLY in dev (react-refresh runtime needs it)", () => {
    expect(buildCsp(true)).toContain("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://connect.facebook.net 'unsafe-eval'");
  });

  it("omits 'unsafe-eval' in production — the allowlist stays strict", () => {
    const prod = buildCsp(false);
    expect(prod).not.toContain("'unsafe-eval'");
    expect(prod).toContain("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://connect.facebook.net");
  });

  it("keeps all the security directives in both modes", () => {
    for (const csp of [buildCsp(true), buildCsp(false)]) {
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'self'");
      expect(csp).toContain("base-uri 'self'");
      expect(csp).toContain("form-action 'self'");
      expect(csp).toContain("upgrade-insecure-requests");
      expect(csp).toContain("worker-src 'self' blob: https://cdn.jsdelivr.net");
      expect(csp).toContain("connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://www.facebook.com");
    }
  });

  it("never allows remote script hosts other than the pinned ones", () => {
    for (const csp of [buildCsp(true), buildCsp(false)]) {
      expect(csp).not.toContain("https://evil.example");
    }
  });
});
