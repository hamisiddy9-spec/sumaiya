jest.mock("expo-image-picker", () => ({}));
jest.mock("expo-image-manipulator", () => ({ SaveFormat: { JPEG: "jpeg" } }));

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
  setItem: jest.fn((k: string, v: string) => { store[k] = v; return Promise.resolve(); }),
  removeItem: jest.fn((k: string) => { delete store[k]; return Promise.resolve(); }),
}));

import { setPendingOnboardingPhoto, consumePendingOnboardingPhoto } from "./pick-photo";

describe("pending onboarding photo", () => {
  it("returns null when nothing was set", async () => {
    expect(await consumePendingOnboardingPhoto()).toBeNull();
  });

  it("round-trips a set value, then clears it (consume-once)", async () => {
    await setPendingOnboardingPhoto("data:image/jpeg;base64,abc");
    expect(await consumePendingOnboardingPhoto()).toBe("data:image/jpeg;base64,abc");
    expect(await consumePendingOnboardingPhoto()).toBeNull();
  });
});
