/**
 * Every external hand-off on the web must warn the user before the browser
 * leaves Sumaiya — the same owner requirement native already enforces in
 * `apps/native/src/lib/external-link.ts` (2026-09-12).
 *
 * Why this exists: a job card's control used to be a plain `target="_blank"`
 * anchor labelled "Omba" / "Apply". It never applied for anything — it opened
 * the employer's own site — so the label promised an action the product does
 * not perform, and the tap silently threw the user out of Sumaiya with no
 * warning. Native fixed the identical control by renaming it "Fungua tangazo"
 * and adding a consent dialog; this module is the web half of that fix, so
 * both surfaces say the same thing and neither opens a browser unannounced.
 *
 * The copy lives here (not inline in a component) because it is the string the
 * tests and the Swahili lint can reach: a pure function, no JSX, no window.
 */

export interface LeaveWarning {
  /** Honest label for the control: it opens the employer's advert, nothing more. */
  label: string;
  /** Dialog title. */
  title: string;
  /** Dialog body — says where the user is going and who does the applying. */
  body: string;
  /** Affirmative control of the consent dialog. */
  continueLabel: string;
  /** Dismissive control of the consent dialog. */
  cancelLabel: string;
}

/**
 * The label for the control that opens an employer's job advert.
 *
 * NOT "Omba" / "Apply": this control cannot apply for anything. Native renamed
 * the same control to "Fungua tangazo" — the two surfaces are kept identical.
 */
export function advertLinkLabel(sw: boolean): string {
  return sw ? "Fungua tangazo" : "Open the advert";
}

/**
 * The warning shown before leaving Sumaiya. The Swahili is Sumaiya's own voice
 * (she is the one opening it), names the product the user is leaving, and says
 * plainly that the application itself happens on the employer's site.
 */
export function leaveWarning(sw: boolean): LeaveWarning {
  return sw
    ? {
        label: advertLinkLabel(true),
        title: "Ondoka kwenye Sumaiya?",
        body: "Nakufungulia tangazo hili kwenye kivinjari chako, kwenye tovuti ya mwajiri. Ombi unalituma huko — hapa Sumaiya unaweza kulifuatilia.",
        continueLabel: "Endelea",
        cancelLabel: "Ghairi",
      }
    : {
        label: advertLinkLabel(false),
        title: "Leave Sumaiya?",
        body: "I'll open this advert in your browser, on the employer's site. The application is sent there — here in Sumaiya you can track it.",
        continueLabel: "Continue",
        cancelLabel: "Cancel",
      };
}

/** Severing the opener is the security half of the warning; `window.open` is
 *  called from exactly one place (the component's Continue control) so no
 *  caller can bypass the consent step. */
