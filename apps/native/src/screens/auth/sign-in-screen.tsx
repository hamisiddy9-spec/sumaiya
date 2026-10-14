import React, { useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { useAuthContext } from "../../contexts/auth-context";
import { canDismissAuth, dismissAuth } from "../../navigation/root-nav";
import { track } from "../../lib/telemetry";
import { Button, Screen, haptics, useThemeColors } from "../../components/ui";
import { MarkWell } from "../../components/mark-well";
import { Icon } from "../../components/icon";
import { FONT } from "../../components/home";
import { GoogleButton } from "./google-button";
import { AuthErrorBanner } from "./auth-error-banner";
import { useLang } from "../../lib/i18n";
import { EMAIL_OTP_DIGITS, isCompleteEmailOtp, normalizeEmailOtp } from "../../lib/auth-code";

type Props = NativeStackScreenProps<AuthStackParamList, "SignIn">;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The hairline + tracked label that separates the two ways in (design A2).
 * The label is the design's own line; its first sentence names the method.
 */
function PathDivider({ label }: { label: string }) {
  const c = useThemeColors();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
      <Text
        style={{
          color: c.textMuted,
          fontSize: 12,
          fontFamily: FONT.mono,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: c.border }} />
    </View>
  );
}

/**
 * The identifier row: a label, then the field with the send control INSIDE it
 * (the design's shape), on the sunken surface.
 *
 * The field is 52 dp with a 44 dp inner control — §8's floor is 44 dp and
 * `hitSlop` is not a target, so the mockup's 32 dp inner button would have been
 * a mis-tap waiting to happen on the exact control that starts the code.
 */
function IdentifierField({
  label,
  value,
  onChangeText,
  onSend,
  sendLabel,
  busy,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  sendLabel: string;
  busy: boolean;
  disabled: boolean;
  error?: string | null;
}) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);
  const border = error ? c.error : focused ? c.accent : c.border;

  return (
    <View>
      <Text
        style={{
          color: c.textBody,
          fontSize: 12,
          fontFamily: FONT.semibold,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 52,
          paddingLeft: 16,
          paddingRight: 4,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: c.bgSunken,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!busy && !disabled}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="go"
          onSubmitEditing={onSend}
          placeholderTextColor={c.textMuted}
          selectionColor={c.accent}
          accessibilityLabel={label}
          style={{
            flex: 1,
            paddingVertical: 14,
            fontSize: 15,
            color: c.text,
            fontFamily: FONT.regular,
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={sendLabel}
          accessibilityState={{ disabled: busy || disabled, busy }}
          disabled={busy || disabled}
          onPress={() => {
            haptics.selection();
            onSend();
          }}
          style={{
            minHeight: 44,
            minWidth: 96,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: c.accentFillStrong,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 8,
            opacity: busy || disabled ? 0.5 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator size="small" color={c.accentText} />
          ) : (
            <Text style={{ color: c.accentText, fontSize: 12.5, fontFamily: FONT.bold }}>
              {sendLabel}
            </Text>
          )}
        </Pressable>
      </View>

      {error ? (
        <Text style={{ color: c.error, fontSize: 12.5, marginTop: 5, fontFamily: FONT.regular }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Multi-box code entry — one hidden input drives every cell.
 *
 * The cells take `flex: 1` rather than a fixed 48 dp width: the server mails a
 * code of `EMAIL_OTP_DIGITS` digits and the row has to fit the narrowest phone
 * this app ships to, which fixed cells stopped doing the moment the code length
 * changed.
 */
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
      <View style={{ flexDirection: "row", gap: 6 }}>
        {cells.map((digit, i) => {
          const active = i === focusIndex;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 12,
                borderWidth: active ? 2 : 1,
                borderColor: active ? c.accent : c.border,
                backgroundColor: c.bgSunken,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: c.text, fontSize: 22, fontFamily: FONT.bold }}>{digit}</Text>
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
        style={{ position: "absolute", opacity: 0, width: "100%", height: 56 }}
      />
    </Pressable>
  );
}

export function SignInScreen(_props: Props) {
  const c = useThemeColors();
  const { t } = useLang();
  // True when sign-in was opened OVER the app (guest mode: the invitation after
  // a download, a gated surface, the Profile row) rather than being the app's
  // only screen. That is when there is work to go back to, so the screen says
  // what an account does with it and offers a way out.
  const canGoBackToApp = canDismissAuth();
  const { loading, error, sendCode, verifyCode, signInWithGoogle, clearError } = useAuthContext();

  const [step, setStep] = useState<"identifier" | "code">("identifier");
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
  // stack's own cross-fade as the flood of accent colour clears — it is already
  // mounted and at rest underneath. So the screen itself must not animate in: a
  // logo zooming while the colour field is still dissolving is two unrelated
  // choreographies finishing at once. The step blocks below keep their slide,
  // but only for an actual step *change* — never on first mount.
  const prevStep = useRef(step);
  const stepChanged = prevStep.current !== step;
  prevStep.current = step;
  const stepEntering = stepChanged ? FadeInRight.duration(200) : undefined;

  return (
    <>
      <StatusBar style="dark" />
      <Screen
        padded={24}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 20, paddingTop: 8 }}
        footer={
          /* The privacy footer (design A2). Two lines, in the design's order:
             the promise, then what continuing means. */
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text
              style={{
                color: c.textBody,
                fontSize: 12,
                lineHeight: 17,
                textAlign: "center",
                fontFamily: FONT.regular,
              }}
            >
              <Text style={{ color: c.text, fontFamily: FONT.bold }}>
                {t("Your device only", "Kifaa chako tu")}
              </Text>
              {t(" — we have no account to track you with.", " — hatuna akaunti ya kukufuatilia.")}
            </Text>
            <Text
              style={{
                color: c.textMuted,
                fontSize: 11,
                lineHeight: 16,
                textAlign: "center",
                fontFamily: FONT.regular,
              }}
            >
              {t(
                "By continuing you accept Sumaiya's Terms and Privacy Policy.",
                "Kwa kuendelea unakubali Sheria na Sera ya Faragha ya Sumaiya.",
              )}
            </Text>
          </View>
        }
      >
        {/* The brand block — the shared well, not a locally-invented one. This
            screen is part of the cold start, which is exactly the flow whose
            four different wells `ui/mark-well-tokens` exists to stop — and the
            guard knows about this file, so a fifth cannot appear here again. */}
        <View style={{ alignItems: "center" }}>
          <MarkWell state="static" />
          <Text
            style={{
              color: c.text,
              fontSize: 24,
              fontFamily: FONT.display,
              letterSpacing: -0.5,
              marginTop: 24,
              textAlign: "center",
            }}
          >
            {t("Welcome to Sumaiya", "Karibu Sumaiya")}
          </Text>
          <Text
            style={{
              color: c.textBody,
              fontSize: 14,
              lineHeight: 20,
              marginTop: 4,
              textAlign: "center",
              fontFamily: FONT.regular,
            }}
          >
            {canGoBackToApp
              ? // Opened over the app: the useful sentence is what the account
                // does with the work already on this phone, not a reassurance.
                t(
                  "Your CVs on this phone move to your account.",
                  "CV zako zilizo kwenye simu hii zitahamia kwenye akaunti yako.",
                )
              : t("Your work is safe on your phone.", "Kazi yako iko salama kwenye simu yako.")}
          </Text>
        </View>

        {step === "code" ? (
          <Animated.View key="code" entering={stepEntering} exiting={FadeOutLeft.duration(140)}>
            <Pressable
              onPress={() => {
                haptics.selection();
                clearError();
                setCode("");
                setStep("identifier");
              }}
              accessibilityRole="button"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                minHeight: 44,
                marginBottom: 10,
              }}
            >
              <Icon name="arrow-left" size={18} color={c.accent} />
              <Text style={{ color: c.accent, fontSize: 14, fontFamily: FONT.bold }}>
                {t("Change email", "Badili barua pepe")}
              </Text>
            </Pressable>

            <Text style={{ color: c.text, fontSize: 24, fontFamily: FONT.display, letterSpacing: -0.5 }}>
              {t("Enter your code", "Weka msimbo")}
            </Text>
            <Text
              style={{
                color: c.textBody,
                fontSize: 14,
                lineHeight: 20,
                marginTop: 6,
                marginBottom: 20,
                fontFamily: FONT.regular,
              }}
            >
              {t("We sent a code to", "Tumetuma msimbo kwa")} {email}
            </Text>

            <AuthErrorBanner error={error} onDismiss={clearError} />

            <CodeInput
              value={code}
              onChange={(x) => {
                setCode(x);
                if (error) clearError();
              }}
              onFilled={confirmCode}
            />

            <Button
              label={t("Verify and enter", "Thibitisha na Uingie")}
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
              accessibilityRole="button"
              style={{ alignSelf: "center", minHeight: 44, justifyContent: "center", marginTop: 8 }}
            >
              <Text style={{ color: c.textMuted, fontSize: 13.5, fontFamily: FONT.bold }}>
                {t("Resend code", "Tuma msimbo tena")}
              </Text>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View
            key="identifier"
            entering={stepEntering}
            exiting={FadeOutLeft.duration(140)}
            style={{ gap: 14 }}
          >
            <AuthErrorBanner error={error} onDismiss={clearError} />

            {/* One obvious path first — Google, zero-friction and proven
                reliable — then the code path under its own divider, never as an
                equally-weighted choice beside it. */}
            <GoogleButton
              label={t("Sign in with Google", "Ingia na Google")}
              // `loading` from the auth context is true for exactly the Google
              // round-trip (play-services check, account picker, token exchange)
              // and false the rest of the time on this step. `disabled` stays
              // tied to the code send so the two paths cannot both fire.
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

            <PathDivider label={t("Or with email", "Au kwa barua pepe")} />

            <IdentifierField
              label={t("Email address", "Barua pepe")}
              value={email}
              onChangeText={(x) => {
                setEmail(x);
                if (error) clearError();
              }}
              onSend={requestCode}
              sendLabel={t("Send code", "Tuma Kodi")}
              busy={sending}
              disabled={loading}
              error={emailError}
            />

            {/* The design's single-page pre-auth is the app's two-step code
                path: `Thibitisha na Uingie` is the VERIFY action, so it lives
                on the code step below, where pressing it actually verifies
                something — instead of sitting on this step permanently
                disabled because no code has been requested yet. */}

            {canGoBackToApp ? (
              <Pressable
                onPress={() => {
                  haptics.selection();
                  clearError();
                  dismissAuth();
                }}
                accessibilityRole="button"
                style={{ alignItems: "center", justifyContent: "center", minHeight: 44 }}
              >
                <Text style={{ color: c.textBody, fontSize: 12.5, fontFamily: FONT.semibold }}>
                  {t("Continue as a guest (no account for now)", "Endelea kama mgeni (Bila akaunti kwa sasa)")}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        )}
      </Screen>
    </>
  );
}
