import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ScanStackParamList } from "../types";
import { ScanScreen } from "../../screens/app/scan-screen";
import { ScanProcessingScreen } from "../../screens/app/scan-processing-screen";
import { TemplatePickerScreen } from "../../screens/app/template-picker-screen";
import { CvEditorScreen } from "../../screens/cv-editor-screen";
import { PdfToolsScreen } from "../../screens/pdf-tools-screen";

const Stack = createNativeStackNavigator<ScanStackParamList, undefined>();

export function ScanStack() {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="ScanMain" component={ScanScreen} />
      <Stack.Screen name="ScanProcessing" component={ScanProcessingScreen} />
      <Stack.Screen name="TemplatePicker" component={TemplatePickerScreen} />
      <Stack.Screen name="CVEditor" component={CvEditorScreen} />
      <Stack.Screen name="PdfTools" component={PdfToolsScreen} />
    </Stack.Navigator>
  );
}
