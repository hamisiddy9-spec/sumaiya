# Web app — navigation, flow and gaps

Audit, 2026-09-16. Verified by reading the routes and the entry points.

## What the site actually is (verified)
Two shells, which is the right structure:

- **`(marketing)`** — about, ats-checker, blog, contact, cookies, jobs, preview, privacy,
  pro, snap-to-apply, templates, terms, tools, and `/` (the landing)
- **`(app)`** — auth (sign-in, sign-up, verify, reset-password), dashboard, brief,
  career-interview, four editors, import-cv, settings, assistant, `cv/[slug]` (public CV),
  and a full **admin** area

So the split exists. The problems are at the seams.

## Gap 1 — the landing page does not know who is looking at it
`(marketing)/page.tsx` has **no session check and no redirect**. A signed-in user who opens
`sumaiya.app` gets the marketing pitch again, every time — the same page a total stranger sees.

**What it should be:**
```
signed in  → /dashboard   (resume where they were)
stranger   → /            (the pitch)
```
This is the single highest-value flow fix on the web, and it's the same principle that governed
the AI work: *the surface should know who is looking at it.* It's also what Linear, Notion,
Vercel and Stripe all do — nobody who is logged in ever sees the sales page.

## Gap 2 — there is no onboarding. Sign-up drops you into a cold app
No `onboarding`, `welcome` or `getting-started` route exists anywhere in the web app. So the
flow today is:

```
landing → sign-up → ??? → a dashboard with nothing in it
```

That middle step is the hole. A brand-new user arrives with no CV, no profile, no idea what to
do first — and the dashboard can only show empty states.

**What belongs there (a first-run flow, 3 steps, skippable):**
1. **What are you aiming at?** — target role + field (this is what makes every later
   recommendation relevant; the app already has `career-fields.ts` for it)
2. **Bring your history** — upload a CV or connect a profile (the import path already exists)
3. **First win** — score the CV, show a real number, and name the one thing to fix

End on **a result, not a tour**. The best onboarding in this category (Canva, Notion, Duolingo)
gets the user to a real output in the first session, because a first win is what makes someone
come back. The app already has the pieces — `recommendations.ts` produces exactly the "one thing
to do next" sentence this flow should end on.

Note the **mobile app already has this** (`first-run-screen`, `onboarding-screen`). The web
doesn't. That asymmetry is worth closing, because a user who meets Sumaiya on the web and then
installs the app should recognise the experience.

## Gap 3 — the marketing→app handoff is silent
Nothing in the flow explains what the account buys or what happens next. `snap-to-apply` and
`ats-checker` are strong, concrete entry points — but the step from "I tried the free checker"
to "I have an account" isn't staged.

**The pattern worth copying** (Canva, Grammarly, Resume.io): let the visitor **use the tool
before the account**. They get a real ATS score on the marketing site, *then* we ask them to
save it. The account becomes the way to keep something they already value, rather than a wall
before they've seen anything.

## Gap 4 — the device gate (fixed today, `10455f8`)
The install banner offered a PWA install to every device that supported one — desktop and
Android included, where it was advertising a worse copy of our own app. Now: Android gets no
PWA offer (it has a real app), iOS gets none (its own hint handles it), desktop keeps it.

## The flow I'd propose

```
STRANGER
  /  ── use a tool free (ATS checker / templates) ──▸ real result
  └─ "keep this" ──▸ sign-up

NEW ACCOUNT
  onboarding (3 steps, skippable) ──▸ first scored CV ──▸ one fix named

RETURNING
  / ──▸ /dashboard (resume, never the pitch)

MOBILE
  Android ──▸ the APK         iOS ──▸ add-to-home hint      Desktop ──▸ PWA (optional)
```

The through-line: **every entry should end in something the person can see.** A stranger should
get a score; a new user should get a first CV; a returning user should get their work back.

## Still to audit (the rest of the web, properly)
I checked routing and entry points. I have **not** yet walked the web app end-to-end the way I
walked the APK — screens, features, empty states, error paths, bilingual coverage, the editors,
admin, and the public `cv/[slug]` pages. That's a bigger pass and it needs real runtime, which
is why the browser timing out earlier matters: it should be re-run.

Known from the earlier code scan, still unverified on the web:
- whether bilingual (EN/SW) coverage matches the app's
- whether the 218 template SW-blurb placeholders affect the web gallery too
- empty states, error states, and accessibility on the app shell
- whether admin has any auth boundary beyond being in the `(app)` group
