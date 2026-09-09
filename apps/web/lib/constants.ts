export const DocumentStatus = { DRAFT: 'draft', COMPLETE: 'complete' } as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

export const SubscriptionStatus = { ACTIVE: 'active', TRIALING: 'trialing', CANCELLED: 'cancelled', EXPIRED: 'expired', PAST_DUE: 'past_due' } as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PlanType = { TRIAL: 'trial', MONTHLY: 'monthly', ANNUAL: 'annual' } as const;
export type PlanType = (typeof PlanType)[keyof typeof PlanType];

export const CurrencyType = { USD: 'USD', KES: 'KES', TZS: 'TZS' } as const;
export type CurrencyType = (typeof CurrencyType)[keyof typeof CurrencyType];
