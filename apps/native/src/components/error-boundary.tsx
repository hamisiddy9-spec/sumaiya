import React from "react";
import { Pressable, Text, View } from "react-native";
import { SumaiyaMark } from "./sumaiya-mark";

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
    // Keep it in the console for `adb logcat` / crash tools; no PII.
    console.error("ErrorBoundary caught:", error?.message, info?.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FAF5EE",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          gap: 18,
        }}
      >
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            backgroundColor: "#DA4A1C",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SumaiyaMark size={40} state="static" color="#FAF5EE" />
        </View>
        <Text style={{ color: "#211A15", fontSize: 20, fontWeight: "800", textAlign: "center" }}>
          Something broke
        </Text>
        <Text style={{ color: "#6B5F54", fontSize: 14.5, textAlign: "center", lineHeight: 21, maxWidth: 300 }}>
          Sumaiya hit a problem on this screen. Your CVs and data are safe — nothing was lost.
        </Text>
        <Pressable
          onPress={this.reset}
          style={{ marginTop: 6, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 14, backgroundColor: "#DA4A1C" }}
        >
          <Text style={{ color: "#FAF5EE", fontSize: 15, fontWeight: "800" }}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}
