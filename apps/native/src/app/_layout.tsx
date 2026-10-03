import "../../global.css";
import React, { useEffect, useRef, useState } from "react";
import { AppState, LogBox, View } from "react-native";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getSecureItem, offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { reportError, setReporter } from "../lib/reporting";
import { flushTelemetry, shortMessage, startTelemetry, track } from "../lib/telemetry";
import { setAnalyticsSink } from "../lib/analytics";
import { cleanupSharedApkCopies } from "../lib/apk-share";
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
        // Preload fonts
        await Font.loadAsync({
          // Add custom fonts if needed
        });

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

        // A share copy from a previous run that was never cleaned up (app
        // killed mid-share) — sweep it now rather than leaving it in cache
        // indefinitely. Best-effort: no keepFilename, so this only runs when
        // nothing here could be actively mid-share.
        void cleanupSharedApkCopies();

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
        console.warn("Font loading error:", e);
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
