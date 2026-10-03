// Single source of truth for the operating entity named across the legal pages
// (Terms, Privacy, Cookies). Update this one place when the company is
// incorporated: set `registrationStatus` to the reg number and drop the
// "in registration" qualifier.
//
// `supportEmail` below is the ONE documented exception to "no first-party
// runtime config points at another product's origin": it deliberately stays
// on templatehub.pro because that domain runs on Google Workspace and
// sumaiya.app has no MX records, so mail to @sumaiya.app bounces. URLs moved
// to sumaiya.app; mailboxes did not, because there is nowhere for them to
// move to. Do not "fix" this without first setting up mail on sumaiya.app —
// see apps/native/src/lib/app-hosts.ts for the same note on the app side.

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
  supportEmail: "support@templatehub.pro",
  /** Courts named for dispute resolution. */
  jurisdictionCourts: "the courts of Dar es Salaam, Tanzania",
  effectiveDate: "August 2026",
} as const;

/** "Infoserve Technologies Limited (registration in progress)" or, once set,
 *  "Infoserve Technologies Limited (Reg. No. 123456789)". */
export function entityLine(): string {
  return `${COMPANY.legalName} (${COMPANY.registrationStatus})`;
}
