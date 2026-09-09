import React, { forwardRef, useState } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Icon } from "../icon";
import { haptics } from "./haptics";
import { useThemeColors } from "./theme";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  inputStyle?: TextInputProps["style"];
  label?: string;
  error?: string | null;
  helper?: string;
  /** Renders a show/hide eye toggle and manages secureTextEntry. */
  password?: boolean;
  leftIcon?: string;
  containerClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helper, password, leftIcon, inputStyle, onFocus, onBlur, ...rest },
  ref,
) {
  const c = useThemeColors();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const borderProgress = useSharedValue(0);

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? c.error
      : borderProgress.value === 1
        ? c.accent
        : c.border,
  }));

  return (
    <View style={{ marginBottom: 4 }}>
      {label ? (
        <Text style={{ color: c.textBody, fontSize: 13, fontWeight: "600", marginBottom: 6, letterSpacing: 0.2 }}>
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          borderStyle,
          {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: c.bgElevated,
            borderWidth: 1.5,
            borderRadius: 12,
            paddingHorizontal: 14,
          },
        ]}
      >
        {leftIcon ? (
          <Icon name={leftIcon} size={18} color={focused ? c.accent : c.textMuted} />
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={c.textMuted}
          selectionColor={c.accent}
          secureTextEntry={password ? !reveal : rest.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            borderProgress.value = withTiming(1, { duration: 120 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            borderProgress.value = withTiming(0, { duration: 120 });
            onBlur?.(e);
          }}
          style={[
            {
              flex: 1,
              paddingVertical: 13,
              paddingLeft: leftIcon ? 10 : 0,
              fontSize: 16,
              color: c.text,
            },
            inputStyle,
          ]}
          {...rest}
        />
        {password ? (
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptics.selection();
              setReveal((v) => !v);
            }}
            accessibilityRole="button"
            accessibilityLabel={reveal ? "Hide password" : "Show password"}
          >
            <Icon name={reveal ? "eye-off" : "eye"} size={18} color={c.textMuted} />
          </Pressable>
        ) : null}
      </Animated.View>

      {error ? (
        <Text style={{ color: c.error, fontSize: 12.5, marginTop: 5, fontWeight: "500" }}>{error}</Text>
      ) : helper ? (
        <Text style={{ color: c.textMuted, fontSize: 12.5, marginTop: 5 }}>{helper}</Text>
      ) : null}
    </View>
  );
});
