# templatehub-native — local dev

Standalone copy of the TemplateHub native app (Expo SDK 57, RN 0.86).
Extracted 2026-09-07 from the `archive/native-mobile-app` branch of
`~/TemplateHub` (the `apps/mobile/` subtree). **Local only** — no git remote,
not published, no EAS builds, no store submission.

## Run

    npm install          # or: npm ci  (package-lock.json is committed)
    npm start            # Expo dev server → scan QR / press 'a' for Android

`npm run android` / `npm run ios` build native dev clients (needs Android
Studio / Xcode). `.env` holds the API + Supabase config (mirrors eas.json).

## Talks to production

The app calls the live API at `https://templatehub.pro` and Supabase project
`ayczgaddnufdxnhizpcr`. No local backend needed. Auth = email/password +
Google, handled by supabase-js directly.

## Relationship to the web repo

`vendor/` holds pinned copies of the shared `@templatehub/*` packages
(api-client, types, utils, etc.), wired via `metro.config.js` resolveRequest.
If the web API contract changes, update the matching vendor file by hand.

## Status (2026-09-07 handoff)

- `npm ci` ✓ (622 packages, `.npmrc` has `legacy-peer-deps=true`)
- `npx expo config` ✓ (app config loads)
- Fixed on import: 3× `execAsync`→`runAsync` in `vendor/utils/offline-storage.ts`
  (SDK-57 dropped params from `execAsync`), `useCVs()` missing `apiClient` arg
  in `job-detail-screen`, `global.css` type decl.
- **`tsc --noEmit` exits 0** (was 16 errors). Pinned `typescript@~5.9.3`,
  added `<ParamList, undefined>` + `id={undefined}` to all navigators
  (RN Navigation 7.18 quirk), fixed 3 web-CSS-in-RN bugs.
- Tests in `src/__tests__/` need a runner (jest-expo) — not wired up here.
- `expo export` (full Android bundle) succeeds.

## Suggested first tasks

1. ✓ done — `npm test` (jest-expo), 60/60 pass. Add more coverage.
2. Re-verify auth + OCR + chat + PDF export against the live API on a
   device/emulator — this is the real regression surface.
3. `npx expo install --fix` (RN 0.86.2→0.86.3, svg 15.15.5→15.15.4).
4. Decide: keep `vendor/` copies, or a real shared-package link to `~/TemplateHub`.
5. The typing-indicator animations are now static (were silent no-ops) —
   reanimate with `react-native-reanimated` if desired.

## World-class UI pass (2026-09-07)

Every screen rebuilt on a real design system. `src/components/ui/`:
Button · TextField · Screen · Card · Skeleton · EmptyState · SectionHeader ·
ListRow · Stagger · haptics · theme (useThemeColors).

- Navigation: `AnimatedTabBar` (4 tabs), screen transitions, gesture-handler +
  safe-area providers mounted. Settings merged into Profile.
- Splash + swipeable parallax onboarding.
- Auth: inline validation, keyboard flow, Google SVG logo, password strength.
- Home / CV list / Profile / Scan (camera overlay) / Scan-processing (scan-line)
  / Template picker / Sumaiya chat / Learning hub / Job detail / CV editor
  (multi-section, add/remove experience·education·skills) — all rebuilt.
- Haptics + reanimated entrances throughout. No emoji-as-icon, no `hover:`
  classes, no deprecated SafeAreaView, no `TouchableOpacity`.

`tsc` 0 · `jest` 60/60 · `expo export` green at every commit.

### Still to do
- Device/emulator smoke test the real flows (auth, camera OCR, chat, PDF export).
- `chat-message` rich types beyond text (recommendation/learning headers) are minimal.
- `learning-resources.tsx` component not yet themed (renders inside chat only).
