/**
 * App Tabs - Main tabbed navigation for authenticated users
 *
 * The 5 bottom-tab navigation structure:
 * 1. Home Tab    → HomeStack (Home, Applications, ATS, Tailor, Learning modal)
 * 2. CVs Tab     → CvStack (CVList, CvEditor, ATS)
 * 3. Sumaiya Tab → SumaiyaChatScreen (the AI assistant, first-class — mirrors
 *                  the web nav where Sumaiya is a top-level destination)
 * 4. Import Tab  → ScanStack (Camera, Processing, Editor, PdfTools)
 * 5. Profile Tab → ProfileStack (Profile, Career profile)
 *
 * Key Features:
 * - Tab persistence: Switching tabs preserves screen state
 * - Nested stacks: Each tab can have its own navigation stack
 * - Modal overlays: LearningHub opens as a modal over HomeStack
 * - Deep linking: All tabs and screens are deep-linkable
 *
 * Architecture Pattern:
 * - Bottom Tab Navigator (main)
 *   ├─ HomeStack (home, applications, ATS, tailor, learning)
 *   ├─ CvStack (CV list + editor + ATS)
 *   ├─ SumaiyaChatScreen (the AI assistant, direct)
 *   ├─ ScanStack (import: camera + files + PDF tools)
 *   └─ ProfileStack (profile + career profile)
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AnimatedTabBar } from "../animated-tab-bar";
import { useThemeColors } from "../../components/ui";
import type { AppTabParamList, HomeStackParamList, CvStackParamList, ProfileStackParamList } from "../types";
import { HomeScreen } from "../../screens/app/home-screen";
import { CvListScreen } from "../../screens/app/cv-list-screen";
import { CvEditorScreen } from "../../screens/cv-editor-screen";
import { ProfileScreen } from "../../screens/app/profile-screen";
import { JobApplyScreen } from "../../screens/job-apply-screen";
import { SumaiyaChatScreen } from "../../screens/sumaiya-chat-screen";
import { LearningHubScreen } from "../../screens/learning-hub-screen";
import { GuideScreen } from "../../screens/guide-screen";
import { InviteScreen } from "../../screens/invite-screen";
import { ApplicationsScreen } from "../../screens/applications-screen";
import { ApplicationDetailScreen } from "../../screens/application-detail-screen";
import { AtsCheckerScreen } from "../../screens/ats-checker-screen";
import { CareerProfileScreen } from "../../screens/career-profile-screen";
import { ScanStack } from "./scan-stack";

const Tab = createBottomTabNavigator<AppTabParamList, undefined>();
const HomeStack = createNativeStackNavigator<HomeStackParamList, undefined>();
const CvStack = createNativeStackNavigator<CvStackParamList, undefined>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList, undefined>();

function HomeStackScreen() {
  const c = useThemeColors();
  return (
    <HomeStack.Navigator id={undefined} screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 260, contentStyle: { backgroundColor: c.bg } }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="JobApply" component={JobApplyScreen} />
      <HomeStack.Screen name="Applications" component={ApplicationsScreen} />
      <HomeStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
      <HomeStack.Screen name="AtsChecker" component={AtsCheckerScreen} />
      <HomeStack.Screen
        name="LearningHub"
        component={LearningHubScreen}
        options={{ presentation: "modal" }}
      />
      <HomeStack.Screen name="Guide" component={GuideScreen} />
      <HomeStack.Screen name="Invite" component={InviteScreen} />
    </HomeStack.Navigator>
  );
}

function CvStackScreen() {
  const c = useThemeColors();
  return (
    <CvStack.Navigator id={undefined} screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 260, contentStyle: { backgroundColor: c.bg } }}>
      <CvStack.Screen name="CvListMain" component={CvListScreen} />
      <CvStack.Screen name="CvEditor" component={CvEditorScreen} />
      <CvStack.Screen name="AtsChecker" component={AtsCheckerScreen} />
    </CvStack.Navigator>
  );
}

function ProfileStackScreen() {
  const c = useThemeColors();
  return (
    <ProfileStack.Navigator id={undefined} screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 260, contentStyle: { backgroundColor: c.bg } }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="CareerProfile" component={CareerProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export function AppTabs() {
  const c = useThemeColors();
  return (
    <Tab.Navigator
      id={undefined}
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: "shift", sceneStyle: { backgroundColor: c.bg } }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="CVsTab"
        component={CvStackScreen}
        options={{ title: "My CVs" }}
      />
      <Tab.Screen
        name="SumaiyaTab"
        component={SumaiyaChatScreen}
        options={{ title: "Sumaiya" }}
      />
      <Tab.Screen
        name="ImportTab"
        component={ScanStack}
        // Import is an action surface, not a place you browse. Leaving the tab
        // (e.g. after being routed onward) resets it to the Import landing.
        options={{ title: "Import", popToTopOnBlur: true }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}
