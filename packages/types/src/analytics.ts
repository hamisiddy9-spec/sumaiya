/**
 * The activation funnel — the single shared definition of the stages a new
 * user walks from "created an account" to "has a real CV and applied to a job".
 *
 * Shared by web and native (both depend on `@sumaiya/types`) so the same moment
 * can never be logged under two different names from two surfaces. Event names
 * are stable snake_case tokens and are NEVER localised: a Swahili-language user
 * must land in the same funnel as an English-language one. Event *properties*
 * carry only primitives (never user content), so they are bilingual-safe too.
 *
 * `order` is the canonical stage order. `template_selected` is deliberately
 * last — it can happen at any point while a CV is being built, so it is
 * measured as an attribute of the funnel rather than a strict sequential gate.
 */
export type FunnelEventName =
  | "signed_up"
  | "onboarded"
  | "profile_completed"
  | "cv_created"
  | "cv_exported"
  | "application_created"
  | "template_selected";

export interface FunnelStage {
  /** Stable event name — import it from `FUNNEL_EVENTS`, never type it raw. */
  name: FunnelEventName;
  /** 1-based position in the funnel. */
  order: number;
  /** One-sentence definition of what reaching this stage means. */
  definition: string;
}

export const ACTIVATION_FUNNEL: readonly FunnelStage[] = Object.freeze([
  {
    name: "signed_up",
    order: 1,
    definition:
      "The user created an account — observed as the first successful sign-in of a new account (property `isNew` distinguishes it from a returning sign-in).",
  },
  {
    name: "onboarded",
    order: 2,
    definition:
      "The user finished first-run onboarding — the guided intro / CV wizard, reached whether they completed it or explicitly skipped it.",
  },
  {
    name: "profile_completed",
    order: 3,
    definition:
      "The user saved their career profile (name, headline, summary, experience, education, skills, goals).",
  },
  {
    name: "cv_created",
    order: 4,
    definition: "The user created and saved their first CV.",
  },
  {
    name: "cv_exported",
    order: 5,
    definition: "The user exported a CV as a PDF.",
  },
  {
    name: "application_created",
    order: 6,
    definition: "The user created a job application (applied to a job).",
  },
  {
    name: "template_selected",
    order: 7,
    definition:
      "The user selected a CV template — recorded whenever it happens (not a strict sequential gate).",
  },
]);

/** Name constants — `track(FUNNEL_EVENTS.cv_created, …)` instead of a bare string. */
export const FUNNEL_EVENTS = Object.freeze(
  ACTIVATION_FUNNEL.reduce(
    (acc, stage) => {
      acc[stage.name] = stage.name;
      return acc;
    },
    {} as Record<FunnelEventName, FunnelEventName>,
  ),
);
