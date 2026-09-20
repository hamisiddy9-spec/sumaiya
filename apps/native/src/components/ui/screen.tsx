import React from "react";
import {
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { keyboardAvoidingBehavior } from "../../lib/keyboard-avoiding";
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

  const footerNode = footer ? (
    <View
      style={{
        paddingHorizontal: px,
        paddingTop: 10,
        // A floor, not just the raw inset: some Android devices report a
        // near-zero bottom inset even with gesture nav, which put the
        // footer buttons close enough to the nav bar to cause mis-taps.
        paddingBottom: Math.max(edges.bottom ? insets.bottom : 0, 16) + 8,
        borderTopWidth: 1,
        borderTopColor: c.border,
        backgroundColor: bg,
      }}
    >
      {footer}
    </View>
  ) : null;

  // The footer belongs INSIDE the KeyboardAvoidingView, not beside it.
  //
  // Measured on the Pixel 8 Pro (1.6.24, 2026-09-21): with the footer as a
  // sibling of the KAV, the KAV shrank the scroll body but the footer stayed at
  // the bottom of the full-height outer View — underneath the soft keyboard.
  // The accessibility tree still reported the button's real layout bounds
  // (y 2566-2682 on that screen) while the IME occupied y 1959-2992 (its own
  // reported inset height is 1033px), so every tap at the button's own
  // reported bounds was delivered to the keyboard: three taps at "Lenga ajira
  // hii" typed three characters into the focused field instead of firing it
  // (the same field's counter went 2329 -> 2332 herufi), with no progress and
  // no error. Nothing about the handler was wrong — the control was simply
  // covered by the keyboard. Every screen with a footer had this, because the
  // footer is this component's.
  const content = keyboardAvoiding ? (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={keyboardAvoidingBehavior()}>
      {body}
      {footerNode}
    </KeyboardAvoidingView>
  ) : (
    <>
      {body}
      {footerNode}
    </>
  );

  return <View style={{ flex: 1, backgroundColor: bg }}>{content}</View>;
}
