# PayMe Africa — go-live runbook

The integration is built, merged, and deployed. Payments are **OFF** behind two
switches. This is the ordered checklist to turn them on safely.

Current verified state (2026-09-06):
- `GET https://templatehub.pro/api/payments` → `{"provider":"payme"}` — code is live
- `POST /api/payments/initiate` → `403 "Payments are currently disabled."` — switch is off
- No `PAYME_*` vars in the stale local env snapshots

Reference values used throughout:
- API base: `https://portal.paymeafrica.com/api/v1`
- Callback (webhook) URL: `https://templatehub.pro/api/payments/callback`
- Redirect (after card) URL: `https://templatehub.pro/checkout/success`
- Signature code: `lib/api/payme.ts` → `sign()` / `signRaw()`
- Plan prices: `PLAN_AMOUNTS` in `lib/api/routes/payments.ts` (minor units)

---

## Phase 1 — Get API credentials

1. Log in to `portal.paymeafrica.com`.
2. Open the ☰ menu and find **Developers / API Keys / Apps / Integrations**
   (whatever it's called). **"Payment Links" is NOT it** — that's the no-code
   product and can't provision subscriptions.
3. Create an app / generate **sandbox** credentials. You need two values:
   - `X-App-ID`  → goes in env as `PAYME_APP_ID`
   - App secret  → goes in env as `PAYME_APP_SECRET`
4. If there is no developer section at all, email PayMe support and ask them to
   enable API access for your account. Until then you cannot go live (the
   payment-link product would mean upgrading each customer by hand).

- [ ] Sandbox `PAYME_APP_ID` obtained
- [ ] Sandbox `PAYME_APP_SECRET` obtained

---

## Phase 2 — Verify the HMAC signature (the one real unknown)

The code signs requests as `HMAC-SHA256(secret, minifiedJSONBody + unixTimestamp)`,
base64. The docs don't spell out the exact byte order, so this must be confirmed.

1. Go to `portal.paymeafrica.com/labs` (the signature tester / live console).
2. Build a `collection` request body and have the labs tool show you the
   **expected `X-Signature`** for a known body + timestamp + secret.
3. Compare with what our code produces. Quick local check:

   ```bash
   node -e '
     const {createHmac}=require("crypto");
     const body=JSON.stringify({action:"collection",amount:100,msisdn:"255700000000",channel:"CASHIN",reference:"TH-TEST",callback_url:"https://templatehub.pro/api/payments/callback"});
     const ts="1725600000";
     const secret="PASTE_SANDBOX_SECRET";
     console.log("body+ts :", createHmac("sha256",secret).update(body+ts).digest("base64"));
     console.log("ts+body :", createHmac("sha256",secret).update(ts+body).digest("base64"));
     console.log("body.ts :", createHmac("sha256",secret).update(body+"."+ts).digest("base64"));
   '
   ```

4. Whichever line matches the labs tool is the correct construction.
   - `body+ts`  → already what `sign()` does, no change.
   - `ts+body`  → in `lib/api/payme.ts`, change `sign()` to `signRaw(timestamp + minifiedBody)`.
   - `body.ts`  → change to `signRaw(minifiedBody + "." + timestamp)`.
5. If the labs tool signs the **webhook** differently (it's `X-Middleware-Signature`),
   adjust `verifyWebhook()` the same way.

- [ ] Sandbox signature construction confirmed
- [ ] `sign()` / `verifyWebhook()` updated if needed, committed, pushed

---

## Phase 3 — Set sandbox env vars in Vercel

```bash
vercel link                      # pick the "templatehub" project (once)

vercel env add PAYME_APP_ID              preview production
vercel env add PAYME_APP_SECRET          preview production
vercel env add PAYME_SANDBOX             preview production   # value: 1
vercel env add PAYME_CALLBACK_URL        preview production   # https://templatehub.pro/api/payments/callback
vercel env add PAYME_REDIRECT_URL        preview production   # https://templatehub.pro/checkout/success

# Turn the server switch ON but leave the UI switch OFF for now,
# so you can test the API without exposing checkout to real users:
vercel env add PAYMENTS_ENABLED          production           # value: true
```

Env changes only take effect on a new deployment:

```bash
vercel --prod          # or: redeploy latest from the Vercel dashboard
```

Verify:

```bash
curl -s -X POST https://templatehub.pro/api/payments/initiate \
  -H 'Content-Type: application/json' -d '{"plan":"trial","currency":"TZS","phone":"0700000000"}'
```

- `401 Unauthorized`  → good: creds are set, it got past the config check (needs a logged-in user)
- `503 "Payment provider is not configured"` → `PAYME_APP_ID`/`SECRET` missing or not redeployed
- `403 "Payments are currently disabled"` → `PAYMENTS_ENABLED` not `true` yet

- [ ] Vars set, redeployed, `initiate` returns 401 (not 503 / 403)

---

## Phase 4 — Register the webhook

1. In the PayMe portal, set the transaction webhook / callback URL to:
   `https://templatehub.pro/api/payments/callback`
2. Note whether they send a test ping. If they do, tail the logs:
   `vercel logs https://templatehub.pro --follow` and look for
   `PayMe callback:` lines. A `401 Invalid signature` there means Phase 2 isn't
   right for webhooks yet.

- [ ] Webhook URL registered
- [ ] A signed test callback verifies (no "signature verification failed" in logs)

---

## Phase 5 — End-to-end sandbox test

Do this as a real signed-in test user on the live site (switch still UI-off, so
reach it directly):

1. Go to `https://templatehub.pro/checkout?plan=trial` while logged in.
   (UI is off, so you may need to temporarily set `NEXT_PUBLIC_PAYMENTS_ENABLED=true`
   + redeploy, or test via curl with a real auth token.)
2. **Mobile money path:** pick TZS, enter the sandbox test MSISDN, pay. Approve
   the push with the sandbox PIN. Expect: "Check your phone" screen → within
   ~30s it flips to `/checkout/success` → account shows Premium.
3. **Card path:** pick USD, pay. Expect: redirect to PayMe's hosted page → pay
   with a sandbox test card → back to `/checkout/success` → Premium.
4. Check the DB: one `payment` row `status=completed`, one `subscription` row
   `status=trialing/active`, `provider=payme`.
5. Check the confirmation email arrived.

- [ ] Mobile-money push → subscription provisioned
- [ ] Card checkout → subscription provisioned
- [ ] Webhook and `/verify` both idempotent (no double provisioning)

---

## Phase 6 — Go live

Only after Phase 5 passes **and** the AI provider is restored (the plans sell AI
features — see `lib/env.ts` warning about `DEEPSEEK_API_KEY`).

```bash
# Swap sandbox creds for production ones:
vercel env rm PAYME_APP_ID production && vercel env add PAYME_APP_ID production
vercel env rm PAYME_APP_SECRET production && vercel env add PAYME_APP_SECRET production
vercel env rm PAYME_SANDBOX production            # remove it (production mode)

# Turn on the checkout UI:
vercel env add NEXT_PUBLIC_PAYMENTS_ENABLED production   # value: true

vercel --prod
```

Then confirm the pricing page CTAs now go to `/checkout?plan=…` and the checkout
page renders the real form (not the "all free" view).

- [ ] Production credentials in
- [ ] `PAYME_SANDBOX` removed
- [ ] `NEXT_PUBLIC_PAYMENTS_ENABLED=true`
- [ ] One real small live payment tested and refunded

---

## Rollback

Instant, no deploy needed for the UI; one redeploy for the server:

```bash
vercel env rm NEXT_PUBLIC_PAYMENTS_ENABLED production   # hides checkout UI
vercel env rm PAYMENTS_ENABLED production               # /initiate → 403 again
vercel --prod
```

Existing subscriptions are untouched; no new charges can start.

---

## If PayMe's API stays unavailable

Fallback with the no-code Payment Links (manual, low volume only):

1. In the portal, create one **Fixed Payment** link per plan — set the amount
   (TZS/KES), title ("TemplateHub — 7-Day Access"), and Redirect URL to
   `https://templatehub.pro/checkout/success`.
2. Point the checkout/pricing CTAs at those hosted links instead of `/initiate`.
3. **Upgrades are manual:** watch the PayMe dashboard, match each payment to a
   user by the email/name they paid with, and set their subscription by hand
   (SQL insert into `subscription`, or a small admin action).
4. This does not scale past the first ~20 customers — treat it as a bridge while
   API access is sorted.
