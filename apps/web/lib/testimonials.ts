// Social proof for the landing page.
//
// ⚠️ REPLACE THESE WITH REAL ONES before relying on them for conversion.
// Every entry must be a real person who gave permission — a first name, their
// city, and a specific outcome. Fabricated testimonials are worse than none:
// they're a trust risk if noticed and they attract nobody. Until you have
// real quotes, keep this list SHORT (or empty — the section hides itself).

export interface Testimonial {
  quote: { en: string; sw: string };
  name: string;
  detail: { en: string; sw: string };
}

/**
 * EMPTY ON PURPOSE — do not add a quote until it is a real, named, consented
 * person with a real outcome.
 *
 * The three entries that used to live here ("Amina", "Brian", "Faith") were
 * composite examples, and this file's own header said so. The landing page
 * rendered them under the heading "Watu halisi, kazi halisi" / "Real people,
 * real jobs" — an assertion, above three quotes the visitor could not check,
 * on the page where their trust is being earned. The stranger-read pass named
 * that band the single worst section of the page.
 *
 * Fabricated testimonials are worse than none: they are a trust risk if noticed
 * and they convert nobody. So the list is empty and the band is gone, replaced
 * by three claims a reader can verify in a minute (the PDF is real, there is no
 * account in the way, the Swahili is authored rather than translated).
 *
 * Every entry must be a real person who gave permission — a first name, their
 * city, and a specific outcome. When the outcome ledger starts producing real
 * results, ask those users; until then this stays empty.
 */
export const TESTIMONIALS: Testimonial[] = [];

// ⚠️ REPLACE with the real number (round down, don't inflate). Set to 0 to hide.
// Leave at 0 until the number is measured. There is no measurement behind it today.
export const CVS_CREATED = 0;
