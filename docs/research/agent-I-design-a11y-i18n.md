# Agent I — a11y / i18n / Swahili typography / design / sound

## Accessibility
- **axe-core / @axe-core/playwright** https://github.com/dequelabs/axe-core — Deque's a11y rules engine, WCAG 2.0/2.1/**2.2** rulesets, catches ~30–50% of issues automatically. MPL-2.0/MIT. *Web CI gate — one spec per key route, fail build on violations.*
- **jest-axe** https://github.com/nickcolley/jest-axe — axe assertions in Jest component tests. MIT. *Guard shared UI primitives at unit level.*
- **Guidepup + virtual-screen-reader** https://guidepup.dev — real SR automation (VoiceOver/NVDA) + headless virtual SR for unit tests. MIT. *virtual-SR in CI; real VoiceOver/NVDA locally before releases.*
- **eslint-plugin-jsx-a11y** — static JSX a11y checks, in Next's built-in ESLint. MIT.
- **RN a11y**: NO mature axe-equivalent for RN. Realistic stack = RN props (`accessibilityLabel/Role/State`, `AccessibilityInfo`) + **Google Accessibility Scanner** (audits running Android build for contrast/label/touch-target) + manual **TalkBack** passes on a real cheap device. `react-native-accessibility-engine` (Jest asserts) is low-activity — optional.
- **Dynamic type (RN)**: don't `allowFontScaling={false}` globally — cap per role with `maxFontSizeMultiplier` on a wrapped `<AppText>` (body ~2.0, captions ~1.8, headings ~1.4, buttons ~1.3) so layouts survive 200%. ⚠️ Fabric/new-arch has had `maxFontSizeMultiplier` bugs (RN#35658) — verify on your version. Web: size in `rem`, never `maximum-scale=1`/`user-scalable=no` (WCAG 1.4.4).
- **Focus (web)**: **React Aria** (Adobe, Apache-2.0, WAI-ARIA-correct) if building custom components; **focus-trap-react** (MIT) if you only need modal trapping. ⚠️ don't stack two focus libs (React Aria + Radix conflict) — pick one system.
- **Contrast**: WCAG 2.2 (4.5:1) still the legal target (EAA enforcement mid-2025); **APCA** (WCAG 3 draft) better for warm-on-cream where 2.x misleads — pass 2.2 for compliance, tune with APCA. Figma: Contrast ◈, TintSense, Visual Contrast plugins. ⚠️ **mid-tone terracotta on white is ~3:1 — fails AA for body text**; reserve for large text / non-text UI or darken to ~#9A4A2E for text.

## i18n / l10n
- **Lingui (js-lingui)** https://lingui.dev — ~2kB, compile-time macros, CLI extract→compile, ICU MessageFormat, PO catalogs. **ONE workflow across Next.js App Router (RSC-compatible) AND React Native/Expo** — same `lingui extract` → one PO catalog both apps consume. Lingui ≥5 + RN ≥0.76/Expo ≥52. MIT. **Strongest match for "shared catalog, web + Expo."**
- **next-intl** https://next-intl.dev — i18n purpose-built for Next App Router, native ICU, locale routing, RSC. Default rec for new App Router projects. Web only. *Choose Lingui (shared catalog) OR next-intl + react-i18next on native.*
- **react-i18next + i18next-icu + expo-localization** — battle-tested RN combo; `i18next-icu` adds full ICU/plural; `expo-localization` for device locale/region/currency. Works in Next too (shareable JSON catalog). MIT.
- **Weblate** https://weblate.org — self-host continuous-localization, git-native, deepest features, first-class PO (clean fit w/ Lingui). GPL-3.0. Heavier to run (Django/Redis/Postgres).
- **Tolgee** https://tolgee.io — dev-first OSS TMS, **in-context editing** (alt-click a string in your running app to translate), JS/React/Next SDKs. Apache-2.0. *Lighter than Weblate; good if translators are non-technical.*
- **Swahili CLDR plurals: exactly TWO categories — `one` (n=1) and `other` (everything else incl. 0)**, structurally like English. `{count, plural, one {...} other {...}}` is sufficient — no `few`/`many`. (Most Bantu = 1-or-2 category.)
- ⚠️ **Noun-class agreement (ki-/vi-, m-/wa-) is NOT expressible in ICU plural** — don't encode "kitabu → vitabu" in MessageFormat. Keep countable nouns out of interpolated slots where the class prefix changes; write full phrases per branch; give translators `select` on item type.
- **Intl on Hermes (RN)**: partial `Intl` — often still need `@formatjs/intl-pluralrules` + `@formatjs/intl-locale` polyfills for reliable pluralization + `Intl.NumberFormat`. **Test `Intl.NumberFormat('sw-TZ'/'sw-KE', {style:'currency', currency:'TZS'/'KES'})` on a real cheap Android build**, not the simulator.
- RTL: SW + EN both LTR, no RTL work. Still use `start/end` (CSS logical props; RN `marginStart`) not `left/right`.

## Swahili / Bantu typography
- **Google "African Latin" fonts** — Questrial expanded with full African-Latin glyph set (design.google/library). OFL. Swahili needs no exotic glyphs, but matters if you add Lingala/Kikuyu/Kinyarwanda.
- **SIL fonts** https://software.sil.org/fonts/ — full Latin-Extended coverage. **Andika** = designed for literacy/beginning readers (clear a/g/I/l) — **relevant for lower-literacy users**. **Charis** = readable serif, hinted low-DPI build. OFL.
- **Noto Sans** — free guaranteed-coverage fallback with matched vertical metrics. OFL. *Noto Sans as fallback in the stack; a warmer humanist serif for headings.*
- **Swahili text runs ~20–35% LONGER than English** (agglutination: `hakutuletea`, `wanaojiendeleza`). Rules:
  - **Design line length + containers to the SW string, not EN.** Allow buttons/labels to wrap to 2 lines rather than truncate. Never fix container heights around EN copy.
  - CSS: `hyphens: auto` **with `lang="sw"`** — but browser SW hyphenation dicts are weak/absent, so also `overflow-wrap: break-word` + `hyphenate-limit-chars` as the real safety net on narrow viewports.
  - RN has no auto-hyphenation — rely on `flexShrink`, sparing `numberOfLines`, generous wrapping.
  - **Avoid ALL-CAPS for SW UI text** — obscures the morphology that aids reading. Sentence case.
  - No special shaping/combining-mark issues for Swahili itself — standard fonts render it fine.

## Design references
- **designsystems.surf** + **component.gallery** — curated catalogs of real production design systems (tokens/components/docs). Reference for your token architecture.
- **Material Design 3 "Expressive"** (2025) — native fit for Android on cheap phones; its tonal colour-role system (surface/primary/on-primary) maps cleanly onto a single **warm terracotta seed** → generate the tonal palette from it. Apache-2.0.
- **Afrocentric, tastefully**: AVOID kente-print backgrounds, mud-cloth borders, acacia-at-sunset, "tribal" display fonts. BORROW principles: ochre/terracotta/clay earth tones + one bright accent, bold geometric rhythm, generous texture, asymmetric balance. Study contemporary East African fintech/job-platform UIs + Nairobi/Lagos studios directly, not stock pattern packs. The tasteful version reads editorial + warm, not decorated.
- **Editorial / "organic modernism"** (2026): treat each screen like a magazine spread (clear hero, one job), warm off-white ground (~`#FBF6F0`) not pure white, body copy in a real serif at readable sizes, terracotta as accent/structure not fill.
- **Multi-step mobile form UX** (2025 research): single column, **labels above fields** (~50% faster completion vs left-aligned); 3–5 fields/step, 4–7 steps, progress indicator for >3 steps; match mobile keyboards (`inputmode`, `autocomplete` tokens); **inline on-blur validation** not submit-time; **persist progress between steps server-side** (critical on flaky connections + app kills); section headings + whitespace, never a 30-field wall. Multi-step out-converts single-step by up to ~60% for lead-gen flows.

## Micro-interaction / sound / haptics
- **expo-haptics** — cross-platform (iOS Taptic, Android vibration, Web Vibration API). `impactAsync`, `notificationAsync(success/warning/error)`, `selectionAsync`. MIT, first-party. *Default. Use sparingly — `selectionAsync` on stepper/segment changes, `notificationAsync` on submit success/error only.*
- **Pulsar (react-native-pulsar, Software Mansion)** — advanced haptics, custom pattern composer, **worklet-compatible with Reanimated** (haptics synced to animation on UI thread). New (2025), credible maintainer. Only if you want gesture-coupled haptics.
- **Reanimated 3/4 + Gesture Handler** — UI-thread animation, the RN standard. Critical on cheap Android where JS-thread jank is worst. Keep springs subtle, respect `AccessibilityInfo.isReduceMotionEnabled()`.
- **Motion** (ex-Framer Motion) https://motion.dev — web animation, honour `prefers-reduced-motion`.
- **"One earcon" sound design**: ship **ONE** short (<400ms) positive earcon for the single most meaningful success moment ("CV complete" / "application sent") and NOTHING else — silence is a design choice, every extra sound cheapens it. Distinctive, abstract, brand-derived two-note motif, never a stock "ding". **Off by default on Android** (shared/public listening in EA); pair with haptic so confirmation lands silently; settings toggle; respect system silent mode. Design in Audacity, deliver small AAC/OGG, play via **`expo-audio`** (expo-av deprecated in SDK 52+).
