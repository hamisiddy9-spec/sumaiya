import * as Application from "expo-application";
import Constants from "expo-constants";

import { pickVersion } from "./pick-version";

// ⚠️ `expo-application` has NO default export — `import Application from
// "expo-application"` is `undefined`, and reading `.nativeApplicationVersion`
// off it throws during module load, which killed 1.6.16 on launch ("[runtime not
// ready]: TypeError: Cannot read property 'nativeApplicationVersion' of
// undefined"). `tsc` cannot catch that shape: synthetic-default interop accepts
// a default import of a module with only named exports, and jest never loads the
// real native module. The namespace import cannot be undefined, and a missing
// export now degrades to pickVersion()'s fallback instead of a boot crash.

/**
 * The version of the build INSTALLED on this device.
 *
 * Order matters, and it is the reverse of what this file used to do:
 *
 *  1. `Application.nativeApplicationVersion` — the APK's own versionName. It
 *     cannot disagree with what the phone installed, because it IS what the
 *     phone installed.
 *  2. `Constants.expoConfig.version` — the config the JS was built with. Kept
 *     only as a fallback: measured on a real device (2026-09-15), an in-place
 *     update to 1.6.15 still reported 1.6.10 from here, while the APK's own
 *     embedded `assets/app.config` said 1.6.15. Config-sourced versions can
 *     therefore go stale after an update; the package-sourced one cannot.
 *  3. The legacy `manifest` shape, for old builds.
 *
 * The previous order (config first, then a hardcoded "1.6.10") meant Profile
 * lied about the version, telemetry stamped `appVersion: 1.6.10` on every
 * event, and the update prompt compared the manifest against a stale value —
 * so a phone already running the advertised build would be told to update.
 */
export const APP_VERSION: string = pickVersion([
  Application.nativeApplicationVersion,
  Constants.expoConfig?.version,
  (Constants as { manifest?: { version?: string } }).manifest?.version,
]);
