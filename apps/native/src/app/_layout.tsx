import "../../global.css";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getSecureItem, offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { reportError } from "../lib/reporting";
import { AuthProvider } from "../contexts/auth-context";
import { LangProvider } from "../lib/i18n";
import { RootNavigator } from "../navigation/root-navigator";
import { UpdatePrompt } from "../components/update-prompt";
import { ErrorBoundary } from "../components/error-boundary";

SplashScreen.preventAutoHideAsync();

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
      } catch (e) {
        console.warn("Font loading error:", e);
      } finally {
        setReady(true);
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [setColorScheme]);

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
              <RootNavigator />
              <UpdatePrompt />
              <StatusBar />
            </LangProvider>
          </AuthProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
