import "../../global.css";
import React, { useEffect, useRef, useState } from "react";
import { AppState, LogBox, View } from "react-native";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { BricolageGrotesque_800ExtraBold } from "@expo-google-fonts/bricolage-grotesque";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from "@expo-google-fonts/hanken-grotesk";
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getSecureItem, offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { reportError, setReporter } from "../lib/reporting";
import { flushTelemetry, shortMessage, startTelemetry, track } from "../lib/telemetry";
import { setAnalyticsSink } from "../lib/analytics";
import { pushLogEntry } from "../lib/log-buffer";
import { setScreenshotRoot } from "../lib/screenshot";
import { AuthProvider } from "../contexts/auth-context";
import { LangProvider } from "../lib/i18n";
import { LanguageSync } from "../lib/language-sync";
import { RootNavigator } from "../navigation/root-navigator";
import { UpdatePrompt } from "../components/update-prompt";
import { DialogHost, ToastHost } from "../components/ui";
import { ConnectivityGate } from "../components/connectivity-gate";
import { ErrorBoundary } from "../components/error-boundary";
import { ReportSheetHost } from "../components/report-sheet";

SplashScreen.preventAutoHideAsync();

// Keep Reanimated's warnings but drop strict render-phase nags — several of our
// screens legitimately read a shared value to seed initial layout.
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

// Fabric + react-native-screens 4.26 race: during a stack transition Reanimated
// can briefly target a view that `screens` has already detached, logging
// "synchronouslyUpdateUIProps failed". The transition still completes correctly;
// there's nothing to fix on our side while the SDK-57 versions stay pinned.
LogBox.ignoreLogs(["synchronouslyUpdateUIProps"]);

/**
 * §2 TYPOGRAPHY — three families, three jobs (`docs/DESIGN-GUIDE.md`).
 *
 *   display / headings  Bricolage Grotesque (800) — geometric grotesque
 *   body / UI           Hanken Grotesk            — warm humanist, excellent small
 *   numeric / eyebrows  JetBrains Mono            — elapsed times, tracked uppercase
 *
 * The KEY here is the family name React Native resolves at paint time, so it is
 * what a style's `fontFamily` must be set to and what `tailwind.config.js`'s
 * `fontFamily.display/sans/mono` lists first (NativeWind/`react-native-css-interop`
 * keeps only the first entry of that array — `parseFontFamily` returns
 * `fontFamily[0]` — so the real name has to lead).
 *
 * Every file is a `require()`d asset inside the package: Metro bundles the .ttf
 * into the binary and `expo-font` loads it from disk. Nothing here is fetched at
 * runtime, so a cold start with no network still gets the real faces.
 *
 * Weights are the ones this app actually asks for (an inline `fontWeight: "700"`
 * paired with a family whose file is a different weight is how Android silently
 * falls back to the system font), so the bold body weights are registered too.
 * `FONT_FAMILIES` just below is the guide's three families; the rest are their
 * bolder cuts, for a screen that needs one without leaving the family.
 */
const FONT_FAMILIES = {
  display: "BricolageGrotesque_800ExtraBold", // headings, weight 800
  sans: "HankenGrotesk_400Regular", // body / UI
  mono: "JetBrainsMono_400Regular", // numerics, eyebrows
} as const;

const FONT_ASSETS = {
  // The guide's three families — the key IS the name React Native resolves.
  [FONT_FAMILIES.display]: BricolageGrotesque_800ExtraBold,
  [FONT_FAMILIES.sans]: HankenGrotesk_400Regular,
  [FONT_FAMILIES.mono]: JetBrainsMono_400Regular,
  // Bolder cuts of the same two families, for the UI's existing 600/700/800
  // labels: a `fontWeight` whose cut is not registered is how Android drops
  // silently back to the system font.
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  JetBrainsMono_500Medium,
};

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();
  const [ready, setReady] = useState(false);
  // Bump to force a full re-mount after an ErrorBoundary reset.
  const [bootKey, setBootKey] = useState(0);
  // The view a problem report screenshots. Registered once, read from a plain
  // module (lib/screenshot.ts) so the report sheet can capture it even when
  // it's mounted outside every provider — see report-sheet.tsx's file header.
  const rootViewRef = useRef<View>(null);

  useEffect(() => {
    async function prepare() {
      try {
        // Preload fonts (§2 TYPOGRAPHY). Bundled assets — see FONT_ASSETS.
        //
        // Isolated in its own try/catch, and NOT allowed to throw out to the
        // outer one: the rest of this effect opens SQLite, applies the saved
        // theme and starts telemetry, and a missing font must not take those
        // down with it.
        try {
          await Font.loadAsync(FONT_ASSETS);

          // Registering a font is SILENT when it fails: React Native falls back
          // to the system font and the heading is merely wrong on screen — which
          // is precisely the state §2 flags in Stitch's own render (every run
          // serif while the CSS declares two sans families). So read back the
          // names the loader actually holds and make a miss loud, rather than
          // letting it look like a typography decision.
          const loaded = Font.getLoadedFonts();
          const missing = Object.keys(FONT_ASSETS).filter((name) => !loaded.includes(name));
          const missingFamilies = Object.values(FONT_FAMILIES).filter((name) => !loaded.includes(name));
          if (missing.length > 0) {
            const detail = `not registered: ${missing.join(", ")}${
              missingFamilies.length > 0 ? ` — §2 families missing: ${missingFamilies.join(", ")}` : ""
            }`;
            pushLogEntry("error", "fonts.load", detail);
            reportError(new Error(`fonts ${detail}`), { scope: "fonts.load" });
          }
        } catch (fontError) {
          pushLogEntry("error", "fonts.load", shortMessage(fontError));
          reportError(fontError, { scope: "fonts.load" });
        }

        // offlineStorage (SQLite-backed sync queue) was never initialized
        // anywhere in the app — every call to it (addToSyncQueue,
        // getSyncQueue, ...) threw "Database not initialized" immediately.
        // That's the sync queue behind every CV save (use-offline-sync.ts
        // -> queueOperation), so saving a CV has been failing outright.
        // Open the connection once, here, before any screen can touch it.
        try {
          await offlineStorage.init();
        } catch (dbError) {
          reportError(dbError, { scope: "offlineStorage.init" });
        }

        // Apply an explicit dark-mode choice from Settings before first
        // paint — otherwise the app would flash the OS scheme on every
        // launch until the user happens to revisit Settings.
        const savedDarkMode = await getSecureItem("darkMode");
        if (savedDarkMode === "true") setColorScheme("dark");
        else if (savedDarkMode === "false") setColorScheme("light");

        // Anonymous usage telemetry. Until now a crash or a failed update on a
        // tester's phone left no trace anywhere we could read, which made every
        // bug report a guess. This is the only signal we get from the field.
        // `started` is true only for the call that actually initialised the
        // queue: without that guard every re-run of this effect sent another
        // app.open.
        void startTelemetry().then((started) => {
          if (started) track("app.open", { cold: true });
        });

        // Everything that already goes through reportError (sync failures,
        // chat errors, boundary catches, a failed SQLite open) now also lands in
        // telemetry as a breadcrumb — one seam, every existing call site.
        setReporter((error, context) => {
          const scope = typeof context?.scope === "string" ? context.scope : "unknown";
          const message = shortMessage(error);
          pushLogEntry("error", scope, message);
          track("app.error", { scope, message });
        });

        // The activation funnel (signed_up, onboarded, cv_created, ...) is
        // real event NAMES declared in lib/analytics.ts, but that module's
        // `track()` only ever did `console.info` — `setAnalyticsSink()` existed
        // to plug in a real sink and nothing ever called it, so none of those
        // seven events had reached the server. Route them into the same
        // batched pipe as everything else in app_event.
        //
        // `setAnalyticsSink` replaces a single module-level function reference,
        // not a subscriber list, so calling it more than once is harmless —
        // the last call always wins and nothing double-fires. That makes it
        // idempotent by construction, unlike `startTelemetry()` (which opens a
        // queue + timer and DOES need the `started`-flag guard above to avoid
        // starting twice); a `started`-style guard here would just be dead code.
        setAnalyticsSink((name, props) => {
          pushLogEntry("event", name, props && Object.keys(props).length ? shortMessage(JSON.stringify(props)) : undefined);
          track(name, props ?? {});
        });
      } catch (e) {
        // Fonts are handled (and reported) in their own try above, so whatever
        // reaches here is the SQLite open / theme / telemetry group.
        console.warn("Startup prepare error:", e);
      } finally {
        setReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [setColorScheme]);

  // Android may kill a backgrounded app without further warning, and the
  // telemetry flush timer dies with it. This is the last chance to hand the
  // queue over while we still can.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") void flushTelemetry();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setScreenshotRoot(rootViewRef);
    return () => setScreenshotRoot(null);
  }, []);

  // Hold the React tree behind the native splash until the SQLite cache is open
  // and the theme choice is applied — so no screen queries an uninitialised DB
  // and there's no light/dark flash on launch.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View ref={rootViewRef} collapsable={false} style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ErrorBoundary key={bootKey} onReset={() => setBootKey((k) => k + 1)}>
            <AuthProvider apiClient={apiClient}>
              <LangProvider>
                <LanguageSync />
                <RootNavigator />
                <ConnectivityGate />
                <UpdatePrompt />
                <DialogHost />
                <ToastHost />
                <StatusBar />
              </LangProvider>
            </AuthProvider>
          </ErrorBoundary>
          {/* A sibling of ErrorBoundary, not a child: the crash screen's own
              "Report a problem" button (error-boundary.tsx) must still have a
              host to open even after everything below ErrorBoundary unmounts. */}
          <ReportSheetHost />
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
