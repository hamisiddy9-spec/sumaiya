# Brief: abolish the TemplateHub⇄Sumaiya mix-up in Sumaiya's own runtime

Repo: `C:\Users\hamis\projects\sumaiya` (branch `release/1.6.25`).
**LOCAL commits only — do NOT push. The maintainer reviews and deploys.**

## Why this exists

Sumaiya's AI chat dead-ended for users on 20 Sept with
`sumaiyaChat.send → "ApiError: AI is not configured."` (8 events, all v1.6.24).
Cause, measured: that build called `templatehub.pro/api/ai/*`, which returns
`{"configured":false}`. Sumaiya's own deployment returns `{"configured":true,"provider":"deepseek"}`.
The domain moved to `sumaiya.app` afterwards, so the AI path is fixed — but the same class of
leak survives in shipped config, and that class is what this brief removes.

**The rule to enforce: a first-party app's runtime config may never point at another
product's origin.** Legacy deep-link origins are legitimate (messages already in inboxes);
live config is not.

## Item 1 — the TWA manifest points at the wrong product

`apps/web/twa-manifest.json` declares `"host": "www.templatehub.pro"`, with `iconUrl`,
`webManifestUrl` and `fullScopeUrl` all on that domain. Sumaiya's Android web-wrapper therefore
loads TemplateHub's site. Point every host-shaped value at the canonical host.

**Constraint:** the canonical host is the APEX (`sumaiya.app`), never `www` — see the comment
block in `apps/native/src/lib/app-hosts.ts` explaining that `www` 308-redirects and Android will
not follow a redirect when fetching `/.well-known/assetlinks.json`, producing a permanently
failing App Links verification. Do not introduce `www` anywhere.
`apps/native/src/__tests__/app-hosts.test.ts` already asserts app.json and the Android manifest
agree with `CANONICAL_HOST` — extend that assertion to cover `twa-manifest.json` so this cannot
drift again.

## Item 2 — Sumaiya's premium page renders TemplateHub's landing

`apps/web/app/[locale]/(marketing)/pro/page.tsx` imports `TemplateHubProLanding` from
`@/components/marketing/templatehub-pro-landing`. Sumaiya's `/pro` page must carry Sumaiya's own
brand and voice, bilingual, describing Sumaiya's premium (mobile money, no Stripe).

Strip every TemplateHub brand string from it. If the component is generic underneath, rename it
to Sumaiya's own name and file path rather than importing a component named after the other
product. Leave the pricing/offer copy as it is — do not invent new commercial terms, and do not
change what premium does. Swahili rules: `nafasi za kazi`, `vigezo`, `muundo`, `herufi`; never
"ATS"; second person for the user's own object ("CV yako").

## Item 3 — a cross-brand label on Sumaiya's home screen

`apps/native/src/screens/app/home-screen.tsx:204` builds a tip card with `key: "templatehub"`
and `eyebrow: "TemplateHub"`, opening the design gallery. The tip itself is good; the eyebrow is
another product's name shown inside Sumaiya. Rename the key and replace the eyebrow with
Sumaiya's own wording. Keep both languages, keep the existing behaviour (`setGalleryOpen`),
and keep the copy honest — it is describing choosing a document design.

## Item 4 — the support mailbox (do NOT change; document it)

`support@templatehub.pro` appears in the contact page, `lib/legal.ts`, `lib/email.ts` (FROM and
alert recipient), `lib/push/index.ts` and `lib/support-ai.ts`. This is deliberate: that domain
runs on Google Workspace and `sumaiya.app` has no MX records, so `@sumaiya.app` mail bounces.
**Leave it.** Instead add a single comment at the top of `lib/legal.ts` (the most central spot)
stating why the mailbox stays on the other domain and that it is the one documented exception to
the rule — so the next reader does not "fix" it and break support mail.

## Item 5 — the vocabulary comment

`apps/native/src/components/cv/cv-preview-card.tsx:115` says "after choosing templatehub
template…". Reword to Sumaiya's vocabulary. No behaviour change.

## The existing pattern to extend (read this first)

`apps/web/lib/templates/provider-select.test.ts` already asserts that `index.ts` exports no
`TemplateHubProvider` and contains no `templatehub` / `TEMPLATE_HUB` string, and that those env
vars are read nowhere. That is the right shape for this problem. **Extend that pattern to the
shipped config files** rather than inventing a new mechanism — one test that reads
`twa-manifest.json`, `vercel.json` and `app.json` and asserts no host value resolves to
`templatehub.pro` other than the documented mailbox.

## Gates (all must pass; report exact output — the runners differ per app)

`apps/web` — **vitest**:
```
cd apps/web && npx tsc --noEmit && npm run lint && npx vitest run && npm run evals && npm run build
```
`apps/native` — **jest** (never vitest here; it reports ~39 bogus failures because the suite
does not exist):
```
cd apps/native && npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js && npm run export
```
- The swahili-lint reads comments too — avoid banned jargon anywhere, including in code comments.
- The new boundary test must **actually fail** if `twa-manifest.json` is pointed back at the
  other domain. Prove it by temporarily reverting the value, showing the failing test output,
  then restoring it and showing it pass. A guard that cannot fail is not a guard.

## Report back

List each file changed, the exact commands run and their results, and anything you deliberately
did NOT change with the reason. If something in this brief is wrong, say so and change nothing
rather than forcing it — a previous brief of mine contained two factual errors that the
implementer correctly refused.
