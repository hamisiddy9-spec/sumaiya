# Sumaiya — Agent Onboarding Guide

## What is Sumaiya?
A document template SaaS for building CVs and cover letters. Users can:
- Sign in with email/password or Google OAuth
- Create, edit, and download CVs (PDF)
- Create, edit, and download cover letters (PDF)
- 11 professional templates
- Upgrade to Pro for unlimited documents
- Admin dashboard for user management

## Stack
- **Framework:** Next.js 14 (App Router)
- **Auth:** Better Auth (magic link + Google OAuth)
- **Database:** Supabase (Postgres) via Drizzle ORM
- **API:** Hono (mounted at `/api/*`)
- **Payments:** Stripe (cards) + PesaPal (M-Pesa/mobile money)
- **Styling:** Tailwind CSS
- **AI:** Anthropic/OpenAI (optional — for AI enhance feature)
- **Email:** Resend

## Repository
- **GitHub:** https://github.com/hamisiddy9-spec/sumaiya
- **Live:** https://www.templatehub.pro
- **Vercel Project:** `hamisiddy9-9360s-projects/sumaiya`

## Quick Start

```bash
# 1. Clone
git clone git@github.com:hamisiddy9-spec/sumaiya.git
cd Sumaiya

# 2. Install
npm install --legacy-peer-deps

# 3. Environment — Option A: Pull from Vercel (recommended)
#    Get Vercel token from https://vercel.com/account/tokens
#    Then run:
npx --yes vercel link --yes
npx --yes vercel env pull .env.local --environment production --yes

#    NOTE: Encrypted secrets (SUPABASE_SERVICE_ROLE_KEY, BETTER_AUTH_SECRET,
#    GOOGLE_CLIENT_SECRET) will show as ***. You MUST set these manually from
#    the Vercel dashboard at:
#    https://vercel.com/hamisiddy9-9360s-projects/sumaiya/settings/environment-variables
#    Copy each value and paste into .env.local

# 3. Environment — Option B: Manual setup
cp .env.example .env.local
# Edit .env.local with real values from:
# - Supabase dashboard → Settings → API
# - Google Cloud Console → Credentials
# - Stripe dashboard → API keys
# - PesaPal dashboard → API credentials
# - Resend dashboard → API key

# 4. Database
npx drizzle-kit push

# 5. Run
npm run dev
```

## Environment Variables Reference

| Variable | Source | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Settings → API | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Settings → API | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Settings → API | Admin DB access |
| `DATABASE_URL` | Supabase dashboard → Settings → Database | Postgres connection |
| `BETTER_AUTH_SECRET` | Generate with `npx auth secret` | Auth session signing |
| `BETTER_AUTH_URL` | Your deployed URL | Auth callback URL |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Google OAuth |
| `STRIPE_SECRET_KEY` | Stripe dashboard | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard | Webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard | Client-side Stripe |
| `PESAPAL_CONSUMER_KEY` | PesaPal dashboard | Mobile money payments |
| `PESAPAL_CONSUMER_SE | PesaPal | Mobile money |

CRET` | PesaPal dashboard | dashboard |
| `RESEND_API_KEY` | Resend dashboard | Transactional email |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL | App base URL |

## Project Structure

```
app/
├── (auth)/              # Auth pages (sign-in, verify)
├── (dashboard)/         # Protected dashboard pages
│   ├── checkout/        # Stripe checkout
│   ├── dashboard/       # User dashboard
│   ├── editor/          # CV & cover letter editors
│   └── settings/        # Account settings
├── (marketing)/         # Public pages
│   ├── page.tsx         # Landing page
│   ├── templates/       # Template gallery
│   ├── pricing/         # Pricing page
│   ├── contact/         # Contact form
│   ├── privacy/         # Privacy policy
│   └── terms/           # Terms of service
├── api/
│   ├── [[...route]]/route.ts   # Hono API catch-all
│   └── auth/[...all]/route.ts  # Better Auth handler
components/
├── editor/              # CV & cover letter editors
├── templates/           # 11 CV template renderers
├── dashboard/           # Dashboard components
└── settings/            # Settings form
lib/
├── api/routes/          # Hono route handlers (cv, cover-letter, payments, ai, user)
├── supabase/            # Supabase client/server/middleware
├── db/                  # Drizzle schema & connection
├── stores/              # Zustand stores
└── auth*.ts             # Better Auth config
```

## Key Architecture Decisions

1. **Hono + Better Auth coexistence:** Better Auth handles `/api/auth/*` via its own catch-all. Hono handles everything else (`/api/*`). User management routes moved from `/api/auth/update-user` to `/api/user` to avoid conflict with Better Auth catch-all.

2. **Drizzle ORM:** Database schema in `lib/db/schema.ts`. Push with `npx drizzle-kit push`.

3. **State management:** Zustand stores in `lib/stores/editor-store.ts` for editor state. React state for UI.

4. **PDF generation:** jsPDF on client side. Fabric.js for canvas-based CV editing.

5. **Payments:** Stripe for cards, PesaPal for mobile money (M-Pesa). Webhook at `/api/payments/ipn` (PesaPal) and `/api/payments/webhook` (Stripe).

## Known Issues

- **Google Sign-In:** `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}` — Google OAuth provider may not be enabled in Supabase dashboard. Enable at: Supabase Dashboard → Authentication → Providers → Google.
- **PesaPal IPN:** The IPN endpoint is public (required by PesaPal). In production, verify the PesaPal signature.
- **`node_modules`:** Do NOT commit to repo. Already in `.gitignore`.

## Deploying

```bash
# Production deploy
npx --yes vercel --yes --prod

# Set env var on Vercel
echo "value" | npx --yes vercel env add VAR_NAME production --yes
```

## Git Workflow

- Main branch: `master`
- Push to GitHub triggers auto-deploy on Vercel
- Always test build locally first: `npm run build`

## Contacts

- **Owner:** @Mweuc (Telegram)
- **Support Email:** nore Sumaiya (CV template SaaS)
- **Live URL:** https://www.templatehub.pro
