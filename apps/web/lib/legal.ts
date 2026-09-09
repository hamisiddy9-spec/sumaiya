// Single source of truth for the operating entity named across the legal pages
// (Terms, Privacy, Cookies). Update this one place when the company is
// incorporated: set `registrationStatus` to the reg number and drop the
// "in registration" qualifier.

export const COMPANY = {
  /** Product this policy set governs. */
  product: "Sumaiya",
  /** Operating legal entity. */
  legalName: "Infoserve Technologies Limited",
  shortName: "Infoserve",
  country: "the United Republic of Tanzania",
  /** Set to the BRELA registration number once incorporated; until then this
   *  qualifier keeps the pages honest rather than claiming a company that does
   *  not yet legally exist. */
  registrationStatus: "registration in progress",
  /** Optional — leave "" to hide the registered office line until it exists. */
  registeredOffice: "",
  supportEmail: "support@sumaiya.pro",
  /** Courts named for dispute resolution. */
  jurisdictionCourts: "the courts of Dar es Salaam, Tanzania",
  effectiveDate: "August 2026",
} as const;

/** "Infoserve Technologies Limited (registration in progress)" or, once set,
 *  "Infoserve Technologies Limited (Reg. No. 123456789)". */
export function entityLine(): string {
  return `${COMPANY.legalName} (${COMPANY.registrationStatus})`;
}
