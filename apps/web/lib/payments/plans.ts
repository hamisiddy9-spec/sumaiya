/**
 * Premium plans and their prices — the single source of truth for what a
 * payment buys.
 *
 * Prices are in MINOR units of the currency. TZS has no minor unit, so the
 * numbers are whole shillings; 5000 = TSh 5,000. The monthly price matches the
 * revenue model in the business plan (TSh 5,000/month); annual is ten months'
 * price for twelve months of access.
 *
 * `days` is how long a successful payment extends the buyer's Premium window
 * (profile.premiumUntil — the same field referral rewards use, see
 * lib/referral.ts `grantPremiumDays`). Keeping payments on that one window
 * means the entitlement system already understands a paid user with no new
 * wiring.
 */

export type PlanId = "monthly" | "annual" | "test";

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
  monthly: {
    id: "monthly",
    days: 30,
    amount: { TZS: 5000 },
    labelEn: "Monthly Premium",
    labelSw: "Premium ya Mwezi",
  },
  annual: {
    id: "annual",
    days: 365,
    amount: { TZS: 50000 },
    labelEn: "Annual Premium",
    labelSw: "Premium ya Mwaka",
  },
  // A minimal real-money plan for a live end-to-end test on a real phone
  // (TSh 1,000, 1 day). Not shown on the pricing page — reach it directly at
  // /checkout?plan=test. Refund it in the PayMe portal after testing.
  test: {
    id: "test",
    days: 1,
    amount: { TZS: 1000 },
    labelEn: "Test payment",
    labelSw: "Jaribio la malipo",
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];

export function isPlanId(value: string): value is PlanId {
  return value === "monthly" || value === "annual" || value === "test";
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
