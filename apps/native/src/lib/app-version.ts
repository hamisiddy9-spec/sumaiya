import Constants from "expo-constants";

/**
 * The version this build was compiled with. Comes from app.json (embedded by
 * `expo prebuild` via expo-constants). The fallback must be kept in sync with
 * app.json's `version` for the rare case expoConfig is unavailable.
 */
export const APP_VERSION: string =
  Constants.expoConfig?.version ??
  (Constants as { manifest?: { version?: string } }).manifest?.version ??
  "1.6.10";
