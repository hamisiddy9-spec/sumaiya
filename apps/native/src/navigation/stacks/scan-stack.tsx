import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ScanStackParamList } from "../types";
import { ScanScreen } from "../../screens/app/scan-screen";
import { ScanProcessingScreen } from "../../screens/app/scan-processing-screen";
import { CvEditorScreen } from "../../screens/cv-editor-screen";
import { PdfToolsScreen } from "../../screens/pdf-tools-screen";
import { useThemeColors } from "../../components/ui";

const Stack = createNativeStackNavigator<ScanStackParamList, undefined>();

export function ScanStack() {
  const c = useThemeColors();
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 260,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      <Stack.Screen name="ScanMain" component={ScanScreen} />
      <Stack.Screen name="ScanProcessing" component={ScanProcessingScreen} />
      <Stack.Screen name="CVEditor" component={CvEditorScreen} />
      <Stack.Screen name="PdfTools" component={PdfToolsScreen} />
    </Stack.Navigator>
  );
}
