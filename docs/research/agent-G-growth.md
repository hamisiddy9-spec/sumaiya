# Agent G — growth / referral / lifecycle / activation / retention

## Referral
- **Dub** https://github.com/dubinc/dub — OSS link platform + full partner/referral layer (click→lead→conversion, dual-sided attribution, **embedded referral dashboard that renders inside your own app**). ~20k★ AGPL-3.0, VC-backed. *Self-host the engine, Swahili referral screen in the PWA, reward both sides in AI credits (no cash payout rails).*
- **RefearnApp** https://github.com/ZAK123DSFDF/refearnapp — self-host affiliate tracker, Next + Cloudflare Edge + Drizzle. Young/single-maintainer. Lighter than Dub if you only need share-token + conversion counting.
- **Refferq** https://www.refferq.com — self-host affiliate platform, Next 15 + Postgres, 38+ endpoints. Early. Good API surface for a WhatsApp-bot invite flow.

### Patterns
- **Invite in onboarding, at peak excitement** — right after the first win, not settings. One-tap share, pre-written message. (Dropbox: invite step in onboarding, 35% of signups from referral, 100k→4M in 15mo.)
- **Named referrer on the landing screen** — "Amina invited you" + photo. Trust transfers. (Airbnb, PayPal.)
- **Double-sided incentive tied to core value, not cash** — extra AI CV credits / premium template / priority WhatsApp coaching. Avoids mobile-money payout complexity + fraud.
- **Track k-factor** = (invites sent/user) × (invite→activation rate). Log `invite_shared / _link_opened / _signup / _activated` + cycle times. Fix worst-converting stage. k>1 = exponential.
- **Share-token**: per-user opaque token in short link → server resolves to referrer+campaign, sets first-party cookie AND localStorage (survives flaky PWA network), binds on signup. WhatsApp: `wa.me/?text=` deep link w/ token in message body.

## Lifecycle / CRM messaging
- **Dittofeed** https://github.com/dittofeed/dittofeed — OSS engagement platform, drag-drop **journey builder** across email/SMS/push/WhatsApp/Slack/webhooks. Git-based campaign version control, branch analytics, local-timezone scheduling. MIT, YC-backed, self-host full-featured. *Best single choice — model "signed up no CV", "CV done no application", "inactive 7d" as journeys fanning to WhatsApp + web push.*
- **Novu** https://github.com/novuhq/novu — OSS notification infra, one workflow API → in-app inbox + email/SMS/push/chat, 50+ providers, `<Inbox>` React component, digest/batching. ~35k★ Apache-2.0 core (some enterprise). *Delivery/fan-out layer beneath your own lifecycle logic; strong if you want an in-app feed.*
- **listmonk** https://github.com/knadh/listmonk — self-host newsletter/list/transactional email, single Go binary + Postgres, SQL segmentation, proven at 7M+/campaign. ~15k★ AGPL. *Email is weak for this audience — but cheap way to run the email you do need (NGO partners, diaspora) on a $5 VPS.*

### Patterns
- **Channel priority = audience, not convention:** WhatsApp template > web push > SMS > email. Design journeys channel-agnostic, set per-market order.
- **WhatsApp 24-hour window:** free-form replies only within 24h of user's last inbound; outside it → pre-approved template (utility/marketing/auth). Each inbound resets. Opt-out in every template, keep opt-in proof, marketing templates rare (Meta spam thresholds tightened 2025-26, low score throttles ALL sending). Utility "your CV is ready" / "3 new jobs match" also re-opens the free window.
- **Re-engage on inactivity, not a blast schedule** — value-reminder 24–72h after session goes quiet, personalized to drop point (finished CV → nudge to apply; abandoned → nudge to finish).

## Web push (PWA on Android)
- **web-push** (web-push-libs) https://github.com/web-push-libs/web-push — Node lib for Web Push protocol + VAPID + CLI for keys. **No third-party service, no FCM account for a PWA** — you hold the VAPID keypair, POST to the browser's push endpoint. MPL-2.0, canonical. *Installed PWA on Android Chrome supports Web Push natively — your entire push backend in ~50 lines.*
- **Uniqush** https://github.com/uniqush/uniqush-push — self-host unified push (FCM + APNs + Web Push). Overkill for PWA-only; pocket for when the native app returns.
- **ntfy + UnifiedPush** https://github.com/binwiederhier/ntfy — OSS pub-sub, UnifiedPush distributor → Android push without Google FCM. Only if you ship a native/UnifiedPush client.

### Patterns
- **Never prompt for push on first load** — only after a value moment, with a custom pre-prompt explaining the benefit BEFORE the browser's one-shot dialog (hard deny is permanent).
- `userVisibleOnly: true`, always show a notification (Chrome revokes push for silent sends).
- Content: specific + personal + actionable ("Amina, 3 new sales jobs in Arusha — tap to apply"). Segment by lifecycle stage, cap frequency, Swahili, local hours (store timezone).
- **Push is secondary to WhatsApp** — PWA push subs churn (clear data, uninstall). Keep sub record server-side, prune 410/404 endpoints on send.

## Activation / onboarding
- **Activation = reaching first value; measure Time to First Value (TTFV).** Median SaaS TTV ~1.5 days; best <5 min; only ~37.5% of signups ever activate. First value here = "finished downloadable CV in Swahili" or "first job match shown." Instrument signup→that-event gap, drive it down.
- **Two-layer:** TTFV (first perceived value) vs Time to Core Value (repeated pattern predicting retention). Track both — TTFV = first CV; Core Value = applied to 2+ jobs / updated CV twice.
- **3-phase first session: Orient → Activate → Reinforce**, first "aha" <5 min. Orient = one sentence on what they get; Activate = single guided path to CV; Reinforce = celebrate + obvious next step.
- **Instructional empty states as the primary CTA** — blank "My CV"/"My Applications" says what will appear, why it matters, one button ("Tengeneza CV yako ya kwanza").
- **Onboarding checklist w/ endowed progress** — pre-check item 1 ("account created ✓"). Checklists → 40%+ activation vs 25–30% baseline.
- **Progressive disclosure** — reveal features when relevant (tooltip on first arrival, "what's next" after a milestone), not a giant upfront tour. Keeps UI light on small screens.

## Retention analytics / aha moment
- **OpenPanel** > PostHog here — events/funnels/retention/cohorts/session replay, **~2.3KB SDK (20× lighter than PostHog's ~50KB+)** — real cost on cheap phones / slow networks. Docker (ClickHouse+Postgres+Redis). AGPL. (PostHog still the more feature-complete default; use its lightweight capture build or a proxy if chosen.)
- **Pug** https://pug.sh — single Go binary, trends/funnels/retention/Sankey. Early. Minimal-ops.
- **Find the aha moment with a cohort differential test**, not a guess: two cohorts from the same signup window — did candidate event X in first N days vs didn't — compare 30-day retention. Biggest retention gap = your aha. Repeat for several candidates (finished CV / applied / shared / invited).
- **Express as a quantified early milestone** (FB "7 friends in 10 days", Slack "2,000 messages"). Yours: "applied to 3 jobs in first week" or "CV downloaded + shared once." Push onboarding relentlessly toward that number.
- **Watch the retention curve shape** — flattens (even low) = core retained segment to grow; decays to zero = no PMF yet. Weekly cohorts.

## Testimonials / UGC
- **reviewsup.io** https://github.com/allenyan513/reviewsup.io — OSS review/testimonial mgmt (form/widget collect, moderate, embed wall-of-love/carousel), text + video. OSS alt to Senja/Testimonial.to. Young. *Post-success screen ("Ulipata kazi? Tuambie") + wall on landing page.*
- Patterns: ask at the moment of success (right after "I got the job"); single question + **optional voice note** (transcribe server-side) for low-literacy/data-conscious users; display specific outcomes with name + photo + place ("Nilipata kazi ya uhasibu Dodoma baada ya wiki mbili — Neema K."); **live public counter** ("1,240 watu wamepata kazi") — strong social proof, free once instrumented.

## Priority for Sumaiya
1. **web-push** — trivial, own it, zero cost. First.
2. **Dittofeed** — lifecycle brain; inactivity journeys → WhatsApp templates + web push.
3. **Dub** (self-host) — referral w/ embedded in-app dashboard; reward in AI credits.
4. **OpenPanel** over PostHog — 2.3KB SDK won't tax cheap phones.
5. **reviewsup.io / tiny collector** — post-success story capture + wall + live "jobs landed" counter.
6. Patterns: invite-in-onboarding + named-referrer landing; WhatsApp 24h discipline; Swahili instructional empty states + endowed-progress checklist; cohort-differential aha analysis.
