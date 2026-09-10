import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthContext } from "../../contexts/auth-context";
import { Button, Screen, TextField, haptics, useThemeColors } from "../../components/ui";
import { GoogleButton } from "./google-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { useLang } from "../../lib/i18n";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInScreen(_props: Props) {
  const c = useThemeColors();
  const { t } = useLang();
  const { loading, error, sendCode, verifyCode, signInWithGoogle, clearError } = useAuthContext();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [sending, setSending] = useState(false);

  const emailError =
    emailTouched && !EMAIL_RE.test(email.trim()) ? t("Enter a valid email address", "Weka barua pepe sahihi") : null;

  async function requestCode() {
    setEmailTouched(true);
    if (!EMAIL_RE.test(email.trim())) {
      haptics.error();
      return;
    }
    clearError();
    setSending(true);
    try {
      await sendCode(email.trim());
      haptics.selection();
      setStep("code");
    } catch {
      /* surfaced via context error */
    } finally {
      setSending(false);
    }
  }

  async function confirmCode() {
    if (code.replace(/\D/g, "").length < 6) {
      haptics.error();
      return;
    }
    clearError();
    try {
      await verifyCode(email.trim(), code);
      haptics.success();
      // The root navigator swaps to the app once the session lands.
    } catch {
      /* surfaced via context error */
    }
  }

  if (step === "code") {
    return (
      <Screen>
        <Animated.View entering={FadeInDown.duration(320)} style={{ marginTop: 20, marginBottom: 28 }}>
          <Text style={{ color: c.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 }}>
            {t("Enter your code", "Weka msimbo")}
          </Text>
          <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6 }}>
            {t("We sent a 6-digit code to", "Tumetuma msimbo wa tarakimu 6 kwa")} {email}
          </Text>
        </Animated.View>

        <AuthErrorBanner error={error} onDismiss={clearError} />

        <TextInput
          value={code}
          onChangeText={(x) => setCode(x.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          autoFocus
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={c.textMuted}
          style={{
            fontSize: 30,
            fontWeight: "800",
            letterSpacing: 12,
            textAlign: "center",
            color: c.text,
            borderWidth: 1,
            borderColor: c.border,
            borderRadius: 14,
            paddingVertical: 14,
            backgroundColor: c.bg,
            marginBottom: 18,
          }}
        />

        <Button
          label={t("Sign in", "Ingia")}
          onPress={confirmCode}
          loading={loading}
          size="lg"
          disabled={code.replace(/\D/g, "").length < 6}
        />

        <Pressable
          onPress={() => {
            haptics.selection();
            clearError();
            setCode("");
            setStep("email");
          }}
          hitSlop={8}
          style={{ alignSelf: "center", marginTop: 18 }}
        >
          <Text style={{ color: c.accent, fontSize: 13.5, fontWeight: "700" }}>
            {t("Use a different email", "Tumia barua pepe nyingine")}
          </Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Text style={{ color: c.textMuted, fontSize: 13, textAlign: "center" }}>
          {t(
            "First time? The same code creates your account.",
            "Ni mara ya kwanza? Msimbo huohuo unatengeneza akaunti yako.",
          )}
        </Text>
      }
    >
      <Animated.View entering={FadeInDown.duration(360)} style={{ marginTop: 20, marginBottom: 28 }}>
        <Text style={{ color: c.text, fontSize: 32, fontWeight: "800", letterSpacing: -0.5 }}>
          {t("Sign in to Sumaiya", "Ingia Sumaiya")}
        </Text>
        <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6 }}>
          {t("No password — we'll email you a 6-digit code.", "Hakuna nywila — tutakutumia msimbo wa tarakimu 6.")}
        </Text>
      </Animated.View>

      <AuthErrorBanner error={error} onDismiss={clearError} />

      <Animated.View entering={FadeIn.delay(140).duration(420)} style={{ gap: 14 }}>
        <TextField
          label={t("Email", "Barua pepe")}
          leftIcon="mail"
          value={email}
          onChangeText={(x) => {
            setEmail(x);
            if (error) clearError();
          }}
          onBlur={() => setEmailTouched(true)}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="go"
          onSubmitEditing={requestCode}
          editable={!sending}
        />

        <Button label={t("Send me a code", "Nitumie msimbo")} onPress={requestCode} loading={sending} size="lg" />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
          <Text style={{ color: c.textMuted, fontSize: 12.5 }}>{t("or", "au")}</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
        </View>

        <GoogleButton
          label={t("Continue with Google", "Endelea na Google")}
          disabled={sending}
          onPress={async () => {
            clearError();
            try {
              await signInWithGoogle();
            } catch {
              /* surfaced via context */
            }
          }}
        />
      </Animated.View>
    </Screen>
  );
}
