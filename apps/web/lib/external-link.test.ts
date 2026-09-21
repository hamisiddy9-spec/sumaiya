/**
 * THE FALSE APPLICATION PROMISE, and the leaving-warning that replaced it.
 *
 * The defect: a job card carried a plain `target="_blank"` anchor labelled
 * "Omba" / "Apply". It never applied for anything — it opened the employer's own
 * site — and it threw the user out of Sumaiya with no warning, on the one screen
 * where a jobseeker believes the product is doing the applying. Native fixed the
 * same control first (renamed to "Fungua tangazo" + a consent dialog:
 * apps/native/src/lib/external-link.ts); web follows here.
 *
 * The copy assertions below are the regression guard: the label must not go back
 * to naming an action the control cannot perform, and the warning must exist in
 * both languages and name the site the user is leaving for.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { describe, expect, it } from "vitest";
import { advertLinkLabel, leaveWarning } from "@/lib/external-link";
import { ExternalLink } from "@/components/ui/external-link";

const WEB_ROOT = resolve(__dirname, "..");

function source(rel: string): string {
  return readFileSync(join(WEB_ROOT, rel), "utf8");
}

describe("advertLinkLabel — the label says what the control does", () => {
  it("is 'Fungua tangazo' / 'Open the advert', matching native", () => {
    expect(advertLinkLabel(true)).toBe("Fungua tangazo");
    expect(advertLinkLabel(false)).toBe("Open the advert");
  });

  it("never labels the employer-site link as an application", () => {
    for (const sw of [true, false]) {
      const label = advertLinkLabel(sw);
      expect(label).not.toBe("Omba");
      expect(label).not.toBe("Apply");
      expect(label.toLowerCase()).not.toContain("omba");
    }
  });
});

describe("leaveWarning — the user is told before the browser opens", () => {
  it("exists in both languages and names the employer's site", () => {
    const sw = leaveWarning(true);
    const en = leaveWarning(false);

    expect(sw.title).toBe("Ondoka kwenye Sumaiya?");
    expect(en.title).toBe("Leave Sumaiya?");
    for (const copy of [sw, en]) {
      expect(copy.body.length).toBeGreaterThan(30);
      expect(copy.continueLabel.length).toBeGreaterThan(0);
      expect(copy.cancelLabel.length).toBeGreaterThan(0);
    }
    // Where the user is going, and who does the applying.
    expect(sw.body).toContain("mwajiri");
    expect(sw.body).toContain("kivinjari");
    expect(sw.body).toContain("Sumaiya");
    expect(en.body).toContain("employer");
    expect(en.body).toContain("browser");
    expect(en.body).toContain("Sumaiya");
  });

  it("does not use the English noun 'app' in the Swahili prompt", () => {
    // The native dialog says "Ondoka kwenye app?" (docs/UX-DEFECT-HUNT F57):
    // a Swahili consent line that needs English to be read. Web does not.
    expect(leaveWarning(true).title).not.toContain("app");
  });
});

describe("ExternalLink — the guard is on the control, not beside it", () => {
  const markup = () =>
    renderToStaticMarkup(
      createElement(ExternalLink, { href: "https://employer.example/jobs/1", sw: true }),
    );

  it("renders an armed link with the honest label", () => {
    const html = markup();
    expect(html).toContain("Fungua tangazo");
    expect(html).toContain('href="https://employer.example/jobs/1"');
    expect(html).toContain('data-external-leaving="true"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("does not open anything on render — the warning comes first", () => {
    const html = markup();
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("Ondoka kwenye Sumaiya?");
  });

  it("intercepts the first plain click before the browser moves", () => {
    const component = source("components/ui/external-link.tsx");
    expect(component).toContain("event.preventDefault()");
    expect(component).toContain("setConfirming(true)");
    // The only way out of Sumaiya is the Continue control of the dialog.
    expect(component).toContain('window.open(href, "_blank", "noopener,noreferrer")');
  });
});

describe("every job card that hands off to an employer goes through ExternalLink", () => {
  // Both surfaces of the same promise: the public feed's cards and the
  // signed-in recommendations strip.
  it.each([
    "components/jobs/jobs-feed.tsx",
    "components/jobs/recommended-jobs-section.tsx",
  ])("%s labels the hand-off honestly and arms the warning", (rel) => {
    const src = source(rel);
    expect(src).toContain("<ExternalLink");
    expect(src).toContain("advertLinkLabel");
    // The old false promise, verbatim.
    expect(src).not.toContain('{sw ? "Omba" : "Apply"}');
  });

  it("the jobs page metadata no longer promises applying from here", () => {
    const src = source("app/[locale]/(marketing)/jobs/page.tsx");
    expect(src).not.toContain("omba, na fuatilia");
    expect(src).not.toContain("apply, and track");
    expect(src).not.toContain("all in one place");
    expect(src).toContain("fungua tangazo");
    expect(src).toContain("open the advert");
  });
});
