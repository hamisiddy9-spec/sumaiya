# Agent C — RN/Expo, monorepo, low-end perf, design systems, PDF, spec-driven UI
(all verified active ~2026-09-09)

## RN / Expo gems
- **Nitro Modules** https://github.com/margelo/nitro — statically-compiled JSI bindings (C++/Swift/Kotlin), ~15× faster calls than TurboModules. Becoming the default for serious native modules (Margelo = FlashList/MMKV). MIT.
- **react-native-nitro-fetch** https://github.com/margelo/react-native-nitro-fetch — drop-in `fetch` backed by native OkHttp/URLSession + prefetch. **TTFB + JSON-parse wins on low-end Android**; prefetch next screen's template data.
- **react-native-nitro-sqlite** https://github.com/margelo/react-native-nitro-sqlite — fast sync/async SQLite over Nitro (successor to quick-sqlite). Store all 273 templates + docs locally.
- **Legend List** https://github.com/LegendApp/legend-list — drop-in FlashList/FlatList replacement for new arch, no `estimatedItemSize`, bidirectional infinite scroll. 3.3k★ MIT. Template gallery smooth on 1GB-RAM.
- **react-native-keyboard-controller** https://github.com/kirillzyusko/react-native-keyboard-controller — unified animated keyboard handling; **Expo-recommended, mandatory with Android edge-to-edge**. 273 form-heavy templates = endless keyboard bugs; this fixes them.
- **react-native-edge-to-edge** https://github.com/zoontek/react-native-edge-to-edge — Android 15 forces edge-to-edge; this is the migration path. Required baseline.
- **Zeego** https://github.com/nandorojo/zeego — truly native context/dropdown menus, Radix-style API, zero jank + free a11y.
- **Flashlight** https://github.com/bamlab/flashlight — **Lighthouse-for-mobile**: perf benchmarks on real Android via ADB, single score to gate CI. Works on any APK, no native changes. **Set a score budget on an actual cheap device, fail PRs that regress.**
- **Re.Pack** https://github.com/callstack/repack — Rspack/webpack RN bundler with true code-splitting + Module Federation (lazy-load screens as remote bundles). Only mature path to less upfront JS in RN. Big win on slow first launch.
- **react-native-directory** https://reactnative.directory — check "is this lib alive / new-arch ready".

## "One spec → web + native (+ PDF)"
- **React Strict DOM** https://github.com/react/react-strict-dom — Meta's write-once styled React (DOM-like API + StyleX) rendering web AND RN. In production at Meta. Pre-1.0 → "use for leaf components." Strategic bet.
- **Tamagui** https://github.com/tamagui/tamagui — compiler-driven style system, 100% RN parity, same components → atomic CSS on web / Views on native, first-class tokens/themes. 14.2k★ MIT. **Most mature "universal design system + optimizing compiler" — strong candidate for the shared `@sumaiya/ui`.**
- **Gluestack UI v2** https://github.com/gluestack/gluestack-ui — copy-paste universal components on NativeWind/Tailwind, a11y-first, RN + Next. shadcn-style ownership. Faster on-ramp if team knows Tailwind; semantic HTML on web for SEO. (verify license)
- **Ark UI** https://github.com/chakra-ui/ark — headless unstyled a11y components (45+) on Zag.js state machines, React/Vue/Solid/Svelte parity. MIT. Web headless layer + own tokens.
- **Base UI** https://github.com/mui/base-ui — unstyled a11y primitives from Radix+Floating UI+MUI creators, v1.0 in 2026. **The actively-maintained heir to Radix** (which stagnated). Web only.

## Monorepo (2026 state)
Turborepo (Vercel) is the default for TS-only app monorepos, ~80% of Nx's value, simpler. Nx wins only at enterprise scale via **Nx Agents** (distributed CI) + generators. RN-in-monorepo: both work; **Metro config is the friction point, not the task runner**. Expo's own docs + `create-expo` handle the wiring now.
- **moon** https://github.com/moonrepo/moon — Rust task runner + toolchain manager (auto-pins everyone's Node/pnpm/Bun/Rust/Go versions), polyglot. The "reproducibility" pick, small community (~50k dl vs Turborepo 2M). Worth knowing if Python/Rust services get added.
> ⚠️ Note vs earlier D1 decision (Nx): this agent leans Turborepo for a TS-only web+native repo. Reconcile — Nx's enforced module boundaries + Agents vs Turborepo's simplicity + Vercel-native + smoother Metro.

## Low-end Android / slow net
- **unpic-img** https://github.com/ascorbic/unpic-img — responsive `<img>`: detects your CDN, generates srcset/sizes, zero client JS, no CLS. Framework-agnostic. Web thumbnails to 360px screens.
- **unpic-placeholder** — server-side LQIP (dominant colour / BlurHash / **ThumbHash ~25 bytes/image**), no client decode JS.
- **expo-image** (first-party) — memory+disk cache, blurhash/thumbhash placeholders, low memory. Use everywhere instead of RN `<Image>`; `cachePolicy="memory-disk"`.
- **Save-Data / "lite mode":** no single lib — read `Save-Data: on` header + `navigator.connection.effectiveType`/`saveData`, branch (skip hero images, defer JS, BlurHash-only). Cheap in Next.js middleware; small internal util.

## PDF generation
- **Typst** https://github.com/typst/typst — Rust markup typesetting, compiles data→PDF ~10× faster than LaTeX (200–500ms/doc), single small binary (no 1GB TeX), Apache-2.0. 56k★. **Excellent fit — each of 273 templates as a Typst file with data placeholders, render server-side fast + cheap, any TTF for Swahili/Latin.**
- **Gotenberg** https://github.com/gotenberg/gotenberg — Docker: headless Chromium + LibreOffice + QPDF behind one HTTP API. De-facto self-hosted PDF-as-a-service. Use if you render templates as HTML/CSS (reuse web design system).
- **WeasyPrint** https://github.com/Kozea/WeasyPrint — Python HTML/CSS→PDF, no browser, good Paged Media. Lighter than Gotenberg; weaker on modern flexbox/grid.
- **@react-pdf/renderer** https://github.com/diegomura/react-pdf — PDFs from React components (Flexbox-ish). Closest to "one component tree → PDF" but not pixel-identical to web CSS; line-height/font caveats.
- **Satori** (Vercel) — HTML/CSS subset → SVG → PNG/PDF. Great for share cards / preview images, **not** 273 multi-page templates.
- **expo-print** + **@kishannareshpal/expo-pdf** — on-device HTML→PDF in app cache (**works offline**) + native PDF viewer. Offline export path; keep Typst/Gotenberg as high-fidelity online path.

## Spec-driven / data-driven UI
- **Puck** https://github.com/puckeditor/puck — OSS visual React editor, content = JSON payload, same config powers editor + production render. 13.3k★ MIT. **Strong fit for a template-authoring back office** — non-devs compose the 273 templates visually; JSON spec feeds the renderer (web → map to native/PDF).
- **JSON Forms** https://github.com/eclipsesource/jsonforms — forms from JSON Schema + separate UI Schema; React/Angular/Vue renderer sets, pluggable custom renderers. The 273 templates are mostly structured data entry → model as schema, get forms + validation free, swap renderer per platform.
- **react-jsonschema-form (RJSF)** — the other mature schema→form lib, bigger community, less clean layout/data separation, web-only in practice.
- **Plasmic** https://github.com/plasmicapp/plasmic — visual builder + headless CMS, attaches to your own component library. Heavier than Puck; full design→production.
- **Legend-State v3** https://github.com/LegendApp/legend-state — ultra-fast fine-grained reactive state w/ first-class local-first sync plugins, ~4kb. **Offline-first state layer for the Career Spine** — edits persist locally, sync on connection.

## Established essentials (brief)
- **FlashList v2** (Shopify) — new-arch rewrite, no `estimatedItemSize`, safe default list.
- **reanimated** + **react-native-skia** (Software Mansion) — animation/graphics foundation; Skia can render charts/signatures + export images for PDFs.
- **Rive** https://github.com/rive-app/rive-react-native — vector state-machine animations, far smaller runtime + files than Lottie. Good for low-end + tiny bundle budgets.
