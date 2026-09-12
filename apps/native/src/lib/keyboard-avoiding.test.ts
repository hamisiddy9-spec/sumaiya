import { Platform } from "react-native";
import { keyboardAvoidingBehavior } from "./keyboard-avoiding";

describe("keyboardAvoidingBehavior", () => {
  const originalOS = Platform.OS;
  afterEach(() => {
    Platform.OS = originalOS;
  });

  it("uses padding on iOS", () => {
    Platform.OS = "ios";
    expect(keyboardAvoidingBehavior()).toBe("padding");
  });

  it("uses height on Android — undefined is a no-op that lets the keyboard cover inputs", () => {
    Platform.OS = "android";
    expect(keyboardAvoidingBehavior()).toBe("height");
  });
});
