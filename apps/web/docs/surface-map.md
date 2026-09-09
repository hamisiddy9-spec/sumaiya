# Sumaiya — Surface Map & Marketing Priorities

*Compiled from the live codebase, 2026-09-06. Statuses reflect production at time of writing.*

---

## 00 · The short answer

**Lead with the free utilities. Convert on the templates. Hold the AI pitch.**

The current homepage headline sells *"make a CV by chatting with AI."* That is the one
part of the product that is **down in production right now** — the AI provider
(DeepSeek) is out of credits, so Sumaiya chat, "tailor to job", AI cover letters, CV
import parsing and the interview coach all fail.

Meanwhile the parts with real search demand — **the 8 PDF tools and the ATS checker** —
work perfectly, need no login, and have dedicated SEO pages already built.

Acquisition story: **"free PDF tools + instant ATS score"** → they land, get a result,
see 260+ CV templates in the nav → they build. That funnel has zero dependency on the
thing that's broken.

---

## 01 · The public surface (no account needed)

| Page | What it is | Login? | State | Search demand |
|---|---|---|---|---|
| `/` | Landing page (just rebuilt: plain headline, 3-step "how it works", CV preview on mobile) | No | Live | Brand |
| `/tools` + `/tools/[slug]` | 8 browser-side PDF tools + one SEO landing page each | No | Live | Very high, evergreen |
| `/ats-checker` | Upload a PDF CV → instant ATS score + fixes | No | Live | High, high-intent |
| `/templates` + `/templates/[slug]` | 260+ CV templates, one indexable page per template | No | Live | High ("cv template") |
| `/snap-to-apply` | Marketing page for the paste-a-job → tailored-CV flow | No | Live | Low / niche |
| `/jobs` | Aggregated job listings, scored against your CV | No (better signed in) | Thin | Low as an entry |
| `/app` | Android APK direct download + install guide | No | Live | Brand |
| `/blog` + `/blog/[slug]` | Article surface (SEO content channel) | No | Depends on content | Whatever you write for |
| `/preview` | Standalone template preview | No | Live | — |
| `/about` `/contact` `/privacy` `/terms` `/cookies` | Trust / legal pages | No | Live | — |
| `/pricing` | **Hidden** — payments disabled, everything is free right now | No | Hidden | — |

Every doc type also has a no-login "try" editor:
`/editor/cv/try`, `/editor/cover-letter/try`, `/editor/business-card/try`, `/editor/letter/try`.

---

## 02 · Making a CV — every path

### Path A — Guest builder (the main funnel) · `/editor/cv/try`
**Works. Login only to save/download.**

The default path from the homepage "Build my CV — free" button. No wall until the very end.

1. Pick template (or arrive with one)
2. Fill sections, live preview
3. Completion meter fills
4. Hit "Download"
5. Sign-in prompt (magic link / Google)
6. CV auto-migrates to the account, PDF downloads

**Scenarios:**
- **Guest never signs in** — draft saved in the browser (localStorage). Same device later → still there. Different device → gone.
- **Guest signs in mid-build** — `/migrate-guest` moves the draft into the account exactly once (guarded against duplicates), lands them in the real editor.
- **Already logged in, clicks a template on the homepage** — skips the guest editor, goes straight to `/editor/cv/new?template=…` seeded from their saved profile.
- **Already logged in, generic "try free" click** — sent to `/dashboard` (no blank CV spawned per click).
- **Picks a fake/broken template id in the URL** — silently falls back to the "Nakuru" template.

**Marketing read:** This is the conversion path and it's healthy. Friction point is step 5 — worth A/B testing "download now, we'll email it" vs. the sign-in prompt.

---

### Path B — Full editor (signed in) · `/editor/cv/[id]`
**Works. Login required.**

Where returning users live. Autosave, restyle, re-export, and a post-download "launchpad".

1. Open / create CV
2. Seeded from saved profile
3. Edit — autosaves
4. Swap template / colour / font anytime
5. Export PDF or Word
6. Launchpad: cover letter · track application · share link

**Scenarios:**
- **Not signed in, opens an editor link** — redirected to `/sign-in?callbackUrl=…`, returns to the same editor after auth.
- **Switches template after filling everything** — content carries over untouched; only the layout changes.
- **Wants an editable file** — Word (DOCX) export exists alongside PDF. Under-marketed; job seekers search for this.
- **Opened from an application** — "Back" returns to that application workspace, not the dashboard.

**Marketing read:** "PDF *and* editable Word" and "change template without redoing your CV" are concrete, believable selling points that don't touch AI.

---

### Path C — Import an existing CV · `/import-cv`
**AI-dependent — DOWN now. Login required.**

Upload an old PDF résumé, get it back as a fully editable Sumaiya CV.

1. Sign in
2. Upload PDF résumé
3. Text extracted (deterministic — fine)
4. AI parses text into CV fields
5. Lands in the editor, pre-filled

**Scenarios:**
- **Today** — step 4 fails (no AI credits). The upload appears to hang or errors out.
- **Scanned / image-only PDF** — text extraction still works, but a garbled scan gives a weak parse.

**Marketing read:** Do not feature until the AI key is restored. When it is, "import your old CV in 30 seconds" is a strong hook.

---

### Path D — Sumaiya, the AI assistant · `/assistant`
**DOWN now. Guest-friendly.**

Chat in English or Swahili; she drafts and edits the CV, and does career tasks around it.

1. Open chat (guest or signed in)
2. Describe your situation / paste a job
3. She proposes changes as cards
4. Approve a card → it applies to the CV
5. Sign in to save

**Capabilities (all AI-gated):** ATS check · tailor CV to a job · rewrite summary · suggest skills · generate a matching cover letter · track the application · skill-gap analysis with a learning plan + course links · interview prep. Per-chat "thinking effort": fast / balanced / deep.

**Scenarios:**
- **Today** — every turn returns an error. The whole surface is dead.
- **Guest uses it, then wants to save** — hands off to the guest editor + sign-in, same as Path A.
- **Swahili conversation** — fully supported; genuine differentiator vs. every generic CV builder.

**Marketing read:** Highest-ceiling feature, currently at zero. Restoring the provider (or adding an Anthropic/OpenAI key — the fallback chain already exists) is the single highest-leverage fix.

---

### Path E — Snap-to-Apply · `/snap`
**Core works · AI polish down. Guest-friendly.**

Paste a job description (or photograph it) → see how your CV matches → get a tailored version + cover letter.

1. Paste job text OR snap a photo
2. Photo → on-device OCR (free, no key)
3. ATS match score, before/after
4. Keyword-reordered CV (deterministic)
5. AI rewrite + cover letter
6. Export PDF · share a PII-free link

**Scenarios:**
- **Today** — steps 1–4 and 6 work. The match score, the gap list, and the reordered CV are all deterministic and "always available even when AI is down" (the code says so explicitly). Only the step-5 rewrite / cover-letter is missing.
- **Guest** — tailors against the localStorage draft so the output uses real facts.
- **Shares the result** — generates a signed, PII-free link (ATS score + sanitised job title only). Built-in viral loop.

**Marketing read:** The match-score-from-a-photo demo is distinctive and *works today*. Good for social / short-form video. Don't over-promise the rewrite until AI is back.

---

### Path F — Interview coach · `/career-interview`, `/interview`
**DOWN now. Login required.**

A back-and-forth mock interview with feedback. Separate segment of the product.

- **Today** — AI-gated, so non-functional. (A repeat-question bug was also recently patched here.)

**Marketing read:** Secondary even when healthy. Bundle it into the Sumaiya story rather than marketing separately.

---

## 03 · The PDF tools — all 8

Browser-based, no account, no watermark, files never stored, 10 requests/min per IP, ~4 MB per file.
Every one has its own SEO landing page at `/tools/[slug]` with how-to steps and FAQ schema.
**This is the most marketable thing in the product and it is entirely healthy.**

| Tool | Input | Options the user sets | Typical search |
|---|---|---|---|
| **Image to PDF** — `/tools/image-to-pdf` | Multiple JPG / PNG | Reorder pages before converting | jpg to pdf, scan to pdf |
| **Merge PDF** — `/tools/merge` | Multiple PDFs | Drag to set final order | merge pdf, combine pdf |
| **Split PDF** — `/tools/split` | One PDF | Page ranges, e.g. `1,3,5-7` | split pdf, extract pages |
| **Rotate PDF** — `/tools/rotate` | One PDF | Angle; optional page list (blank = all) | rotate pdf |
| **Watermark PDF** — `/tools/watermark` | One PDF | Text to stamp diagonally (DRAFT, name…) | add watermark to pdf |
| **Page Numbers** — `/tools/page-numbers` | One PDF | None — auto "n / total", bottom centre | add page numbers to pdf |
| **Delete Pages** — `/tools/delete-pages` | One PDF | Pages to remove, e.g. `2,5-6` | delete pages from pdf |
| **Extract Text** — `/tools/extract-text` | One PDF (digital or scanned) | None | extract text from pdf |

**Scenarios worth knowing:**
- **File over ~4 MB** — rejected with a friendly message (Vercel's platform body limit sits just above this, so the cap is real).
- **Uploads a WEBP image** — rejected up front with a clear message (only PNG/JPEG can be embedded).
- **Hammering a tool** — 11th request in a minute gets a 429 "try again in a minute".
- **Nonsense page range like `1-999999`** — clamped to the real page count (guarded against a CPU-exhaustion trick).
- **Deep link from nav or landing** — `/tools#tool-merge` opens the hub with that tool already expanded.
- **"Import CV to Edit" in the tools list** — this one *does* require login and *does* use AI (it's Path C above), unlike the other eight. Worth separating in the UI so it doesn't look broken.

**Why these are the acquisition engine:** "merge pdf" and "jpg to pdf" are searched millions of times a month, forever, by people who are not looking for a CV builder — but many of them *are* job seekers assembling an application. They arrive, succeed in ten seconds, and see "CV Templates" and "ATS Checker" in the nav. Zero login, zero AI, infinite evergreen demand. The 16 SEO pages (8 tools + 8 how-to) already exist; they need links and content depth, not new engineering.

---

## 04 · ATS checker & job matching

Both are deterministic scoring engines — pure code, no AI. They work today.

### Free ATS score · `/ats-checker` — Works, no login
1. Upload PDF (or paste text)
2. Text extracted via the same engine as the PDF tool
3. `scoreResumeText()` — deterministic
4. Score ring + status + specific fixes
5. CTA into the CV builder

**Scenarios:**
- **Pastes text instead of uploading** — supported, skips extraction.
- **Low score** — shows "fix your score in minutes" with a route into a template.
- **Signed in** — score history is kept.

**Marketing read:** High-intent keyword ("ats resume checker"), instant payoff, natural bridge to the paid-feeling product. Second only to the PDF tools as a traffic door.

### Jobs feed, matched to your CV · `/jobs` — Works, needs listing volume
1. Aggregated listings from job sources
2. Each scored against your CV terms
3. Apply / track from one place

**Scenarios:**
- **No CV yet** — feed still shows, but there's no match score to hook on.
- **Thin listing count** — the feature reads as empty; it's a retention feature, not an entry point, until the listing pipeline is fuller.

**Marketing read:** Don't lead with it. Use it in retention emails ("3 new jobs match your CV").

---

## 05 · The other document types

Same editor architecture as the CV, same guest-try-then-sign-in-to-save pattern. All template-driven and deterministic — they work.

| Type | Try (no login) | Count | Notes |
|---|---|---|---|
| **CV** | `/editor/cv/try` | 260+ templates | The core product |
| **Cover letter** | `/editor/cover-letter/try` | 27 templates | Styled to match the CV; AI draft optional, not required |
| **Business card** | `/editor/business-card/try` | 29 designs | Pick colour, fill details, export print-ready PDF |
| **Formal letter** | `/editor/letter/try` | 17 templates | Reference, resignation, application letters |

A legitimate "everything for your job application in one place" story — but breadth, not the headline. The homepage already gives them a fair amount of room; that's about right.

---

## 06 · Sign-in — the scenarios that bite

Auth is magic-link or Google OAuth on the web. Building never needs an account; only saving and downloading do.

- **Made an account with Google, later tries email + password** — there is no password. They must use "Continue with Google" again. This confuses people; the sign-in page should detect the Google-only account and say so.
- **Magic link opens on a different device** — the guest draft (localStorage) is on the *first* device, so it doesn't migrate. Worth warning "open this link on the same device/browser".
- **Password reset** — email sends and is received; the reset page (`/reset-password`) now handles the recovery session correctly (recently fixed).
- **Guest downloads, signs in, comes back** — `/migrate-guest` is idempotent, so no duplicate CV is created even on a double-tap or refresh.

Mobile app auth was rebuilt separately and passes its QA; email/password and Google both work there now.

---

## 07 · Behind the login (not marketing surface)

- `/dashboard` — home for returning users: CVs, applications, quick actions.
- `/applications/[id]` — application workspace: the tailored CV, cover letter, status pipeline, interview prep for one job.
- `/brief` — a consolidated "what to do next" view.
- `/settings` — profile, language, dark mode, delete account, clear cache.
- `/checkout`, `/checkout/success` — payment flow, currently disabled (product is fully free).
- `/admin/*` — insights, jobs, submissions, templates, users (internal).
- `/studio/[id]`, `/cv/[slug]` — shared / public CV views.

---

## 08 · Marketing priority — ranked

By (search demand × conversion potential × whether it works today ÷ effort to exploit).

1. **Free PDF tools as the top-of-funnel magnet.**
   Millions of evergreen searches, no login, no AI, no watermark, 16 SEO pages already built.
   *Do:* internal-link them hard from the CV and ATS pages; expand the how-to content;
   consider a few more tools (compress, PDF→Word) that share the same demand curve.

2. **Free ATS checker as the high-intent door.**
   Deterministic, instant, and the searcher is *already* a job seeker.
   *Do:* make it the second nav item; end every result with one specific template
   recommendation; capture email for the score history.

3. **260+ CV templates as the conversion product.**
   Per-template SEO pages, "content carries over when you switch", PDF *and* Word export.
   *Do:* lead template pages with the finished output; push the "no redo when you change
   design" and "editable Word file" angles — both true, neither needs AI.

4. **Restore the AI provider — then re-pitch Sumaiya.**
   Highest-ceiling differentiator (Swahili career chat, tailor-to-job, import) and it's at
   absolute zero. The fallback chain to Anthropic/OpenAI already exists in code — one env var.
   *Until then:* take "chat with AI" out of the hero.

5. **Snap-to-Apply for social proof / short-form.**
   "Photograph a job ad, see your match score" is a great 15-second video and the score half
   works today. *Do:* use it in organic social, not as a homepage headline.

6. **Jobs feed + Android app for retention, not acquisition.**
   Both real but thin as first impressions. *Do:* "jobs that match your CV" in lifecycle
   email; APK link on the confirmation screen.

---

## The one blocker to fix first

The DeepSeek API key is out of credits, so every AI feature — Sumaiya chat, tailor-to-job,
AI cover letters, CV import, interview coach, skill-gap plans — returns an error in
production. Nothing deterministic is affected (templates, PDF tools, ATS scoring, job
matching, PDF/Word export all work).

Either top up DeepSeek or set `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` in the Vercel
production env — the provider code already falls through to them automatically
(priority order: DeepSeek → Anthropic → OpenAI).
