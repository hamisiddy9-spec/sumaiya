import { Platform } from "react-native";

// Android's `adjustResize` stopped auto-shrinking the RN root view once Expo's
// forced edge-to-edge rendering landed (SDK 54+), so `behavior: undefined` on
// Android is a silent no-op — KeyboardAvoidingView does nothing and the
// keyboard covers whatever is focused. "height" is RN's documented Android
// substitute for iOS's "padding".
export function keyboardAvoidingBehavior(): "padding" | "height" {
  return Platform.OS === "ios" ? "padding" : "height";
}
