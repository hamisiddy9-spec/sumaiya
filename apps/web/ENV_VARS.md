# Environment Variables — Quick Reference

## How to Get Each Value

### Supabase (4 values)
1. Go to https://supabase.com/dashboard → Your Project → Settings → API
2. Copy:
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` → service_role secret key
3. Go to Settings → Database → Connection string
4. Copy:
   - `DATABASE_URL` → postgresql://postgres:PASSWORD@db.XXXX.supabase.co:5432/postgres

### Better Auth (2 values)
1. `BETTER_AUTH_SECRET` → Run: `npx auth secret` → copy output
2. `BETTER_AUTH_URL` → Your production URL (e.g., https://www.templatehub.pro)

### Google OAuth (2 values)
1. Go to https://console.cloud.google.com → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://YOUR-SUPABASE-URL.supabase.co/auth/v1/callback`
4. Copy:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
5. Enable Google provider in Supabase: Authentication → Providers → Google

### Stripe (3 values)
1. Go to https://dashboard.stripe.com → Developers → API keys
2. Copy:
   - `STRIPE_SECRET_KEY` → sk_live_xxxxx
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → pk_live_xxxxx
3. Go to Developers → Webhooks → Add endpoint
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Copy: `STRIPE_WEBHOOK_SECRET` → whsec_xxxxx

### PayMe Africa (payments — current provider)
1. Register at https://portal.paymeafrica.com/register → issues an App ID + secret
2. Set:
   - `PAYME_APP_ID`
   - `PAYME_APP_SECRET`
   - `PAYME_SANDBOX=1` for the sandbox, unset for production
   - `PAYME_CALLBACK_URL=https://www.templatehub.pro/api/payments/callback`
   - `PAYME_REDIRECT_URL=https://www.templatehub.pro/checkout/success`
3. Add the callback URL in the PayMe portal webhook settings.
4. Charging stays OFF until BOTH `PAYMENTS_ENABLED=true` and
   `NEXT_PUBLIC_PAYMENTS_ENABLED=true`. Verify a sandbox `collection` round-trips
   a valid signature (portal.paymeafrica.com/labs) before enabling.

_PesaPal (`PESAPAL_*`) is retired — the integration was swapped for PayMe Africa._

### PostHog — product analytics, session replay, flags, surveys (2–3 values)
1. Go to https://posthog.com → your project → Settings → Project API Key
2. Set:
   - `NEXT_PUBLIC_POSTHOG_KEY` → the `phc_...` project API key (client)
   - `NEXT_PUBLIC_POSTHOG_HOST` → `https://eu.i.posthog.com` (already set) or your region host
   - `POSTHOG_API_KEY` → (optional) same project key, used by `lib/analytics/server.ts`
     for server-side events (AI cost, tool invocations, outcomes). Falls back to
     `NEXT_PUBLIC_POSTHOG_KEY` if unset.
3. With no key set, analytics degrades to Vercel-Analytics-only (the prior
   behaviour) — nothing breaks. Session replay masks all inputs + CV content by
   default; Do-Not-Track is honoured.

### Resend (1 value)
1. Go to https://resend.com → API Keys
2. Create key → Copy: `RESEND_API_KEY`

---

## Current Production Values (from Vercel)

The following are set on Vercel production environment. To get the actual values:
1. Go to https://vercel.com/hamisiddy9-9360s-projects/sumaiya/settings/environment-variables
2. Click "Show" on each encrypted value
3. Copy into your local `.env.local`

| Variable | Status |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Set (encrypted) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Set (encrypted) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set (encrypted) |
| `BETTER_AUTH_SECRET` | ✅ Set (encrypted) |
| `GOOGLE_CLIENT_ID` | ✅ Set |
| `GOOGLE_CLIENT_SECRET` | ✅ Set (encrypted) |

**Missing from Vercel (must add manually):**
- `DATABASE_URL` — Get from Supabase dashboard → Settings → Database
- `RESEND_API_KEY` — Get from resend.com
- `PAYME_APP_ID` — Get from portal.paymeafrica.com
- `PAYME_APP_SECRET` — Get from portal.paymeafrica.com
- `PAYME_CALLBACK_URL`, `PAYME_REDIRECT_URL`, `PAYME_SANDBOX`
- `STRIPE_SECRET_KEY` — Get from stripe.com
- `STRIPE_WEBHOOK_SECRET` — Get from stripe.com
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Get from stripe.com
