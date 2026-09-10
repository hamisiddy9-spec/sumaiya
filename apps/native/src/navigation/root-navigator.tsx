/**
 * Root Navigator - Main navigation orchestrator for Sumaiya mobile app
 *
 * Phase 3 Implementation (Navigation Integration):
 * This is the entry point for all navigation. It handles:
 * 1. Auth state switching (unauthenticated → authenticated)
 * 2. Onboarding flow (first-time users only)
 * 3. Main app tabs (Home, CVs, Scan, Profile, Settings)
 * 4. Deep linking (email signin, push notifications, web links)
 *
 * Navigation Flow:
 * - Splash → Check auth state + onboarding status
 * - If !user → AuthStack (SignIn/SignUp)
 * - If user && !onboarded → OnboardingScreen (4-page carousel)
 * - If user && onboarded → AppTabs (main app)
 *
 * Deep Linking:
 * - Custom scheme: sumaiya://
 * - Universal links: https://sumaiya.pro
 * - Signin link: sumaiya://signin?token=JWT_HERE
 */

import React, { useEffect, useState, useMemo } from "react";
import { NavigationContainer, LinkingOptions, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { useAuthContext } from "../contexts/auth-context";
import { usePushRegistration } from "../lib/push";
import type { RootStackParamList } from "./types";
import { AuthStack } from "./stacks/auth-stack";
import { AppTabs } from "./stacks/app-tabs";
import { OnboardingScreen } from "../screens/onboarding-screen";
import { FirstRunScreen, FIRST_RUN_KEY } from "../screens/first-run-screen";
import { SplashScreen } from "../screens/splash-screen";
import { ThemeScope } from "../components/ui";

const Stack = createNativeStackNavigator<RootStackParamList, undefined>();

// Key for persisting onboarding completion to secure storage
const ONBOARDING_KEY = "sumaiya_onboarding_seen";

const prefix = Linking.createURL("/");
const navRef = createNavigationContainerRef<RootStackParamList>();

// Deep linking configuration
// Supports:
// - expo-managed deeplink (sumaiya://)
// - Custom domain deeplinks (https://sumaiya.pro)
// - Screen routing (auth/signin, etc)
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    "sumaiya://",
    "https://sumaiya.pro",
    "https://www.sumaiya.pro",
    "https://sumaiyaai.vercel.app",
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          SignIn: "auth/signin",
        },
      },
      App: "*",
    },
  },
};

export function RootNavigator() {
  const { user, loading } = useAuthContext();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [firstRunDone, setFirstRunDone] = useState(true);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const [seen, fr] = await Promise.all([
          getSecureItem(ONBOARDING_KEY),
          getSecureItem(FIRST_RUN_KEY),
        ]);
        setHasSeenOnboarding(seen === "true");
        setFirstRunDone(fr === "true");
      } catch (err) {
        console.error("Failed to check first-run status:", err);
      } finally {
        setCheckingOnboarding(false);
      }
    };
    check();
  }, []);

  const markFirstRunDone = () => setFirstRunDone(true);

  const markOnboardingComplete = async () => {
    try {
      await setSecureItem(ONBOARDING_KEY, "true");
      setHasSeenOnboarding(true);
    } catch (err) {
      console.error("Failed to mark onboarding complete:", err);
    }
  };

  // Referral: capture ?ref= from the launch/opened URL, then claim it once the
  // user is signed in (once, ever — the server dedupes and ignores self-refs).
  useEffect(() => {
    const capture = (url: string | null) => {
      if (!url) return;
      const m = url.match(/[?&]ref=([A-Za-z0-9]{4,16})/);
      if (m) setSecureItem("pending_referral", m[1]).catch(() => {});
    };
    Linking.getInitialURL().then(capture);
    const sub = Linking.addEventListener("url", ({ url }) => capture(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const code = await getSecureItem("pending_referral");
        if (!code) return;
        await import("../lib/api-client").then(({ apiClient }) => apiClient.claimReferral(code));
      } catch {
        /* best-effort */
      } finally {
        await setSecureItem("pending_referral", "").catch(() => {});
      }
    })();
  }, [user]);

  // Pull the Career Profile from the server Spine once signed in — a returning
  // user on a new device / after a reinstall keeps their profile, and any
  // offline local edit gets pushed up. If the server already has a real
  // profile, the first-run wizard has nothing to collect, so skip it.
  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const { syncProfileFromServer, profileIsEmpty } = await import("../lib/profile-store");
        const profile = await syncProfileFromServer();
        if (!profileIsEmpty(profile)) {
          await setSecureItem(FIRST_RUN_KEY, "true").catch(() => {});
          setFirstRunDone(true);
        }
      } catch {
        /* offline — first-run stays as-is */
      }
    })();
  }, [user]);

  // Register for push once signed in (no-op until an EAS projectId exists).
  usePushRegistration(user?.id);

  // Route a notification tap. Payload: { screen: "Applications" | "Guide" | ... , params?: {} }
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as { screen?: string; params?: Record<string, unknown> };
      if (!data?.screen || !navRef.isReady()) return;
      try {
        (navRef.navigate as (n: string, p: unknown) => void)("App", {
          screen: "HomeTab",
          params: { screen: data.screen, params: data.params },
        });
      } catch {
        /* stale nav */
      }
    });
    return () => sub.remove();
  }, []);

  if (loading || checkingOnboarding) {
    return (
      <ThemeScope mode="light">
        <SplashScreen />
      </ThemeScope>
    );
  }

  return (
    <NavigationContainer
      ref={navRef}
      linking={linking}
      fallback={
        <ThemeScope mode="light">
          <SplashScreen />
        </ThemeScope>
      }
    >
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
          animation: "fade",
          // A slower cross-fade so onboarding → sign-in (and the portal bloom
          // that precedes it) dissolves instead of snapping.
          animationDuration: 520,
        }}
      >
        {/* Onboarding comes BEFORE auth: a fresh install must never open on a
            bare sign-in screen (reads as a bug, especially in dark mode). New
            users meet Sumaiya first, then hit auth only when they act. */}
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" options={{ animationTypeForReplace: "pop" }}>
            {(props) => (
              <ThemeScope mode="light">
                <OnboardingScreen navigation={props.navigation} onComplete={markOnboardingComplete} />
              </ThemeScope>
            )}
          </Stack.Screen>
        ) : !user ? (
          <Stack.Screen name="Auth">
            {() => (
              <ThemeScope mode="light">
                <AuthStack />
              </ThemeScope>
            )}
          </Stack.Screen>
        ) : !firstRunDone ? (
          // First real run after sign-in: a guided profile setup so Sumaiya
          // starts knowing the user (skippable — they can fill it in Profile).
          <Stack.Screen name="FirstRun">
            {() => (
              <ThemeScope mode="light">
                <FirstRunScreen onDone={markFirstRunDone} />
              </ThemeScope>
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App" component={AppTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
