// Client-visible feature flags.
//
// PAYMENTS_ENABLED gates the pricing / "view plans" / checkout UI. It is driven
// by the public env switch NEXT_PUBLIC_PAYMENTS_ENABLED (default off), so the
// PayMe Africa checkout stays hidden until the end-to-end flow is confirmed and
// the switch is flipped to "true" in the deploy environment. The matching
// SERVER switch is PAYMENTS_ENABLED (read in lib/api/payme.ts) — both must be
// "true" for a real charge: the server one lets the API run, this one shows the
// UI. Keeping them separate lets the API be tested while checkout stays dark.
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
