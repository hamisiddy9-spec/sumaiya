import "../../global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getSecureItem, offlineStorage } from "@sumaiya/utils";
import { apiClient } from "../lib/api-client";
import { AuthProvider } from "../contexts/auth-context";
import { LangProvider } from "../lib/i18n";
import { RootNavigator } from "../navigation/root-navigator";
import { UpdatePrompt } from "../components/update-prompt";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { setColorScheme } = useColorScheme();

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
          console.error("offlineStorage init failed:", dbError);
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
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [setColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider apiClient={apiClient}>
          <LangProvider>
            <RootNavigator />
            <UpdatePrompt />
            <StatusBar />
          </LangProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
