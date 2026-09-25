import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

interface SumaiyaApkShareNativeModule {
  apkSourcePath: string;
}

// `requireOptionalNativeModule` (not `requireNativeModule`) on purpose: this
// module is Android-only (see expo-module.config.json) and must resolve to
// null rather than throw on iOS, on web, or in any build where the native
// side hasn't been compiled in yet — an import-time throw here would crash
// the whole JS bundle, not just the share button.
const nativeModule = requireOptionalNativeModule<SumaiyaApkShareNativeModule>("SumaiyaApkShare");

/**
 * The on-device path to this app's own installed APK. Android only — returns
 * null on iOS, on web, and if the native module isn't linked into this build.
 * Callers must treat null as "sharing unavailable", never throw.
 */
export function getApkSourcePath(): string | null {
  if (Platform.OS !== "android") return null;
  try {
    return nativeModule?.apkSourcePath ?? null;
  } catch {
    return null;
  }
}
