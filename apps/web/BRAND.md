# Sumaiya — Brand & Positioning Spec

> Status: rebrand adopted 2026-09 (was "TemplateHub"; the persona became the
> brand — see the rebrand proposal + REBRAND_RUNBOOK.md). Source: 2026 naming
> research + market-readiness analysis. Revisit when expanding beyond East
> Africa or raising a round.

## 1. Brand architecture

- **Master brand:** **Sumaiya** — a warm, common woman's name across coastal
  East Africa. Fully ownable (no search competition), unmistakably local. The
  name carries the feeling; the descriptor carries the facts — it is ALWAYS
  paired with what it does in store subtitles, meta titles, and the first line
  of every screen.
- **Canonical domain:** `sumaiya.app` · **Android id:** `pro.sumaiya.app`.
  Every generated URL, canonical tag and sitemap entry points here
  (`NEXT_PUBLIC_APP_URL`), with `www` 308-ing to the apex.
- **Sibling domain — `templatehub.pro`.** NOT a redirect, and not optional. It
  is the **TemplateHub** half of the product: the template catalog, the free
  document tools and the basic editor, with **no assistant**. The AI surfaces
  (`/assistant`, `/studio`, `/voice`, `/interview`, `/snap`, `/dashboard`, …)
  302 to `sumaiya.app`. The routing rules live in `lib/routing.ts` (`isTemplateHubHost`,
  `ASSISTANT_ONLY_PREFIXES`) — edit them there, and never in `vercel.json`,
  because middleware resolves bare paths first.
  ⚠️ **`/api/*` and `/.well-known/assetlinks.json` must keep serving from
  `templatehub.pro`.** The shipped Android build has `www.templatehub.pro` baked
  in as both its API base and its App Links host, so a blanket redirect — the
  move this doc used to prescribe — silently breaks every installed user.
- **Mail stays on `templatehub.pro`.** `sumaiya.app` has no MX records, so
  `support@` and `noreply@templatehub.pro` are the live mailboxes. URLs move;
  mailboxes stay.
- **The persona IS the product:** Sumaiya is the AI career assistant, the voice,
  and the human hook. Users chat with Sumaiya, Sumaiya drafts the CV, Sumaiya
  nudges applications.
- **Outcome tagline (always attached to the name):**
  - SW: *Sumaiya — Pata kazi na AI*
  - EN: *Sumaiya — Get hired with AI*
- **Rule:** copy leads with outcome + person, never with "template collection".

## 2. What we sell (offer ladder)

1. **Hook (free):** chat with Sumaiya → AI-drafted CV/letter in minutes, no
   sign-up. Grounded in the user's real facts ("AI haibuni").
2. **Grow:** ATS checker, job matching, application tracking, snap-to-apply.
3. **Revenue:** download gate + premium (cover letters, ATS deep check,
   interview coach, unlimited downloads). Mobile money first (M-Pesa, Tigo
   Pesa, Airtel), cards second.
4. **B2B wedge:** free ATS checker for HR/recruiters/NGOs → they refer
   applicants to the tool.

## 3. Positioning statement

> For job seekers in East Africa who need a CV that actually gets interviews,
> TemplateHub is the AI career copilot that writes, checks and targets
> applications for you — in Swahili or English, from a cheap Android phone,
> with no card required. Unlike global CV tools, Sumaiya speaks Kiswahili,
> knows local hiring, and never fabricates your facts.

## 4. Voice & tone

- Warm, trustworthy, outcome-first. Bilingual EN/SW (SW default in TZ-lean
  copy; KE copy may mix more English/Sheng — region-detect later).
- Sumaiya = female, professional, encouraging. (Female voice across TTS.)
- Never "beta", never "AI hype". Concrete: what the user gets, in minutes.

## 5. Markets (tiered)

- **Tier 1 — Kenya + Tanzania:** live now (EN/SW, KES/TZS pricing, mobile
  money, WhatsApp job groups).
- **Tier 2 — Uganda, Rwanda:** SW/EN coverage, MTN MoMo/Airtel rails.
- **Tier 3 — Nigeria/Ghana, Francophone Africa:** separate payment rails
  (Paystack/Flutterwave, Orange Money), language work, different competitor
  set. Do not open before Tier 1 shows paid traction.
- **Diaspora (always on):** KE/TZ professionals abroad applying to EA or
  remote roles — USD willingness to pay subsidises the free local tier.

## 6. Segments (priority order)

| Segment | Age | Why they pay / matter | Primary channel |
|---|---|---|---|
| Fresh graduates & students | 18–25 | Volume; first CV ever; loss-leader | Campus ambassadors, WhatsApp alumni groups |
| Early-career professionals | 22–32 | Revenue; ATS + cover letters + interview | LinkedIn, WhatsApp job groups |
| Informal → formal transition | 25–35 | Needs simplest UX + offline + voice | WhatsApp, TVET networks |
| NEET youth (via NGOs) | 17–24 | B2B2C bulk licenses, social impact | Youth employment programs |

Segmentation criteria used: trigger frequency, prior spend on CV services,
device class (low-end Android), data budget, language, where they find jobs.

## 7. Non-negotiables (do not break)

- Warm Confidence design tokens (ember/pine/espresso/sand family) everywhere.
- SEO keyword clusters intact: "tengeneza CV", "CV template", "barua ya
  maombi", "ATS friendly CV" — the brand no longer contains "template", so these
  clusters now live in page copy, headings, and the **TemplateHub surfaces on
  `templatehub.pro`** (catalog, tools, `/pro`). Keep those pages indexable and
  keep the two hosts' canonicals pointing at the URL that actually serves the
  content — but do NOT "keep the legacy domain redirecting": there is no legacy
  domain any more, and a redirect breaks the shipped APK (see §1).
- Guest-first funnel (no sign-in wall), offline-first, grounded-AI claims.
- Launch messaging replaces beta messaging; stay truthful (payments go live
  before we claim paid plans are purchasable).

## 8. Channels (owned)

- **WhatsApp** — where jobs live; snap-to-apply is the killer loop.
- **TikTok / IG / YouTube Shorts** — Dar Wizzy + Soga ya Mwanzengo studios
  produce "Jinsi ya kutengeneza CV inayopita ATS" style content.
- **SEO / Search-everywhere** — SW+EN clusters, YouTube tutorials.
- **Campus & NGO partnerships** — ambassadors, career fairs, bulk programs.
