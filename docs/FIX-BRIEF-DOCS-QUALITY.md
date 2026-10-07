# Fix brief: the two remaining document findings, before the release build

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS. TWO items. Do NOT bump the
version and do NOT build — I bump and build once, after both land. Do not switch branches, do not upgrade a
dependency. Background: `docs/RENDER-ENGINE-PLAN-2026-09-23.md` items A3 and Defect 2.

---

## ITEM 1 — the engine prints text at 5.7pt, below any legibility floor

Measured in the plan: `src/lib/cv-engine/tokens.ts:69-86` emits an 8.5px meta/tag token, and compact density
multiplies by 0.9 (`:42-46`, `:83-84`) → **7.65px = 5.7pt** for dates, locations, skill chips and sub-labels.
`src/lib/cv-engine/sections.ts:164` is a literal `font-size:8px`, and `src/lib/cv-html.ts` has 9–10.5px
literals at `:244, :252, :254, :263, :264, :279, :286, :289, :292, :301`. At the preview's ~0.45 page scale
that paints as about 3.4 CSS px — smudge, not text.

**A floor for exactly this already exists and is used by nobody.** `apps/web/components/templates/engine/typography.ts`
defines `SMALL_PRINT_FLOOR_PX` (10.7 = 8pt at 96dpi) and `clampFontPx`, and **no file imports either**. That
file is also **untracked** — it is not even in the repository yet, so nothing in either app can be relying on
it. Establish which is true before you rely on it (read it, `git log --` it, grep both apps for importers).

**Do:**
- Introduce the floor in the **native** engine's token scale — one clamped function applied to the values the
  scale can emit (name, nameTitle, sectionLabel, roleTitle, orgName, body, meta, tag) — rather than editing
  218 generated template files, which are generated data and must not be hand-edited.
- Raise the sub-floor literals in `sections.ts` and `cv-html.ts` to the floor.
- Decide and state the fate of `typography.ts`: commit it into the tree if it is the right home for the
  constant (and import it), or delete it if the native tokens are the right home. Do not leave it untracked
  and unimported — a constant nobody imports is how this defect survived in the first place.
- Two tests pin the current CSS and must move in the same commit: `src/lib/cv-engine/registry-sync.test.ts:142`
  and `src/lib/cv-html.test.ts:99`. Check for others.
- Raising the minimum type makes long CVs taller against a fixed 1123px sheet, so an existing 2-page spill can
  worsen. **Measure that**: take the longest CV fixture you can find, render before and after, and report the
  page count both ways. Do not solve it (SmartFit is a later item) — just report whether it regressed.

## ITEM 2 — an export that fails says nothing

`src/services/save-to-device.ts` asks SAF for a folder permission anchored at
`content://…/document/primary%3ADocuments`, and its callers treat an ungranted folder as silence:

```ts
// src/screens/cv-editor-screen.tsx:457-461 and src/screens/app/cv-list-screen.tsx:70-76
if (saved.status === "cancelled") return;                 // nothing written, nothing said
if (saved.status === "unsupported") { …share sheet… }      // effectively iOS-only
```

So on Android, dismissing the folder picker (or any failure) ends with the user having tapped "Pakua PDF" and
received nothing at all — no file, no message, no share sheet. `expo-sharing` is already a dependency and is
already used by `src/screens/job-apply-screen.tsx` and `src/screens/pdf-tools-screen.tsx`.

**Do:** make every non-success outcome say something and offer the share sheet, so the system's own
"Save to Files / share" is always reachable; and stop pinning a single anchor folder — probe for one the
running OS accepts (the current comment records that Android 15 wanted Documents and Android 11+ refused the
volume root; Android 17's picker behaves differently again, verified on a Pixel 8 Pro). Keep that comment
style: record what you measured and on which Android version, so the next inversion is diagnosable.

Note what I measured while testing 1.6.28 on a Pixel 8 Pro (Android 17): the picker **did** open cleanly at
Documents and the export **did** complete, writing the file to `/sdcard/Documents`. So this is a
honesty/robustness fix, not a "the export is broken" fix — do not re-describe it as broken, and do not
restructure the flow.

Test the pure logic in `src/services/save-to-device.test.ts` (it already mocks `StorageAccessFramework`):
refused/cancelled → the caller is told to share rather than returning silently; granted → the file is written.

---

## Gates and report

`cd apps/native && npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js` — quote the
counts. Commit NAMED PATHS ONLY (this clone is shared; another session pushes to `main` between your runs, so
commit promptly and never `git add -A`). Report: files changed, the page-count measurement from Item 1 (before
and after), the exact commands with pass/fail counts, the commit sha, and what you could NOT establish.

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or a secret. Do NOT touch: the gallery, the landing page, maombi, the
print/A4 options (`1357cba`), or the AI shape fixes.
