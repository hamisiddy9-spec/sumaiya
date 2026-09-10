import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { CompositeNavigationProp } from "@react-navigation/native";
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
  HomeTab: undefined;
  CVsTab: undefined;
  SumaiyaTab: { attachment?: { kind: string; uri: string; name?: string; mimeType?: string } } | undefined;
  ImportTab: undefined;
  ProfileTab: undefined;
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
