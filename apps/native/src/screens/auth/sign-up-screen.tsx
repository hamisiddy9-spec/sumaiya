import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, { FadeIn } from "react-native-reanimated";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthContext } from "../../contexts/auth-context";
import { Button, Screen, TextField, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";
import { GoogleButton } from "./google-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { PasswordStrength, scorePassword } from "./password-strength";

type Props = NativeStackScreenProps<AuthStackParamList, "SignUp">;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen({ navigation }: Props) {
  const c = useThemeColors();
  const {
    loading,
    error,
    signUp,
    signInWithGoogle,
    clearError,
    pendingConfirmationEmail,
    resendConfirmation,
  } = useAuthContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [resent, setResent] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const pwRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const nameError = touched.name && name.trim().length < 2 ? "Enter your name" : null;
  const emailError = touched.email && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address" : null;
  const pwError = touched.password && password.length < 8 ? "At least 8 characters" : null;
  const confirmError = touched.confirm && confirm !== password ? "Passwords don't match" : null;

  const valid =
    name.trim().length >= 2 &&
    EMAIL_RE.test(email.trim()) &&
    password.length >= 8 &&
    scorePassword(password) >= 2 &&
    confirm === password;

  async function handleSignUp() {
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (!valid) {
      haptics.error();
      return;
    }
    clearError();
    try {
      await signUp(email.trim(), password, name.trim());
    } catch {
      /* surfaced via context */
    }
  }

  // ── Confirmation-pending state ───────────────────────────────────────────
  if (pendingConfirmationEmail) {
    return (
      <Screen>
        <Animated.View entering={FadeIn.duration(250)} style={{ marginTop: 24 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: c.accent + "1a",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Icon name="mail" size={28} color={c.accent} />
          </View>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.4 }}>
            Check your inbox
          </Text>
          <Text style={{ color: c.textBody, fontSize: 15, marginTop: 8, lineHeight: 22 }}>
            We sent a confirmation link to{"\n"}
            <Text style={{ color: c.text, fontWeight: "700" }}>{pendingConfirmationEmail}</Text>
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 13.5, marginTop: 12, lineHeight: 20 }}>
            Open it on this device to finish creating your account.
          </Text>

          <View style={{ height: 28 }} />
          <AuthErrorBanner error={error} onDismiss={clearError} />
          {resent ? (
            <Text style={{ color: c.success, fontSize: 13.5, marginBottom: 14, fontWeight: "600" }}>
              Confirmation email resent.
            </Text>
          ) : null}

          <Button
            label="Resend confirmation email"
            variant="secondary"
            loading={loading}
            onPress={async () => {
              try {
                await resendConfirmation(pendingConfirmationEmail);
                setResent(true);
              } catch {
                setResent(false);
              }
            }}
          />
          <View style={{ height: 10 }} />
          <Button
            label="Back to sign in"
            variant="ghost"
            onPress={() => navigation.navigate("SignIn")}
          />
        </Animated.View>
      </Screen>
    );
  }

  // ── Sign-up form ────────────────────────────────────────────────────────
  return (
    <Screen
      footer={
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 5 }}>
          <Text style={{ color: c.textBody }}>Already have an account?</Text>
          <Pressable
            hitSlop={8}
            onPress={() => {
              haptics.selection();
              clearError();
              navigation.navigate("SignIn");
            }}
          >
            <Text style={{ color: c.accent, fontWeight: "700" }}>Sign in</Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ marginTop: 16, marginBottom: 24 }}>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 }}>
          Create your account
        </Text>
        <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6 }}>
          Free forever. No card needed.
        </Text>
      </View>

      <AuthErrorBanner error={error} onDismiss={clearError} />

      <View style={{ gap: 14 }}>
        <TextField
          label="Full name"
          leftIcon="user"
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (error) clearError();
          }}
          onBlur={() => setTouched((s) => ({ ...s, name: true }))}
          error={nameError}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          editable={!loading}
        />
        <TextField
          ref={emailRef}
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
          onSubmitEditing={() => pwRef.current?.focus()}
          editable={!loading}
        />
        <View>
          <TextField
            ref={pwRef}
            label="Password"
            leftIcon="lock"
            password
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) clearError();
            }}
            onBlur={() => setTouched((s) => ({ ...s, password: true }))}
            error={pwError}
            autoComplete="password-new"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            editable={!loading}
          />
          <PasswordStrength password={password} />
        </View>
        <TextField
          ref={confirmRef}
          label="Confirm password"
          leftIcon="lock"
          password
          value={confirm}
          onChangeText={(t) => {
            setConfirm(t);
            if (error) clearError();
          }}
          onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
          error={confirmError}
          returnKeyType="go"
          onSubmitEditing={handleSignUp}
          editable={!loading}
        />

        <Button label="Create account" onPress={handleSignUp} loading={loading} size="lg" />

        <Text style={{ color: c.textMuted, fontSize: 12, textAlign: "center", lineHeight: 17 }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 }}>
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
