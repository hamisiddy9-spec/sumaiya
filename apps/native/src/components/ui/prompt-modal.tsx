import React, { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View, useWindowDimensions, type KeyboardTypeOptions } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { haptics } from "./haptics";
import { useThemeColors } from "./theme";

/**
 * A one-field prompt. `Alert.prompt` is iOS-only — this works on both.
 */
export function PromptModal({
  visible,
  title,
  message,
  placeholder,
  initialValue = "",
  confirmLabel,
  cancelLabel,
  keyboardType,
  autoCapitalize = "sentences",
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  confirmLabel: string;
  cancelLabel: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const c = useThemeColors();
  const { width, height } = useWindowDimensions();
  const [value, setValue] = useState(initialValue);
  const progress = useSharedValue(0);
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
      setMounted(true);
      progress.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      progress.value = withTiming(0, { duration: 140 }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const card = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
  }));

  if (!mounted) return null;

  return (
    <Modal transparent visible={mounted} onRequestClose={onCancel} animationType="none" statusBarTranslucent>
      <Animated.View style={[backdrop, { width, height, backgroundColor: c.overlay, alignItems: "center", justifyContent: "center", padding: 28 }]}>
        <Animated.View style={[card, { width: "100%", maxWidth: 400, backgroundColor: c.bgElevated, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: c.border }]}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: "800", marginBottom: message ? 4 : 12 }}>{title}</Text>
          {message ? <Text style={{ color: c.textMuted, fontSize: 13.5, lineHeight: 19, marginBottom: 12 }}>{message}</Text> : null}
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={c.textMuted}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoFocus
            selectionColor={c.accent}
            onSubmitEditing={() => { haptics.selection(); onConfirm(value.trim()); }}
            style={{
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 11,
              fontSize: 15,
              color: c.text,
              backgroundColor: c.bg,
              marginBottom: 16,
            }}
          />
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 6 }}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={{ paddingVertical: 9, paddingHorizontal: 16 }}>
              <Text style={{ color: c.textMuted, fontSize: 14, fontWeight: "700" }}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => { haptics.selection(); onConfirm(value.trim()); }}
              style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 10, backgroundColor: c.accent }}
            >
              <Text style={{ color: c.accentText, fontSize: 14, fontWeight: "800" }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
