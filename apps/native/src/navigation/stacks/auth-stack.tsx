import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../types";
import { SignInScreen } from "../../screens/auth/sign-in-screen";
import { SignUpScreen } from "../../screens/auth/sign-up-screen";
import { ForgotPasswordScreen } from "../../screens/auth/forgot-password-screen";

const Stack = createNativeStackNavigator<AuthStackParamList, undefined>();

export function AuthStack() {
  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
