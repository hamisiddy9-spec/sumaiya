import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthContext } from "../../contexts/auth-context";
import { Button, Screen, TextField, haptics, useThemeColors } from "../../components/ui";
import { SumaiyaMark } from "../../components/sumaiya-mark";
import { Icon } from "../../components/icon";
import { GoogleButton } from "./google-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { useLang } from "../../lib/i18n";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Six-box code entry — one hidden input drives all six cells. */
function CodeInput({
  value,
  onChange,
  onFilled,
}: {
  value: string;
  onChange: (v: string) => void;
  onFilled: () => void;
}) {
  const c = useThemeColors();
  const ref = useRef<TextInput>(null);
  const cells = Array.from({ length: 6 }, (_, i) => value[i] ?? "");
  const focusIndex = Math.min(value.length, 5);

  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {cells.map((digit, i) => {
          const active = i === focusIndex;
          return (
            <View
              key={i}
              style={{
                width: 48,
                height: 58,
                borderRadius: 12,
                borderWidth: active ? 2 : 1,
                borderColor: active ? c.accent : c.border,
                backgroundColor: c.bgElevated,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.text, fontSize: 24, fontWeight: "800" }}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(x) => {
          const next = x.replace(/\D/g, "").slice(0, 6);
          onChange(next);
          if (next.length === 6) onFilled();
        }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoFocus
        maxLength={6}
        style={{ position: "absolute", opacity: 0, width: "100%", height: 58 }}
      />
    </Pressable>
  );
}

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

  const brand = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginTop: 12 }}>
      <SumaiyaMark size={30} state="static" color={c.accent} />
      <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 }}>Sumaiya</Text>
    </View>
  );

  return (
    <>
    <StatusBar style="dark" />
    <Screen
      footer={
        step === "email" ? (
          <Text style={{ color: c.textMuted, fontSize: 13, textAlign: "center" }}>
            {t(
              "First time? The same code creates your account.",
              "Ni mara ya kwanza? Msimbo huohuo unatengeneza akaunti yako.",
            )}
          </Text>
        ) : undefined
      }
    >
      {brand}

      {step === "code" ? (
        <Animated.View key="code" entering={FadeInRight.duration(240)} exiting={FadeOutLeft.duration(140)}>
          <Pressable
            onPress={() => {
              haptics.selection();
              clearError();
              setCode("");
              setStep("email");
            }}
            hitSlop={10}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 24, marginBottom: 14 }}
          >
            <Icon name="arrow-left" size={18} color={c.accent} />
            <Text style={{ color: c.accent, fontSize: 14, fontWeight: "700" }}>
              {t("Change email", "Badili barua pepe")}
            </Text>
          </Pressable>

          <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
            {t("Enter your code", "Weka msimbo")}
          </Text>
          <Text style={{ color: c.textBody, fontSize: 14.5, marginTop: 6, marginBottom: 24 }}>
            {t("We sent a 6-digit code to", "Tumetuma msimbo wa tarakimu 6 kwa")} {email}
          </Text>

          <AuthErrorBanner error={error} onDismiss={clearError} />

          <CodeInput value={code} onChange={(x) => { setCode(x); if (error) clearError(); }} onFilled={confirmCode} />

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
              void requestCode();
            }}
            hitSlop={8}
            style={{ alignSelf: "center", marginTop: 18 }}
          >
            <Text style={{ color: c.textMuted, fontSize: 13.5, fontWeight: "700" }}>
              {t("Resend code", "Tuma msimbo tena")}
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View key="email" entering={FadeInRight.duration(240)} exiting={FadeOutLeft.duration(140)}>
          <View style={{ marginTop: 26, marginBottom: 26 }}>
            <Text style={{ color: c.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 }}>
              {t("Sign in to Sumaiya", "Ingia Sumaiya")}
            </Text>
            <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6 }}>
              {t("No password — we'll email you a 6-digit code.", "Hakuna nywila — tutakutumia msimbo wa tarakimu 6.")}
            </Text>
          </View>

          <AuthErrorBanner error={error} onDismiss={clearError} />

          <Animated.View entering={FadeIn.delay(120).duration(360)} style={{ gap: 14 }}>
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
        </Animated.View>
      )}
    </Screen>
    </>
  );
}
