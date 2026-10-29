/**
 * Premium plans and their prices — the single source of truth for what a
 * payment buys.
 *
 * Prices are in MINOR units of the currency. TZS has no minor unit, so the
 * numbers are whole shillings; 1000 = TSh 1,000.
 *
 * The model is ACCESS PASSES, not subscriptions — Tanzanian job-seekers buy
 * for the length of their hunt, then stop, and a 1,000/= day pass is an easy
 * yes where a monthly commitment is not. Anchored against the stationery cost
 * (~2,000/= to type ONE CV): the day pass is half that for unlimited CVs. The
 * day pass is also the plan used for live payment testing (/checkout?plan=day).
 *
 * `days` is how long a successful payment extends the buyer's Premium window
 * (profile.premiumUntil — the same field referral rewards use, see
 * lib/referral.ts `grantPremiumDays`). Keeping payments on that one window
 * means the entitlement system already understands a paid user with no new
 * wiring.
 */

export type PlanId = "day" | "week" | "month";

/** The currency PayMe mobile-money collections settle in. */
export type PayCurrency = "TZS";

export interface PlanDef {
  id: PlanId;
  /** Premium days granted on a successful payment. */
  days: number;
  /** Price in minor units, per currency. */
  amount: Record<PayCurrency, number>;
  labelEn: string;
  labelSw: string;
}

export const PLANS: Record<PlanId, PlanDef> = {
  day: {
    id: "day",
    days: 1,
    amount: { TZS: 1000 },
    labelEn: "Day Pass",
    labelSw: "Siku Moja",
  },
  week: {
    id: "week",
    days: 7,
    amount: { TZS: 3000 },
    labelEn: "Week Pass",
    labelSw: "Wiki Moja",
  },
  month: {
    id: "month",
    days: 30,
    amount: { TZS: 7000 },
    labelEn: "Month Pass",
    labelSw: "Mwezi Mmoja",
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(value: string): value is PlanId {
  return value === "day" || value === "week" || value === "month";
}

/** Price for a plan in a currency, or null when the pair is not offered. */
export function planAmount(plan: PlanId, currency: PayCurrency): number | null {
  return PLANS[plan]?.amount[currency] ?? null;
}

/**
 * Normalize a Tanzanian phone number to the MSISDN PayMe expects:
 * `2557XXXXXXXX` / `2556XXXXXXXX` (12 digits, no `+`). Accepts the shapes a
 * user actually types — `0712…`, `712…`, `+255712…`, `255712…`, with spaces or
 * dashes — and returns null for anything that is not a plausible TZ mobile
 * number, so a bad input is rejected before it ever reaches the provider.
 */
export function normalizeTzMsisdn(input: string | undefined | null): string | null {
  if (!input) return null;
  const digits = input.replace(/[^\d]/g, "");

  let national: string | null = null;
  if (/^0[67]\d{8}$/.test(digits)) national = digits.slice(1); // 0712345678 -> 712345678
  else if (/^[67]\d{8}$/.test(digits)) national = digits; // 712345678
  else if (/^255[67]\d{8}$/.test(digits)) national = digits.slice(3); // 255712345678
  else if (/^2550[67]\d{8}$/.test(digits)) national = digits.slice(4); // 2550712… (mistyped)

  if (!national) return null;
  return `255${national}`;
}
