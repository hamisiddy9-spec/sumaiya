import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp, NavigatorScreenParams, ParamListBase, RouteProp } from "@react-navigation/native";
import type { CVData } from "@sumaiya/types";

export type HomeStackParamList = {
  HomeMain: undefined;
  LearningHub: undefined;
  Guide: { id: string };
  Invite: undefined;
  JobApply: { jd?: string } | undefined;
  Applications: undefined;
  ApplicationDetail: { id?: string } | undefined;
  AtsChecker: { cvId?: string } | undefined;
};

export type CvStackParamList = {
  CvListMain: undefined;
  CvEditor: { cvId?: string; templateId?: string | null; initialData?: unknown } | undefined;
  AtsChecker: { cvId?: string } | undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  CareerProfile: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Onboarding: undefined;
  FirstRun: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
};

export type AppTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  CVsTab: NavigatorScreenParams<CvStackParamList> | undefined;
  SumaiyaTab: { attachment?: { kind: string; uri: string; name?: string; mimeType?: string } } | undefined;
  ImportTab: NavigatorScreenParams<ScanStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type ScanStackParamList = {
  ScanMain: undefined;
  PdfTools: undefined;
  ScanProcessing: { photoUri: string };
  CVEditor: { templateId?: string | null; initialData?: any } | undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type AuthStackNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppTabNavigationProp = BottomTabNavigationProp<AppTabParamList>;
export type ScanStackNavigationProp = NativeStackNavigationProp<ScanStackParamList>;

export type AppNavigationProp = CompositeNavigationProp<
  ScanStackNavigationProp,
  CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

/**
 * Per-screen prop types. Each screen lives in one stack but can also jump to a
 * sibling tab (the nested `navigate("CVsTab", { screen, params })` form), so the
 * navigation prop is a composite of its own stack + the tab navigator.
 */
type Screen<StackParams extends ParamListBase, RouteName extends keyof StackParams & string> = {
  navigation: CompositeNavigationProp<
    NativeStackNavigationProp<StackParams, RouteName>,
    BottomTabNavigationProp<AppTabParamList>
  >;
  route: RouteProp<StackParams, RouteName>;
};

// Home stack
export type HomeScreenProps = Screen<HomeStackParamList, "HomeMain">;
export type JobApplyScreenProps = Screen<HomeStackParamList, "JobApply">;
export type ApplicationsScreenProps = Screen<HomeStackParamList, "Applications">;
export type ApplicationDetailScreenProps = Screen<HomeStackParamList, "ApplicationDetail">;
export type AtsCheckerScreenProps = Screen<HomeStackParamList, "AtsChecker">;
export type LearningHubScreenProps = Screen<HomeStackParamList, "LearningHub">;
export type GuideScreenProps = Screen<HomeStackParamList, "Guide">;
export type InviteScreenProps = Screen<HomeStackParamList, "Invite">;

// CV stack
export type CvListScreenProps = Screen<CvStackParamList, "CvListMain">;
export type CvEditorScreenProps = Screen<CvStackParamList, "CvEditor">;

// Profile stack
export type ProfileScreenProps = Screen<ProfileStackParamList, "ProfileMain">;
export type CareerProfileScreenProps = Screen<ProfileStackParamList, "CareerProfile">;

// Sumaiya is a direct tab screen
export type SumaiyaChatScreenProps = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList, "SumaiyaTab">,
    NativeStackNavigationProp<RootStackParamList>
  >;
  route: RouteProp<AppTabParamList, "SumaiyaTab">;
};
