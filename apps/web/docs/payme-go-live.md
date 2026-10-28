# PayMe Africa — go-live runbook

**Status (2026-10-28): integration BUILT in this repo, shipped dark.** The
Sumaiya-side PayMe code is live in the tree and gated off behind two switches,
so it does nothing until you turn it on. This is the ordered checklist to turn
it on safely.

> History: an earlier PayMe integration lived only in the old TemplateHub
> product and was never in this repo. The payment stack was retired 2026-09-08.
> The code below is a **fresh** integration built for Sumaiya (not the retired
> one), so ignore any older "built, merged, deployed" claims.

What's in the tree now:
- `lib/api/payme.ts` — HMAC signing, Collection (mobile-money) call, webhook verification
- `lib/api/routes/payments.ts` — `GET /api/payments`, `POST /api/payments/initiate`, `POST /api/payments/callback`, `GET /api/payments/status/:ref`
- `lib/payments/plans.ts` — plans + prices + TZ phone normalization
- `app/(app)/checkout/` + `components/checkout/` — the checkout UI
- analytics: `checkout_started` / `payment_initiated` / `payment_completed` / `payment_failed`

Two switches, both default **off**:
- `PAYMENTS_ENABLED` (server) — lets `/api/payments/initiate` run. Off → `403`.
- `NEXT_PUBLIC_PAYMENTS_ENABLED` (UI) — reveals `/checkout` and pricing links.

Keeping them separate lets you test the API while checkout stays hidden.

---

## Plans (lib/payments/plans.ts)

| Plan | Price | Grants |
|---|---|---|
| `monthly` | TSh 5,000 | 30 days Premium |
| `annual` | TSh 50,000 | 365 days Premium |

Premium rides `profile.premiumUntil` (the same window referrals grant), so a
paid user needs no new entitlement wiring.

---

## Environment variables (what the code actually reads)

| Var | Value | Read by |
|---|---|---|
| `PAYME_APP_ID` | the **Sumaiya** app's X-App-ID (e.g. `SUMAIYA_PROD_01`) | `lib/api/payme.ts` |
| `PAYME_APP_SECRET` | 🔒 the Sumaiya app secret | `lib/api/payme.ts` |
| `PAYME_SANDBOX` | `1` while testing | `lib/api/payme.ts` |
| `PAYME_CALLBACK_URL` | `https://sumaiya.app/api/payments/callback` | `routes/payments.ts` |
| `PAYME_BASE_URL` | *(optional)* defaults to `https://portal.paymeafrica.com/api/v1` | `lib/api/payme.ts` |
| `PAYME_SIG_MODE` | *(optional)* `body_ts` (default) / `ts_body` / `body_dot_ts` | `lib/api/payme.ts` |
| `PAYMENTS_ENABLED` | `true` to arm the server | `lib/api/payme.ts` |
| `NEXT_PUBLIC_PAYMENTS_ENABLED` | `true` to reveal checkout | `lib/features.ts` |

> ⚠️ The `PAYME_APP_ID`/`PAYME_APP_SECRET` already in Vercel (set Sep 19) are the
> **old TemplateHub** app's — replace them with the new Sumaiya app's. There is
> no `PAYME_REDIRECT_URL` in the current flow: Collection is a push-to-phone +
> poll flow, not a hosted-card redirect, so that var is unused.

---

## Phase 1 — Credentials

1. In `portal.paymeafrica.com` → register/confirm the **Sumaiya** app (Website
   `https://sumaiya.app`, IP whitelisting **blank** — Vercel egress IPs are
   dynamic).
2. Copy its **X-App-ID** and **App Secret**.

- [ ] Sumaiya `PAYME_APP_ID` + `PAYME_APP_SECRET` obtained

## Phase 2 — Set env (server armed, UI still dark)

In Vercel (Production): set the eight vars above, with
`PAYMENTS_ENABLED=true` but `NEXT_PUBLIC_PAYMENTS_ENABLED=false`, and
`PAYME_SANDBOX=1`.

## Phase 3 — Deploy

Merge `claude/amazing-noether-w3rzvb` → `main` (or point a preview at the
branch) and deploy. Env changes only take effect on a new deployment.

Verify the route is live:
```bash
curl -s https://sumaiya.app/api/payments
# → {"provider":"payme","enabled":true,"configured":true,"sandbox":true}
```
- `enabled:false` → `PAYMENTS_ENABLED` not `true` / not redeployed
- `configured:false` → `PAYME_APP_ID`/`SECRET` missing

## Phase 4 — Confirm the signature (the one unknown)

PayMe's exact signature byte-order isn't documented. The client defaults to
`body_ts` (`HMAC-SHA256(secret, minifiedBody + unixTimestamp)`, base64). Confirm
empirically:

1. Trigger one sandbox collection as a signed-in test user (POST to
   `/api/payments/initiate` with a body like `{"plan":"monthly","phone":"0712345678"}`,
   using a browser session or an auth token).
2. If PayMe **accepts** it → `body_ts` is correct, done.
3. If it rejects with a signature error → set `PAYME_SIG_MODE=ts_body`,
   redeploy, retry; then `body_dot_ts`. One of the three is right.

> To compare offline, `debugSignatures(secret, minifiedBody, timestamp)` in
> `lib/api/payme.ts` prints all three candidates for a given body — match
> against the expected `X-Signature` the portal's Integration Lab shows.

- [ ] `/initiate` returns `{reference, status:"pending"}` and the phone gets a push

## Phase 5 — Webhook

1. In the portal, set the transaction webhook to
   `https://sumaiya.app/api/payments/callback`.
2. The callback verifies `X-Middleware-Signature` (falling back to
   `X-Signature`) over the raw body. A `401 invalid signature` in the logs means
   the webhook signs differently than `verifyWebhook()` assumes — adjust it the
   same way as Phase 4.
3. Complete one sandbox payment end-to-end. Expect: `payment` row flips to
   `completed`, `grantPremiumDays` extends `profile.premiumUntil`, and the
   checkout page redirects to `/checkout/success`.

- [ ] Sandbox payment → Premium provisioned, webhook idempotent on replay

## Phase 6 — Go live

```
# swap sandbox creds for production, then:
PAYME_SANDBOX                 → remove
NEXT_PUBLIC_PAYMENTS_ENABLED  → true
```
Redeploy. Confirm `/checkout?plan=monthly` renders the form and a small real
payment completes, then refund it.

- [ ] Production creds in, `PAYME_SANDBOX` removed, checkout visible, one real payment tested + refunded

---

## Rollback (instant)

```
NEXT_PUBLIC_PAYMENTS_ENABLED  → remove   # hides checkout UI
PAYMENTS_ENABLED              → remove   # /initiate → 403
```
Redeploy. Existing Premium windows are untouched; no new charges can start.
