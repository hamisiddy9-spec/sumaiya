const mockManipulateAsync = jest.fn();
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock("expo-image-manipulator", () => ({
  SaveFormat: { JPEG: "jpeg" },
  manipulateAsync: (...args: unknown[]) => mockManipulateAsync(...args),
}));

const store: Record<string, string> = {};
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn((k: string) => Promise.resolve(store[k] ?? null)),
  setItem: jest.fn((k: string, v: string) => { store[k] = v; return Promise.resolve(); }),
  removeItem: jest.fn((k: string) => { delete store[k]; return Promise.resolve(); }),
}));

import * as ImagePicker from "expo-image-picker";
import {
  setPendingOnboardingPhoto,
  consumePendingOnboardingPhoto,
  compressPhotoUri,
  pickAndCompressPhoto,
} from "./pick-photo";

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

describe("compressPhotoUri", () => {
  beforeEach(() => mockManipulateAsync.mockReset());

  it("resolves a base64 data URI on success", async () => {
    mockManipulateAsync.mockResolvedValue({ base64: "abc123" });
    expect(await compressPhotoUri("file:///x.jpg")).toBe("data:image/jpeg;base64,abc123");
  });

  it("throws (does not silently return null) when the manipulator rejects", async () => {
    mockManipulateAsync.mockRejectedValue(new Error("boom"));
    await expect(compressPhotoUri("file:///x.jpg")).rejects.toThrow();
  });

  it("throws when the manipulator resolves with no base64", async () => {
    mockManipulateAsync.mockResolvedValue({ base64: null });
    await expect(compressPhotoUri("file:///x.jpg")).rejects.toThrow();
  });
});

describe("pickAndCompressPhoto", () => {
  beforeEach(() => {
    mockManipulateAsync.mockReset();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockReset();
  });

  it("returns null (silently) when the user cancels the picker", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({ canceled: true, assets: [] });
    expect(await pickAndCompressPhoto()).toBeNull();
    expect(mockManipulateAsync).not.toHaveBeenCalled();
  });

  it("throws — not a silent null — when the picker succeeds but compression fails", async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///x.jpg" }],
    });
    mockManipulateAsync.mockRejectedValue(new Error("boom"));
    await expect(pickAndCompressPhoto()).rejects.toThrow();
  });
});
