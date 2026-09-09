import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import Animated, { FadeIn } from "react-native-reanimated";
import { supabase, PASSWORD_RESET_REDIRECT_TO } from "../../lib/supabase";
import { useAuthContext } from "../../contexts/auth-context";
import type { AuthStackParamList } from "../../navigation/types";
import { Button, Screen, TextField, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }: Props) {
  const c = useThemeColors();
  const { clearError } = useAuthContext();
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError =
    touched && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address" : null;

  async function handleSend() {
    setTouched(true);
    if (!EMAIL_RE.test(email.trim())) {
      haptics.error();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: PASSWORD_RESET_REDIRECT_TO,
      });
      if (e) throw e;
      haptics.success();
      setSent(true);
    } catch (err) {
      haptics.error();
      setError(err instanceof Error ? err.message : "Couldn't send the reset link. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Pressable
        onPress={() => {
          haptics.selection();
          clearError();
          navigation.goBack();
        }}
        hitSlop={10}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 20 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>Back</Text>
      </Pressable>

      {sent ? (
        <Animated.View entering={FadeIn.duration(250)}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: c.success + "1f",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Icon name="check" size={30} color={c.success} />
          </View>
          <Text style={{ color: c.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.4 }}>
            Check your email
          </Text>
          <Text style={{ color: c.textBody, fontSize: 15, marginTop: 8, lineHeight: 22 }}>
            If an account exists for{" "}
            <Text style={{ color: c.text, fontWeight: "700" }}>{email.trim()}</Text>, we&apos;ve sent
            a link to reset your password. It opens in your browser.
          </Text>
          <View style={{ height: 28 }} />
          <Button
            label="Back to sign in"
            onPress={() => {
              clearError();
              navigation.navigate("SignIn");
            }}
          />
        </Animated.View>
      ) : (
        <>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 }}>
            Reset your password
          </Text>
          <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6, marginBottom: 24 }}>
            Enter your email and we&apos;ll send you a reset link.
          </Text>

          {error ? (
            <View
              style={{
                flexDirection: "row",
                gap: 10,
                backgroundColor: c.error + "18",
                borderColor: c.error + "40",
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 18,
              }}
            >
              <Icon name="alert-circle" size={18} color={c.error} />
              <Text style={{ flex: 1, color: c.error, fontSize: 13.5, fontWeight: "500" }}>{error}</Text>
            </View>
          ) : null}

          <TextField
            label="Email"
            leftIcon="mail"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            onBlur={() => setTouched(true)}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="go"
            onSubmitEditing={handleSend}
            editable={!loading}
          />

          <View style={{ height: 16 }} />
          <Button label="Send reset link" onPress={handleSend} loading={loading} size="lg" />
        </>
      )}
    </Screen>
  );
}
