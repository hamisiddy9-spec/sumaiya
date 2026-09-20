import React, { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthContext } from "../../contexts/auth-context";
import { track } from "../../lib/telemetry";
import { Button, Screen, TextField, haptics, useThemeColors } from "../../components/ui";
import { SumaiyaMark } from "../../components/sumaiya-mark";
import { Icon } from "../../components/icon";
import { GoogleButton } from "./google-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { useLang } from "../../lib/i18n";
import { EMAIL_OTP_DIGITS, isCompleteEmailOtp, normalizeEmailOtp } from "../../lib/auth-code";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Multi-box code entry — one hidden input drives every cell. */
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
  const cells = Array.from({ length: EMAIL_OTP_DIGITS }, (_, i) => value[i] ?? "");
  const focusIndex = Math.min(value.length, EMAIL_OTP_DIGITS - 1);

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
          const next = normalizeEmailOtp(x);
          onChange(next);
          if (isCompleteEmailOtp(next)) onFilled();
        }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        autoFocus
        maxLength={EMAIL_OTP_DIGITS}
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
  // Lead with one obvious path (Google — zero-friction, proven reliable) rather
  // than presenting email-OTP and Google as equally-weighted choices; email is
  // a secondary, opt-in path reached via the link below.
  const [showEmail, setShowEmail] = useState(false);

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
      track("auth.code.sent", {});
      haptics.selection();
      setStep("code");
    } catch {
      /* surfaced via context error */
    } finally {
      setSending(false);
    }
  }

  async function confirmCode() {
    if (!isCompleteEmailOtp(code)) {
      haptics.error();
      return;
    }
    clearError();
    try {
      await verifyCode(email.trim(), code);
      // Only on success: a failed code is surfaced in the UI, and counting it
      // as a sign-in would flatter the funnel.
      track("auth.signin", { method: "email" });
      haptics.success();
      // The root navigator swaps to the app once the session lands.
    } catch {
      /* surfaced via context error */
    }
  }

  // Arriving from the onboarding portal, this screen is revealed by the root
  // stack's own cross-fade as the flood of accent colour clears — it is
  // already mounted and at rest underneath. So the screen itself must not
  // animate in: a logo zooming while the colour field is still dissolving is
  // two unrelated choreographies finishing at once. The step blocks below keep
  // their slide, but only for an actual step *change* — never on first mount.
  const prevStep = useRef(step);
  const stepChanged = prevStep.current !== step;
  prevStep.current = step;
  const stepEntering = stepChanged ? FadeInRight.duration(200) : undefined;

  // Same treatment as the onboarding intro slide's centred icon — a big mark
  // in a soft circular backdrop — so sign-in reads as a continuation of that
  // screen, not a smaller, top-pinned afterthought.
  const brand = (
    <View style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
      <View style={{ width: 92, height: 92, borderRadius: 28, backgroundColor: c.accent + "14", alignItems: "center", justifyContent: "center" }}>
        <SumaiyaMark size={48} state="static" color={c.accent} />
      </View>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 }}>Sumaiya</Text>
    </View>
  );

  return (
    <>
    <StatusBar style="dark" />
    <Screen
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
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
        <Animated.View key="code" entering={stepEntering} exiting={FadeOutLeft.duration(140)}>
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
            {t("We sent a code to", "Tumetuma msimbo kwa")} {email}
          </Text>

          <AuthErrorBanner error={error} onDismiss={clearError} />

          <CodeInput value={code} onChange={(x) => { setCode(x); if (error) clearError(); }} onFilled={confirmCode} />

          <Button
            label={t("Sign in", "Ingia")}
            onPress={confirmCode}
            loading={loading}
            size="lg"
            disabled={!isCompleteEmailOtp(code)}
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
        <Animated.View key="email" entering={stepEntering} exiting={FadeOutLeft.duration(140)}>
          <View style={{ marginTop: 26, marginBottom: 26 }}>
            <Text style={{ color: c.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 }}>
              {t("Sign in to Sumaiya", "Ingia Sumaiya")}
            </Text>
            <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6 }}>
              {t("One tap, no password.", "Mguso mmoja, hakuna nywila.")}
            </Text>
          </View>

          <AuthErrorBanner error={error} onDismiss={clearError} />

          <Animated.View entering={FadeIn.duration(240)} style={{ gap: 14 }}>
            <GoogleButton
              label={t("Continue with Google", "Endelea na Google")}
              // `loading` from the auth context is true for exactly the Google
              // round-trip (play-services check, account picker, token exchange)
              // and false the rest of the time on this step. `disabled` stays
              // tied to the email-code send so the two paths cannot both fire.
              loading={loading}
              disabled={sending}
              onPress={async () => {
                clearError();
                try {
                  await signInWithGoogle();
                  // Only on success: a cancelled picker or a failed sign-in is
                  // surfaced via context, and counting it as a sign-in would
                  // flatter the funnel (see confirmCode() above).
                  track("auth.signin", { method: "google" });
                } catch {
                  /* surfaced via context */
                }
              }}
            />

            {showEmail ? (
              <Animated.View entering={FadeIn.duration(200)} style={{ gap: 14, marginTop: 8 }}>
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
                  autoFocus
                />
                <Button label={t("Send me a code", "Nitumie msimbo")} onPress={requestCode} loading={sending} size="lg" />
              </Animated.View>
            ) : (
              <Pressable
                onPress={() => {
                  haptics.selection();
                  setShowEmail(true);
                }}
                hitSlop={8}
                style={{ alignItems: "center", marginTop: 8, paddingVertical: 8 }}
              >
                <Text style={{ color: c.textMuted, fontSize: 13.5, fontWeight: "700" }}>
                  {t("Use email instead", "Tumia barua pepe badala yake")}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </Screen>
    </>
  );
}
