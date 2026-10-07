/**
 * Root Navigator - Main navigation orchestrator for Sumaiya mobile app
 *
 * Phase 3 Implementation (Navigation Integration):
 * This is the entry point for all navigation. It handles:
 * 1. Auth state switching (guest → signed in)
 * 2. Onboarding flow (first-time users only)
 * 3. Main app tabs (Home, CVs, Scan, Profile, Settings)
 * 4. Deep linking (email signin, push notifications, web links)
 *
 * Navigation Flow:
 * - Splash → Check auth state + onboarding status
 * - If !hasSeenOnboarding → Onboarding (4-page carousel)
 * - Else → AppTabs, WITH OR WITHOUT AN ACCOUNT
 * - If signed in && !firstRunDone → FirstRun (the profile wizard)
 * - Sign-in is a MODAL over the app (openAuth(), navigation/root-nav.ts),
 *   presented when the guest chooses it — never a wall in front of the app.
 *
 * GUEST MODE (2026-09-21). This file used to read `!user ? AuthStack : App`,
 * which meant a stranger who installed the APK met an account wall before they
 * could build anything — and with email sign-in rate-limited at the provider,
 * that wall was the whole product. The promise is the owner's, standing: a
 * guest finishes and downloads a CV BEFORE being asked for an account. So the
 * app tabs render for everyone; the account-only surfaces gate themselves (see
 * components/account-gate.tsx) with an honest invitation; and the one prompt a
 * guest does see arrives after their work exists (components/account-gate.tsx →
 * offerGuestAccountOnce), once ever.
 *
 * WHAT THE GUEST'S WORK DOES ON SIGN-IN: the CVs on this device are owned by
 * GUEST_OWNER_ID (lib/local-owner.ts). The effect below claims them for the
 * account the moment a session lands — the row keeps its id, so it is one
 * write, and it is then uploaded (or queued, if the network drops) — so the CV
 * built before signing in is on the account after it, and nothing is discarded.
 *
 * Deep Linking:
 * - Custom scheme: sumaiya://
 * - Universal links: https://sumaiya.app
 * - Signin link: sumaiya://signin?token=JWT_HERE
 */

import React, { useEffect, useState, useMemo } from "react";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { getSecureItem, setSecureItem, offlineStorage } from "@sumaiya/utils";
import { useAuthContext } from "../contexts/auth-context";
import { usePushRegistration } from "../lib/push";
import type { RootStackParamList } from "./types";
import { AuthStack } from "./stacks/auth-stack";
import { AppTabs } from "./stacks/app-tabs";
import { OnboardingScreen } from "../screens/onboarding-screen";
import { FirstRunScreen, FIRST_RUN_KEY } from "../screens/first-run-screen";
import { SplashScreen } from "../screens/splash-screen";
import { ThemeScope, useThemeColors } from "../components/ui";
import { useNavTheme, rootScreenOptions } from "./nav-config";
import { resolveNotificationTarget } from "../lib/notification-route";
import { DEEP_LINK_PREFIXES } from "../lib/app-hosts";
import { navRef } from "./root-nav";

const Stack = createNativeStackNavigator<RootStackParamList, undefined>();

// Key for persisting onboarding completion to secure storage
const ONBOARDING_KEY = "sumaiya_onboarding_seen";

const prefix = Linking.createURL("/");

// Deep linking configuration
// Supports:
// - expo-managed deeplink (sumaiya://)
// - Custom domain deeplinks (https://sumaiya.app)
// - Screen routing (auth/signin, etc)
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    prefix,
    "sumaiya://",
    // Canonical origin, then the transitional legacy origins — derived from
    // lib/app-hosts.ts rather than typed out here, so moving the domain again
    // is a one-line change.
    ...DEEP_LINK_PREFIXES,
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
  const c = useThemeColors();
  const navTheme = useNavTheme();
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
      const code = await getSecureItem("pending_referral").catch(() => null);
      if (!code) return;
      try {
        const { apiClient } = await import("../lib/api-client");
        await apiClient.claimReferral(code);
        // Only clear on actual success — this used to clear in a `finally`
        // regardless of outcome, so a claim that failed because the user
        // happened to sign in offline (or hit a transient server error) lost
        // the referral permanently on the very first attempt, contradicting
        // the "once, ever" comment above (which only makes sense if a failed
        // attempt is retried, not silently discarded).
        await setSecureItem("pending_referral", "").catch(() => {});
      } catch {
        /* offline / transient — left in place, retried on the next sign-in */
      }
    })();
  }, [user]);

  // CLAIM THE GUEST'S WORK. Someone who built a CV without an account and has
  // just signed in must find that CV on their account — not learn it is gone,
  // and not be asked to build it twice. Every local row owned by
  // GUEST_OWNER_ID is re-owned to this account id (one write: the row keeps its
  // id) and then uploaded, or queued for the sync engine if the upload fails.
  // A row that cannot be re-owned is left exactly as it was — a failed claim
  // never deletes anything.
  //
  // Deliberately before the profile pull below: that effect decides whether
  // this is a brand-new account by looking for existing CVs, and a guest
  // arriving with a CV is not new — they should not be met by the first-run
  // wizard seconds after signing in.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const { claimGuestWork } = await import("../lib/local-owner");
        const result = await claimGuestWork(user.id);
        if (!cancelled && result.claimed > 0) {
          console.log(`[guest] claimed ${result.claimed} local CV(s) for the account`);
        }
      } catch (err) {
        // Never fatal: the CVs are still on the device under the guest owner.
        console.error("Failed to claim guest work:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Pull the Career Profile from the server Spine once signed in — a returning
  // user on a new device / after a reinstall keeps their profile, and any
  // offline local edit gets pushed up. If the server already has a real
  // profile OR the account already has CVs, the first-run wizard has nothing
  // to collect, so skip it. Checking CVs too matters because profileIsEmpty
  // only looks at the wizard's own fields — a returning user who built CVs
  // but never happened to complete the wizard would otherwise see it resurface
  // on every reinstall / new device despite clearly not being new.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      const { syncProfileFromServer, profileIsEmpty } = await import("../lib/profile-store");
      const { apiClient } = await import("../lib/api-client");
      const { countOwnedCvs } = await import("../lib/local-owner");

      const hasExistingData = async () => {
        try {
          const [localCount, profile, cvs] = await Promise.all([
            // A CV on THIS device, owned by THIS account id — the shape a
            // claimed guest CV has the moment the claim lands. Local, instant,
            // and true even with no network, which is the case that used to
            // fall through to the wizard.
            countOwnedCvs(user.id),
            syncProfileFromServer(),
            apiClient.listCVs().catch(() => []),
          ]);
          return localCount > 0 || !profileIsEmpty(profile) || cvs.length > 0;
        } catch {
          return false;
        }
      };

      // A returning user right after sign-in can hit this before the fresh
      // session token has propagated to apiClient — both calls above swallow
      // their own errors and quietly return "empty", which reads exactly like
      // a brand-new account and strands the user in the first-run wizard
      // every time they sign back in. Retry twice with backoff before
      // believing "empty" is real, rather than accepting the first answer.
      for (const delayMs of [0, 1200, 3000]) {
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
        if (cancelled) return;
        if (await hasExistingData()) {
          await setSecureItem(FIRST_RUN_KEY, "true").catch(() => {});
          if (!cancelled) setFirstRunDone(true);
          return;
        }
      }
      /* genuinely a new account, or still offline after 3 tries — first-run stays as-is */
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Register for push once signed in (no-op until an EAS projectId exists).
  usePushRegistration(user?.id);

  // Route a notification tap — see resolveNotificationTarget's own comment
  // for the two payload shapes this has to handle correctly.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as { screen?: string; params?: Record<string, unknown> };
      if (!data?.screen || !navRef.isReady()) return;
      try {
        (navRef.navigate as (n: string, p: unknown) => void)("App", resolveNotificationTarget(data.screen, data.params));
      } catch {
        /* stale nav */
      }
    });
    return () => sub.remove();
  }, []);

  // After a successful sign-in the sign-in screen leaves the tree (nothing is
  // registered above it with a session in hand) and the navigator drops back to
  // the app underneath. This is the belt to that brace: if the route somehow
  // survives the swap, close it, so nobody is left staring at a sign-in form
  // while holding a session.
  useEffect(() => {
    if (!user || !navRef.isReady()) return;
    const state = navRef.getRootState();
    if (state.routes[state.index]?.name === "Auth") navRef.goBack();
  }, [user]);

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
      theme={navTheme}
      linking={linking}
      fallback={
        <ThemeScope mode="light">
          <SplashScreen />
        </ThemeScope>
      }
    >
      <Stack.Navigator id={undefined} screenOptions={rootScreenOptions(c)}>
        {/* Onboarding still comes first: a fresh install must never open on a
            bare sign-in screen (reads as a bug, especially in dark mode).

            BUT THE APP IS NO LONGER BEHIND AN ACCOUNT. After onboarding, a
            guest lands in AppTabs and can build, preview and download a CV
            without ever signing in — the surfaces that genuinely need an
            account gate themselves (components/account-gate.tsx) instead of the
            whole product doing it from here. FirstRun is the profile wizard,
            and it stays tied to an account because it is the account's profile
            it collects; a guest with a CV skips it entirely (see the first-run
            effect above, which counts the CVs already on this device). */}
        {!hasSeenOnboarding ? (
          <Stack.Screen name="Onboarding" options={{ animationTypeForReplace: "pop" }}>
            {(props) => (
              <ThemeScope mode="light">
                <OnboardingScreen navigation={props.navigation} onComplete={markOnboardingComplete} />
              </ThemeScope>
            )}
          </Stack.Screen>
        ) : user && !firstRunDone ? (
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

        {/* Sign-in is presented OVER the app, when the guest asks for it (the
            invitation after a download, a gated surface, the Profile row).
            Registered only while there is no session: the moment a session
            lands this screen leaves the tree and the navigator returns to the
            app underneath — the CV the person just built is waiting for them,
            claimed onto the account by the effect above. */}
        {!user ? (
          <Stack.Screen
            name="Auth"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          >
            {() => (
              <ThemeScope mode="light">
                <AuthStack />
              </ThemeScope>
            )}
          </Stack.Screen>
        ) : null}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
