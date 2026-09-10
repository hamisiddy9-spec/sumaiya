import { describe, it, expect } from "vitest";
import { isExpoPushToken } from "./expo";

describe("isExpoPushToken", () => {
  it("accepts real Expo token shapes", () => {
    expect(isExpoPushToken("ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]")).toBe(true);
    expect(isExpoPushToken("ExpoPushToken[abc123]")).toBe(true);
  });
  it("rejects junk and empty", () => {
    expect(isExpoPushToken("")).toBe(false);
    expect(isExpoPushToken("not-a-token")).toBe(false);
    expect(isExpoPushToken("Bearer abc")).toBe(false);
  });
});
