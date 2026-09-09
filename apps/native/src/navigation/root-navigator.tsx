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
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { getSecureItem, setSecureItem } from "@sumaiya/utils";
import { useAuthContext } from "../contexts/auth-context";
import type { RootStackParamList } from "./types";
import { AuthStack } from "./stacks/auth-stack";
import { AppTabs } from "./stacks/app-tabs";
import { OnboardingScreen } from "../screens/onboarding-screen";
import { SplashScreen } from "../screens/splash-screen";

const Stack = createNativeStackNavigator<RootStackParamList, undefined>();

// Key for persisting onboarding completion to secure storage
const ONBOARDING_KEY = "templatehub_onboarding_seen";

const prefix = Linking.createURL("/");

// Deep linking configuration
// Supports:
// - expo-managed deeplink (sumaiya://)
// - Custom domain deeplinks (https://sumaiya.pro)
// - Screen routing (auth/signin, etc)
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, "sumaiya://", "https://sumaiya.pro", "https://www.sumaiya.pro"],
  config: {
    screens: {
      Auth: {
        screens: {
          SignIn: "auth/signin",
          SignUp: "auth/signup",
          ForgotPassword: "auth/forgot-password",
        },
      },
      App: "*",
    },
  },
};

export function RootNavigator() {
  const { user, loading } = useAuthContext();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await getSecureItem(ONBOARDING_KEY);
        setHasSeenOnboarding(seen === "true");
      } catch (err) {
        console.error("Failed to check onboarding status:", err);
      } finally {
        setCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, []);

  const markOnboardingComplete = async () => {
    try {
      await setSecureItem(ONBOARDING_KEY, "true");
      setHasSeenOnboarding(true);
    } catch (err) {
      console.error("Failed to mark onboarding complete:", err);
    }
  };

  if (loading || checkingOnboarding) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking} fallback={<SplashScreen />}>
      <Stack.Navigator
        id={undefined}
        screenOptions={{
          headerShown: false,
        animation: "fade",
        }}
      >
        {!user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" options={{ animationTypeForReplace: "pop" }}>
            {(props) => (
              <OnboardingScreen navigation={props.navigation} onComplete={markOnboardingComplete} />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App" component={AppTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
