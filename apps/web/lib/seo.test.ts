import { describe, expect, it } from "vitest";
import { alternatesFor, pathForLocale } from "./seo";

/**
 * The defect these cover: every page shipped `canonical: "/templates"` for both
 * locales, so the English page declared itself a duplicate of the Swahili one,
 * and the site had no hreflang tags at all.
 */
describe("alternatesFor", () => {
  it("gives Swahili the locale-less URL, which is what the sitemap advertises", () => {
    expect(alternatesFor("/templates", "sw").canonical).toBe("/templates");
  });

  it("no longer canonicalises the English page onto the Swahili one", () => {
    const en = alternatesFor("/templates", "en");
    const sw = alternatesFor("/templates", "sw");
    expect(en.canonical).toBe("/en/templates");
    expect(en.canonical).not.toBe(sw.canonical);
  });

  it("links both locales so neither is invisible to a crawler", () => {
    const { languages } = alternatesFor("/templates", "sw");
    expect(languages.sw).toBe("/templates");
    expect(languages.en).toBe("/en/templates");
    expect(languages["x-default"]).toBe("/templates");
  });

  it("handles the homepage without producing a double slash", () => {
    expect(pathForLocale("/", "sw")).toBe("/");
    expect(pathForLocale("", "sw")).toBe("/");
    expect(pathForLocale("/", "en")).toBe("/en");
    expect(alternatesFor("/", "sw").canonical).toBe("/");
  });

  it("is stable whatever shape the path arrives in", () => {
    for (const input of ["templates", "/templates", "/templates/", "  /templates  "]) {
      expect(pathForLocale(input, "sw")).toBe("/templates");
      expect(pathForLocale(input, "en")).toBe("/en/templates");
    }
  });

  it("keeps nested paths intact", () => {
    expect(pathForLocale("/templates/rift", "en")).toBe("/en/templates/rift");
    expect(alternatesFor("/blog/how-to-write-a-cv", "sw").canonical).toBe("/blog/how-to-write-a-cv");
  });

  it("falls back to the default locale for an unknown or missing locale", () => {
    expect(alternatesFor("/about", undefined).canonical).toBe("/about");
    expect(alternatesFor("/about", "fr").canonical).toBe("/about");
    expect(alternatesFor("/about", "").canonical).toBe("/about");
  });

  it("never emits an absolute URL itself — metadataBase resolves it", () => {
    // A hardcoded origin here would drift from NEXT_PUBLIC_APP_URL the moment
    // the host moves again, which is exactly the bug class this file prevents.
    const { canonical, languages } = alternatesFor("/tools", "en");
    expect(canonical.startsWith("http")).toBe(false);
    for (const url of Object.values(languages)) {
      expect(url.startsWith("http")).toBe(false);
    }
  });
});
