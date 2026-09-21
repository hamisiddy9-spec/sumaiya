import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp, NavigatorScreenParams, ParamListBase, RouteProp } from "@react-navigation/native";
import type { CVData } from "@sumaiya/types";
import type { JobListing } from "@sumaiya/api-client";

export type HomeStackParamList = {
  HomeMain: undefined;
  LearningHub: undefined;
  Guide: { id: string };
  Invite: undefined;
  Jobs: undefined;
  /** The advert behind a job card — the card's own route. The listing is
   *  passed whole: it is already in memory from the feed, and re-fetching it
   *  by id would make a tap on a card wait on the network. */
  JobDetail: { job: JobListing; score?: number; reason?: string };
  JobApply: { jd?: string; want?: "cv" | "letter" | "both" } | undefined;
  Applications: undefined;
  ApplicationDetail: { id?: string } | undefined;
  AtsChecker: { cvId?: string } | undefined;
};

export type CvStackParamList = {
  CvListMain: undefined;
  CvEditor:
    | {
        cvId?: string;
        templateId?: string | null;
        initialData?: unknown;
        /** Changes on every "New CV" tap so a re-used screen instance resets
         *  to a blank form instead of showing the CV that was open before. */
        nonce?: string;
      }
    | undefined;
  AtsChecker: { cvId?: string } | undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  CareerProfile: undefined;
  HelpFaq: undefined;
  PrivacyTerms: undefined;
  Memory: undefined;
  Support: undefined;
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
  SumaiyaTab: { attachment?: { kind: string; uri: string; name?: string; mimeType?: string }; seed?: string } | undefined;
  ImportTab: NavigatorScreenParams<ScanStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type ScanStackParamList = {
  ScanMain: undefined;
  PdfTools: undefined;
  ScanProcessing: { photoUri: string };
  CvEditor:
    | {
        templateId?: string | null;
        initialData?: unknown;
        nonce?: string;
        /**
         * §3.4 step 2 · Identity travels with the handoff.
         *
         * When the chat's document card opens the editor, it passes the id the
         * thread knows the document by, so a save from the editor can update THIS
         * document instead of forking a second CV (audit M5: the chat passed
         * `initialData` only, so the editor received a copy with no identity and
         * saving produced two CVs). Additive on purpose: the editor may ignore
         * it until it is wired to read it, and nothing else changes.
         */
        sourceCvId?: string;
      }
    | undefined;
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
export type JobsScreenProps = Screen<HomeStackParamList, "Jobs">;
export type JobDetailScreenProps = Screen<HomeStackParamList, "JobDetail">;

// CV stack
export type CvListScreenProps = Screen<CvStackParamList, "CvListMain">;
export type CvEditorScreenProps = Screen<CvStackParamList, "CvEditor">;

// Profile stack
export type ProfileScreenProps = Screen<ProfileStackParamList, "ProfileMain">;
export type CareerProfileScreenProps = Screen<ProfileStackParamList, "CareerProfile">;
export type HelpFaqScreenProps = Screen<ProfileStackParamList, "HelpFaq">;
export type PrivacyTermsScreenProps = Screen<ProfileStackParamList, "PrivacyTerms">;
export type SupportScreenProps = Screen<ProfileStackParamList, "Support">;

// Sumaiya is a direct tab screen
export type SumaiyaChatScreenProps = {
  navigation: CompositeNavigationProp<
    BottomTabNavigationProp<AppTabParamList, "SumaiyaTab">,
    NativeStackNavigationProp<RootStackParamList>
  >;
  route: RouteProp<AppTabParamList, "SumaiyaTab">;
};
