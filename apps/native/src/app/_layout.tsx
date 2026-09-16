import "../../global.css";
import React, { useEffect, useState } from "react";
import { AppState, LogBox } from "react-native";
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
import { captureException } from "../lib/sentry";
import { flushTelemetry, shortMessage, startTelemetry, track } from "../lib/telemetry";
import { AuthProvider } from "../contexts/auth-context";
import { LangProvider } from "../lib/i18n";
import { LanguageSync } from "../lib/language-sync";
import { RootNavigator } from "../navigation/root-navigator";
import { UpdatePrompt } from "../components/update-prompt";
import { DialogHost } from "../components/ui";
import { ConnectivityGate } from "../components/connectivity-gate";
import { ErrorBoundary } from "../components/error-boundary";

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

        // Everything that already goes through reportError (sync failures,
        // chat errors, boundary catches, a failed SQLite open) now also lands in
        // telemetry as a breadcrumb — one seam, every existing call site.
        setReporter((error, context) => {
          track("app.error", {
            scope: typeof context?.scope === "string" ? context.scope : "unknown",
            message: shortMessage(error),
          });
          // Ship the same error to Sentry — a no-op until a real
          // EXPO_PUBLIC_SENTRY_DSN is configured.
          captureException(error, context);
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

  // Hold the React tree behind the native splash until the SQLite cache is open
  // and the theme choice is applied — so no screen queries an uninitialised DB
  // and there's no light/dark flash on launch.
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary key={bootKey} onReset={() => setBootKey((k) => k + 1)}>
          <AuthProvider apiClient={apiClient}>
            <LangProvider>
              <LanguageSync />
              <RootNavigator />
              <ConnectivityGate />
              <UpdatePrompt />
              <DialogHost />
              <StatusBar />
            </LangProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
