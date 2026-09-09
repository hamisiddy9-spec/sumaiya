import React, { useRef, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { supabase } from "../../lib/supabase";
import { useAuthContext } from "../../contexts/auth-context";
import { Button, Screen, TextField, haptics, useThemeColors } from "../../components/ui";
import { Icon } from "../../components/icon";
import { PasswordStrength, scorePassword } from "../auth/password-strength";

/**
 * Change Password — for logged-in users who have a password. Verifies the
 * CURRENT password (re-auth via signInWithPassword) before updateUser(),
 * so a few seconds of access to an unlocked signed-in device can't silently
 * take over the account.
 */
export function ChangePasswordScreen({ navigation }: any) {
  const c = useThemeColors();
  const { user } = useAuthContext();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const nextErr = touched.next && next.length < 8 ? "At least 8 characters" : null;
  const confirmErr = touched.confirm && confirm !== next ? "Passwords don't match" : null;
  const valid =
    current.length > 0 && next.length >= 8 && scorePassword(next) >= 2 && confirm === next;

  async function submit() {
    setTouched({ current: true, next: true, confirm: true });
    setError(null);
    if (!valid) {
      haptics.error();
      if (current.length === 0) setError("Enter your current password.");
      return;
    }
    if (!user?.email) {
      setError("Couldn't determine your account email. Sign out and back in.");
      return;
    }
    setLoading(true);
    try {
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (verifyErr) {
        haptics.error();
        setError("Your current password is incorrect.");
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({ password: next });
      if (updateErr) throw updateErr;
      haptics.success();
      Alert.alert("Password updated", "Use your new password next time you sign in.", [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      haptics.error();
      setError(err instanceof Error ? err.message : "Couldn't update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Pressable
        onPress={() => {
          haptics.selection();
          navigation.goBack();
        }}
        hitSlop={10}
        disabled={loading}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8, marginBottom: 18 }}
      >
        <Icon name="arrow-left" size={18} color={c.accent} />
        <Text style={{ color: c.accent, fontWeight: "700" }}>Settings</Text>
      </Pressable>

      <Text style={{ color: c.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>
        Change password
      </Text>
      <Text style={{ color: c.textBody, fontSize: 15, marginTop: 6, marginBottom: 24 }}>
        Confirm your current password, then set a new one.
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

      <View style={{ gap: 14 }}>
        <TextField
          label="Current password"
          leftIcon="lock"
          password
          value={current}
          onChangeText={(t) => {
            setCurrent(t);
            setError(null);
          }}
          returnKeyType="next"
          onSubmitEditing={() => nextRef.current?.focus()}
          editable={!loading}
        />
        <View>
          <TextField
            ref={nextRef}
            label="New password"
            leftIcon="lock"
            password
            value={next}
            onChangeText={(t) => {
              setNext(t);
              setError(null);
            }}
            onBlur={() => setTouched((s) => ({ ...s, next: true }))}
            error={nextErr}
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            editable={!loading}
          />
          <PasswordStrength password={next} />
        </View>
        <TextField
          ref={confirmRef}
          label="Confirm new password"
          leftIcon="lock"
          password
          value={confirm}
          onChangeText={(t) => {
            setConfirm(t);
            setError(null);
          }}
          onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
          error={confirmErr}
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!loading}
        />

        <View style={{ height: 6 }} />
        <Button label="Update password" onPress={submit} loading={loading} size="lg" />
      </View>
    </Screen>
  );
}
