import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthContext } from "../../contexts/auth-context";
import { Button, Screen, TextField, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";
import { GoogleButton } from "./google-button";
import { AuthErrorBanner } from "./auth-error-banner";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInScreen({ navigation }: Props) {
  const c = useThemeColors();
  const { loading, error, signIn, signInWithGoogle, clearError } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const passwordRef = useRef<TextInput>(null);

  const emailError =
    touched.email && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address" : null;
  const passwordError =
    touched.password && password.length === 0 ? "Enter your password" : null;

  async function handleSignIn() {
    setTouched({ email: true, password: true });
    if (!EMAIL_RE.test(email.trim()) || password.length === 0) {
      haptics.error();
      return;
    }
    clearError();
    try {
      await signIn(email.trim(), password);
    } catch {
      /* surfaced via context error */
    }
  }

  return (
    <Screen
      footer={
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 5 }}>
          <Text style={{ color: c.textBody }}>Don&apos;t have an account?</Text>
          <Pressable
            onPress={() => {
              haptics.selection();
              clearError();
              navigation.navigate("SignUp");
            }}
            hitSlop={8}
          >
            <Text style={{ color: c.accent, fontWeight: "700" }}>Sign up</Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ marginTop: 20, marginBottom: 28 }}>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 }}>
          Welcome back
        </Text>
        <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6 }}>
          Sign in to pick up where you left off.
        </Text>
      </View>

      <AuthErrorBanner error={error} onDismiss={clearError} />

      <View style={{ gap: 14 }}>
        <TextField
          label="Email"
          leftIcon="mail"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            if (error) clearError();
          }}
          onBlur={() => setTouched((s) => ({ ...s, email: true }))}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!loading}
        />

        <TextField
          ref={passwordRef}
          label="Password"
          leftIcon="lock"
          password
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            if (error) clearError();
          }}
          onBlur={() => setTouched((s) => ({ ...s, password: true }))}
          error={passwordError}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
          editable={!loading}
        />

        <Pressable
          onPress={() => {
            haptics.selection();
            clearError();
            navigation.navigate("ForgotPassword");
          }}
          hitSlop={8}
          style={{ alignSelf: "flex-end" }}
        >
          <Text style={{ color: c.accent, fontSize: 13.5, fontWeight: "600" }}>
            Forgot password?
          </Text>
        </Pressable>

        <Button label="Sign in" onPress={handleSignIn} loading={loading} size="lg" />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
        <Text style={{ color: c.textMuted, fontSize: 12.5 }}>or</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
      </View>

      <GoogleButton
        label="Continue with Google"
        disabled={loading}
        onPress={async () => {
          clearError();
          try {
            await signInWithGoogle();
          } catch {
            /* surfaced via context */
          }
        }}
      />
    </Screen>
  );
}
