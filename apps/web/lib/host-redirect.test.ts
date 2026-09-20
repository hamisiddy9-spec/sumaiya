import { describe, it, expect } from "vitest";
import { canonicalHostRedirect, CANONICAL_ORIGIN } from "./host-redirect";

describe("canonicalHostRedirect", () => {
  it("redirects the raw Vercel deployment host, root and deep paths, preserving query strings", () => {
    expect(canonicalHostRedirect("sumaiya-web.vercel.app", "/", "")).toBe(`${CANONICAL_ORIGIN}/`);
    expect(canonicalHostRedirect("sumaiya-web.vercel.app", "/templates/rift-cl", "?ref=qr")).toBe(
      `${CANONICAL_ORIGIN}/templates/rift-cl?ref=qr`,
    );
  });

  it("redirects the legacy sumaiyaai.vercel.app project alias", () => {
    expect(canonicalHostRedirect("sumaiyaai.vercel.app", "/jobs", "")).toBe(`${CANONICAL_ORIGIN}/jobs`);
  });

  it("redirects www.sumaiya.app to the bare canonical origin", () => {
    expect(canonicalHostRedirect("www.sumaiya.app", "/ats-checker", "")).toBe(`${CANONICAL_ORIGIN}/ats-checker`);
  });

  it("does not redirect the canonical host itself", () => {
    expect(canonicalHostRedirect("sumaiya.app", "/jobs", "")).toBeNull();
  });

  it("does not redirect a Vercel preview deployment host", () => {
    expect(canonicalHostRedirect("sumaiya-web-git-main-hamis.vercel.app", "/", "")).toBeNull();
  });

  it("matches case-insensitively", () => {
    expect(canonicalHostRedirect("SUMAIYA-WEB.VERCEL.APP", "/jobs", "")).toBe(`${CANONICAL_ORIGIN}/jobs`);
  });

  it("ignores a trailing port", () => {
    expect(canonicalHostRedirect("sumaiya-web.vercel.app:3000", "/jobs", "")).toBe(`${CANONICAL_ORIGIN}/jobs`);
  });

  it("does not redirect a null or empty host", () => {
    expect(canonicalHostRedirect(null, "/jobs", "")).toBeNull();
    expect(canonicalHostRedirect("", "/jobs", "")).toBeNull();
  });
});
