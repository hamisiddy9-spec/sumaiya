# Fix brief: two verified render defects (native). Two items only.

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS. Do NOT bump the version, do not
switch branches, do not upgrade a dependency. Both items are one-liners; do not refactor around them.

Full background (read it, but do not attempt items 3+ — they are a later brief):
`docs/RENDER-ENGINE-PLAN-2026-09-23.md`, sections A1 and A4.

---

## ITEM 1 — every document surface is software-rasterised

`androidLayerType="software"` is set on all three document WebViews:

- `src/components/cv/cv-preview-card.tsx:288` (card thumbnail WebView)
- `src/components/cv/cv-preview-card.tsx:409` (full-screen preview WebView)
- `src/components/cv/real-template-thumb.tsx:63` (TemplateHub preview modal)

`react-native-webview`'s own default is `'none'` (`node_modules/react-native-webview/src/WebView.android.tsx:73`),
which means no `View.setLayerType` override and therefore normal hardware rasterisation. The prop maps 1:1
onto `setLayerType` (`node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebViewManagerImpl.kt:566-574`).
`LAYER_TYPE_SOFTWARE` makes Chromium rasterise the whole page into a CPU bitmap and composite that bitmap
onto a 2.75–3x-density screen — and the preview shows the A4 sheet at 0.38–0.52 scale
(`src/lib/cv-engine/fit.ts:45-48`), so that raster is exactly where perceived sharpness lives.

**Do:** delete the `androidLayerType="software"` line from those three WebViews (leaving the library default).
**Do not:** set `"hardware"` explicitly — the default is already the unforced path, and an explicit value is
one more thing that can be wrong on an exotic ROM.
**Note in the commit message:** this prop exists in the wild to dodge blank/black WebViews on some Android
builds, so the revert is re-adding one line per surface. Say that in the message rather than leaving it to be
rediscovered.

## ITEM 2 — exported PDFs are US Letter, not A4

`Print.printToFileAsync` is called with no page-size options, and expo-print's Android implementation builds
its media size only from `PrintAttributes`, defaulting to `DEFAULT_MEDIA_WIDTH = 612` /
`DEFAULT_MEDIA_HEIGHT = 792` (US Letter) — verified in the installed dependency:
`node_modules/expo-print/android/src/main/java/expo/modules/print/PrintPDFRenderTask.kt:23-24`, and it DOES
honour an override at `:57-62`. The `@page { size: A4 }` in the HTML (`src/lib/cv-engine/render.ts:148`,
`src/lib/cv-html.ts:203`) is ignored on that path. Measured on a real export from the installed app: the
PDF's MediaBox was **612x792pt**.

Every document is authored **794x1123** (`src/lib/cv-engine/fit.ts:34-35`), which is 67 CSS px taller than a
Letter content box — so a one-page CV exports as a two-page PDF with a sliver on page 2.

**Do:** pass `width: 595, height: 842` (A4 at 72dpi = 595.28x841.89pt) to **every** `printToFileAsync` call:

- `src/services/pdf-export.ts:66`
- `src/screens/job-apply-screen.tsx:119-121`
- `src/screens/pdf-tools-screen.tsx:91`

Use a single shared constant (e.g. `A4_W_PT` / `A4_H_PT` next to the existing print helper) rather than three
copies of the literals, and add a test that asserts every `printToFileAsync` call site passes them — a static
guard in the style of the existing ones in that folder.
**Flag in your report, do not paper over:** whether the exported layout is actually correct still depends on
Chromium's CSS-px-per-inch for print in the installed WebView. If it is 96, the print viewport becomes
793x1123 and this alone is correct. If it is 72 the page may clip its right edge, which would need a
print-only wrapper. State that you could not verify a real export from here.

---

## Gates and report

`cd apps/native && npx tsc --noEmit` and `npx jest` (JEST — never vitest in this app). Commit NAMED PATHS
ONLY — never `git add -A`; this clone is shared with another agent. Report: files changed, exact commands,
pass/fail counts, the commit sha, and what you could NOT establish.

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or any secret. Do not touch the gallery, the fonts, the type scale or the
landing page — those are separate briefs and would widen this one.
