/**
 * Canonical URLs and hreflang for every public page.
 *
 * Why this exists. Every marketing page declared
 *
 *     alternates: { canonical: "/templates" }
 *
 * and that same absolute-looking path was emitted for BOTH locales. So the
 * English page told search engines it was a duplicate of the Swahili one, and
 * nothing anywhere linked the two together — there was not a single hreflang
 * tag on the site. For a product whose pitch is bilingual, the English pages
 * were effectively invisible.
 *
 * The URL shape, taken from what the sitemap actually advertises and what the
 * middleware actually serves:
 *
 *   /templates      Swahili — the default locale, served at the locale-less URL
 *   /en/templates   English
 *
 * So the default locale keeps the short URL as its canonical, English gets the
 * /en prefix, and hreflang ties them together. A page that appeared at both
 * /templates and /sw/templates now consolidates onto /templates, which is the
 * one the sitemap publishes.
 */

export const CANONICAL_ORIGIN = process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.app";

export const LOCALES = ["sw", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Swahili is the audience — Tanzania and Kenya — so it owns the bare URL. */
export const DEFAULT_LOCALE: Locale = "sw";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "sw" || value === "en";
}

/** "/templates/" -> "/templates"; "" and "/" -> "" */
function normalize(path: string | undefined | null): string {
  if (!path) return "";
  const trimmed = path.trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? `/${trimmed}` : "";
}

/** The public path this content lives at, in the given locale. */
export function pathForLocale(path: string | undefined | null, locale: Locale): string {
  const clean = normalize(path);
  if (locale === DEFAULT_LOCALE) return clean || "/";
  return `/${locale}${clean}`;
}

export interface Alternates {
  canonical: string;
  languages: Record<string, string>;
}

/**
 * Drop-in replacement for `{ canonical: "/x" }` in a page's generateMetadata.
 *
 *   alternates: alternatesFor("/templates", params.locale)
 */
export function alternatesFor(path: string | undefined | null, locale: string | undefined): Alternates {
  const lang = isLocale(locale) ? locale : DEFAULT_LOCALE;
  return {
    canonical: pathForLocale(path, lang),
    languages: {
      sw: pathForLocale(path, "sw"),
      en: pathForLocale(path, "en"),
      // Which version to show a crawler that speaks neither language.
      "x-default": pathForLocale(path, DEFAULT_LOCALE),
    },
  };
}
