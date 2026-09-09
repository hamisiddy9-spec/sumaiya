/**
 * App Tabs - Main tabbed navigation for authenticated users
 *
 * The 5 bottom-tab navigation structure:
 * 1. Home Tab    → HomeStack (Home, JobDetail, Chat modal, Learning modal)
 * 2. CVs Tab     → CvStack (CVList, CvEditor)
 * 3. Sumaiya Tab → SumaiyaChatScreen (the AI assistant, first-class — mirrors
 *                  the web nav where Sumaiya is a top-level destination)
 * 4. Scan Tab    → ScanStack (Camera, Processing, TemplatePicker, Editor)
 * 5. Profile Tab → ProfileStack (Profile, Change password)
 *
 * Key Features:
 * - Tab persistence: Switching tabs preserves screen state
 * - Nested stacks: Each tab can have its own navigation stack
 * - Modal overlays: Chat and LearningHub open as modals over HomeStack
 * - Deep linking: All tabs and screens are deep-linkable
 *
 * Architecture Pattern:
 * - Bottom Tab Navigator (main)
 *   ├─ HomeStack (nested stack for home features)
 *   ├─ CvStack (nested stack for CV management)
 *   ├─ SumaiyaChatScreen (the AI assistant, direct)
 *   ├─ ScanStack (imported, handles camera flow)
 *   └─ ProfileStack (profile + settings + change password)
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AnimatedTabBar } from "../animated-tab-bar";
import type { AppTabParamList, HomeStackParamList, CvStackParamList, ProfileStackParamList } from "../types";
import { HomeScreen } from "../../screens/app/home-screen";
import { CvListScreen } from "../../screens/app/cv-list-screen";
import { CvEditorScreen } from "../../screens/cv-editor-screen";
import { ProfileScreen } from "../../screens/app/profile-screen";
import { ChangePasswordScreen } from "../../screens/app/change-password-screen";
import { JobDetailScreen } from "../../screens/job-detail-screen";
import { JobApplyScreen } from "../../screens/job-apply-screen";
import { SumaiyaChatScreen } from "../../screens/sumaiya-chat-screen";
import { LearningHubScreen } from "../../screens/learning-hub-screen";
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
  return (
    <HomeStack.Navigator id={undefined} screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="JobDetail" component={JobDetailScreen} />
      <HomeStack.Screen name="JobApply" component={JobApplyScreen} />
      <HomeStack.Screen name="Applications" component={ApplicationsScreen} />
      <HomeStack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
      <HomeStack.Screen name="AtsChecker" component={AtsCheckerScreen} />
      <HomeStack.Screen
        name="Chat"
        component={SumaiyaChatScreen}
        options={{ presentation: "modal" }}
      />
      <HomeStack.Screen
        name="LearningHub"
        component={LearningHubScreen}
        options={{ presentation: "modal" }}
      />
    </HomeStack.Navigator>
  );
}

function CvStackScreen() {
  return (
    <CvStack.Navigator id={undefined} screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <CvStack.Screen name="CvListMain" component={CvListScreen} />
      <CvStack.Screen name="CvEditor" component={CvEditorScreen} />
      <CvStack.Screen name="AtsChecker" component={AtsCheckerScreen} />
    </CvStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator id={undefined} screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <ProfileStack.Screen name="CareerProfile" component={CareerProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export function AppTabs() {
  return (
    <Tab.Navigator
      id={undefined}
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{ headerShown: false, animation: "shift" }}
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
