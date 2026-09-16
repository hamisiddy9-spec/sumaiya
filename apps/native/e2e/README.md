# Sumaiya Native — Maestro E2E

Minimal end-to-end smoke test for the Sumaiya native app (`pro.sumaiya.app`,
React Native / Expo) using [Maestro](https://maestro.mobile.dev/) YAML flows —
no native test code required.

## What it covers

`smoke.yaml` verifies the pre-auth path only:

1. Launches the app.
2. Waits for and asserts the sign-in screen is visible (the brand text `Sumaiya`).
3. Best-effort taps the `Tumia barua pepe` (email) CTA if present.

The app requires a real account to go further, so the flow intentionally stops
at the sign-in screen. The tap is `optional: true`, so it stays green in the
English locale (where the CTA reads "Use email instead").

## Prerequisites

- A connected Android device/emulator with the Sumaiya app installed
  (package `pro.sumaiya.app`). Check with:
  ```bash
  adb devices
  ```
- A release build is produced at
  `apps/native/android/app/build/outputs/apk/release/app-release.apk`.
  Install it with:
  ```bash
  adb install -r apps/native/android/app/build/outputs/apk/release/app-release.apk
  ```
- Java (JDK) available on `PATH`.

## Install Maestro

```bash
curl -Ls https://get.maestro.mobile.dev | bash
```

Verify the install:

```bash
maestro --version
```

## Run the flow

From the repo root:

```bash
cd apps/native/e2e
maestro test smoke.yaml
```

Or, without changing directory:

```bash
maestro test apps/native/e2e/smoke.yaml
```

## Notes

- Maestro matches text as a regex by default, so `Tumia barua pepe.*` matches
  the full label `Tumia barua pepe badala yake`.
- The sign-in CTA labels are bilingual (Swahili/English) and switch with the
  device locale; the smoke test avoids depending on any single CTA label for
  the pass/fail assertion.
