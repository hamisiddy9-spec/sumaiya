import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../types";
import { SignInScreen } from "../../screens/auth/sign-in-screen";
import { useThemeColors } from "../../components/ui";
import { stackScreenOptions } from "../nav-config";

const Stack = createNativeStackNavigator<AuthStackParamList, undefined>();

// One screen. Auth is a 6-digit email code (or Google) — the same code creates
// the account, so there is no separate sign-up, and passwordless means there is
// nothing to "forget" or reset.
export function AuthStack() {
  const c = useThemeColors();
  return (
    <Stack.Navigator id={undefined} screenOptions={stackScreenOptions(c)}>
      <Stack.Screen name="SignIn" component={SignInScreen} />
    </Stack.Navigator>
  );
}
