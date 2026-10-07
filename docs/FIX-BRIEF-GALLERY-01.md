# Fix brief: the gallery must show the real template, and the preview must look like a document

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS. TWO items. Do NOT bump the
version, do not switch branches, do not upgrade a dependency.

Background: `docs/RENDER-ENGINE-PLAN-2026-09-23.md` Part B (measured on a real device, screenshots in
`C:\Users\hamis\Downloads\templatehub-enigma-093613.png` and `enigma-meridian-preview.png`).
The owner's complaint, verbatim: *"template hub does not render real templates previews"*.

---

## ITEM 1 — the grid draws a 5-variant doodle, not your templates

`src/components/cv/template-gallery.tsx:208` renders `<TemplateThumb>` for every grid cell.
`src/components/cv/template-thumb.tsx` is a **hand-drawn wireframe** with **5 variant branches** — grey
`#c9c4bd` bars and an `accent + "22"` sidebar. The picker header says **"Miundo 224"**, so 224 templates
are represented by 5 abstract pictures. That is exactly why *Aberdare, Meridian, Safu Pembeni, Athi, Awash,
Bangweulu* and *Baro* all look identical on the device.

The real renderer already exists and is used **once**, behind a tap: `RealTemplateThumb` at
`template-gallery.tsx:402`. `:353` records why the grid lost it: *"a real WebView per cell stuttered
scrolling on…"* — that reasoning was right, and this item does not undo it.

**Assets and tooling that already exist:**
- `docs/template-renders/` — **47 real renders**, 760x1076 (correct A4 proportion), ~98KB each, 4.7MB total,
  named by template id (`meridian.png`, `nakuru.png`, `rift.png`, `nairobi.png`, …). These are untracked;
  check whether they were produced by `scripts/render-samples.ts`, `scripts/template-render-probe.mjs` or
  `scripts/verify-real-templates.ts` and reuse that pipeline rather than writing a new one.
- The phone gallery offers **224** templates (218 engine + 6 bespoke), so 47 renders do not cover it.

**Do:** make the grid show the real design per cell, with no WebView per visible cell (that is the
performance cliff virtualisation exists to avoid, and a whole A4 page in a 46–138dp cell is texture, not a
document). You choose the mechanism and justify it in the commit message. Candidates, with the tradeoff each
carries — evaluate them against an APK-size budget of a few MB, cheap Android phones, and full offline
operation:
- ship downscaled renders for the templates that have them, and something honest for the rest;
- render each template **once, off-screen, and cache the PNG on disk** on first view (no APK cost, costs a
  one-off render per template and needs a cache-eviction story);
- a hybrid: ship the curated set, cache-render the tail lazily.
Whatever you pick: the cell must never be an identical picture for two different designs, and the cached
image must be generated at the cell's real pixel size, not upscaled from something smaller. If a template
genuinely cannot be rendered, say so in the report rather than falling back to the doodle silently.

Do **not** delete `template-thumb.tsx` unless nothing else uses it — check first (`cv-preview-card.tsx:163`,
`career-profile-screen.tsx:208`, `first-run-screen.tsx:450` use `TemplateThumb`).

## ITEM 2 — the preview renders a real design against a half-empty page

Verified on the device: the tap preview is a **genuine render** (navy sidebar, `MAWASILIANO`, `UJUZI` with
rating dots, `MUHTASARI`, `UZOEFU WA KAZI`, `ELIMU`) — but roughly **60% of the sheet is blank**, because
`src/lib/sample-cv.ts` (146 lines) holds only: experience 2, education 1, skills 8, languages 2,
certifications 2, **no projects**, and a 148-character summary.

A preview exists to show the design at its best. **Do:** make `sample-cv.ts` a full-length, realistic,
bilingual CV — 3–4 roles each with 2–3 achievement bullets, 2 education entries, a projects or
certifications block, referees, and a summary of real paragraph length. Keep it **plainly fictional and
generic** (no invented employer claims presented as real, no real company names, no fabricated awards) and
keep both languages in step, since the preview follows the app language. Nothing else should need to change:
the engine already paginates.

Check what currently consumes it (`fit.test.ts:22`, `home-screen` hero panels, the preview paths) so the
larger fixture does not break a snapshot or a timing test.

---

## Gates and report

`cd apps/native && npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js` — quote the
counts. Commit NAMED PATHS ONLY (this clone is shared; never `git add -A`). Report: files changed, the
mechanism you chose for Item 1 and why the others lose, the measured cell size and the APK-size delta (say
plainly if it is arithmetic rather than a built APK), the commands with pass/fail counts, the commit sha,
and what you could NOT establish — in particular, **you cannot see a phone**: say that the grid's real
appearance is unverified rather than implying you checked it.

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or a secret. Do NOT touch the fonts, the small-print floor, the A4
print options (already fixed in `1357cba`), the landing page, or the maombi work (already fixed in
`7ed2d53`).
