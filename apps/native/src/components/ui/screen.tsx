import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "./theme";

interface ScreenProps {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Avoid the keyboard (default true — set false for screens with their own list). */
  keyboardAvoiding?: boolean;
  /** Apply top safe-area padding (default true). */
  edges?: { top?: boolean; bottom?: boolean };
  /** Horizontal padding in px (default 20). */
  padded?: boolean | number;
  /** Override the background (defaults to the theme's page bg). */
  background?: string;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  /** Sticky footer, sits above the bottom inset. */
  footer?: React.ReactNode;
  /** Pull-to-refresh (scroll mode only). */
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  scroll = true,
  keyboardAvoiding = true,
  edges = { top: true, bottom: true },
  padded = true,
  background,
  contentContainerStyle,
  footer,
  refreshing,
  onRefresh,
}: ScreenProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const px = padded === true ? 20 : padded === false ? 0 : padded;
  const bg = background ?? c.bg;

  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh
          ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} />
          : undefined
      }
      contentContainerStyle={[
        {
          paddingHorizontal: px,
          paddingTop: edges.top ? insets.top + 12 : 12,
          paddingBottom: (edges.bottom ? insets.bottom : 0) + (footer ? 12 : 28),
          flexGrow: 1,
        },
        contentContainerStyle,
      ]}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={{
        flex: 1,
        paddingHorizontal: px,
        paddingTop: edges.top ? insets.top + 12 : 12,
        paddingBottom: footer ? 12 : edges.bottom ? insets.bottom : 0,
      }}
    >
      {children}
    </View>
  );

  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {content}
      {footer ? (
        <View
          style={{
            paddingHorizontal: px,
            paddingTop: 10,
            paddingBottom: (edges.bottom ? insets.bottom : 0) + 10,
            borderTopWidth: 1,
            borderTopColor: c.border,
            backgroundColor: bg,
          }}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );
}
