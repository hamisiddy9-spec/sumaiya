import React from "react";
import { Pressable, Text, View } from "react-native";
import { SumaiyaMark } from "./sumaiya-mark";
import { MARK_WELL } from "./ui/mark-well-tokens";
import { reportError } from "../lib/reporting";
import { getLastKnownLang } from "../lib/i18n";
import { reportSheet } from "./report-sheet";

/**
 * Catches a render/lifecycle crash anywhere below it and shows a calm recovery
 * screen instead of a white void. `onReset` lets the parent re-mount the tree.
 *
 * Deliberately dependency-free and theme-free — a crash may have come from the
 * theme/i18n providers themselves, so this must render with nothing but React.
 */
interface Props {
  children: React.ReactNode;
  onReset?: () => void;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep it in the console for `adb logcat`, and hand it to the reporting
    // seam (a no-op until a crash reporter is provisioned). No PII.
    reportError(error, { scope: "ErrorBoundary", componentStack: info?.componentStack });
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    // A plain function call, not a hook — safe even if the crash came from
    // inside the language provider itself; see getLastKnownLang's own
    // comment. Defensively wrapped anyway: this screen must never itself
    // throw, since there is nothing left to catch it.
    let sw = false;
    try {
      sw = getLastKnownLang() === "sw";
    } catch { /* stay English */ }

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FBF9F5",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 18,
        }}
      >
        <View
          style={{
            // §3 — the house well, from the one source of its geometry. This
            // screen is deliberately theme-free (it paints before/independent
            // of the theme providers), so it keeps literal hexes — but the
            // SIZE/RADIUS/MARK come from `MARK_WELL`, not a locally-invented
            // 76/r24/mark-40 container. It stays dependency-free: the tokens
            // module is pure data with no React and no theme.
            width: MARK_WELL.size,
            height: MARK_WELL.size,
            borderRadius: MARK_WELL.radius,
            backgroundColor: "#DA4A1C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SumaiyaMark size={MARK_WELL.mark} state="static" color="#FFFFFF" />
        </View>
        <Text style={{ color: "#211A15", fontSize: 20, fontWeight: "800", textAlign: "center" }}>
          {sw ? "Kuna hitilafu imetokea" : "Something broke"}
        </Text>
        <Text style={{ color: "#1B1C1A", fontSize: 14.5, textAlign: "center", lineHeight: 21, maxWidth: 300 }}>
          {sw
            ? "Nimekutana na tatizo kwenye skrini hii. CV zako na taarifa zako ziko salama — hakuna kilichopotea."
            : "I hit a problem on this screen. Your CVs and data are safe — nothing was lost."}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={this.reset}
          style={{ marginTop: 6, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 12, backgroundColor: "#B93C13" }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "800" }}>{sw ? "Jaribu tena" : "Try again"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => reportSheet.open("crash")}
          style={{ paddingVertical: 10, paddingHorizontal: 16 }}
        >
          <Text style={{ color: "#1B1C1A", fontSize: 14, fontWeight: "700" }}>
            {sw ? "Ripoti tatizo" : "Report a problem"}
          </Text>
        </Pressable>
      </View>
    );
  }
}
