// AsyncStorage ships a native module, which does not exist under jest — this
// mock is the same one used across this suite (see ai-memory.test.ts).
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const mockGetInfo = jest.fn();
const mockCopy = jest.fn(async () => {});
const mockReadDir = jest.fn(async () => [] as string[]);
const mockDelete = jest.fn(async () => {});
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  getInfoAsync: (...a: unknown[]) => mockGetInfo(...a),
  copyAsync: (...a: unknown[]) => mockCopy(...a),
  readDirectoryAsync: (...a: unknown[]) => mockReadDir(...a),
  deleteAsync: (...a: unknown[]) => mockDelete(...a),
}));

const mockIsAvailable = jest.fn(async () => true);
const mockShareAsync = jest.fn(async () => {});
jest.mock("expo-sharing", () => ({
  isAvailableAsync: (...a: unknown[]) => mockIsAvailable(...a),
  shareAsync: (...a: unknown[]) => mockShareAsync(...a),
}));

// Deliberately not "pro.sumaiya.app" — that substring would trip
// __tests__/app-hosts.test.ts's "no source file hard-codes a host" scan.
const FAKE_APK_PATH = "/data/app/~~hash==/pro.example.testapp-hash==/base.apk";
const mockGetApkSourcePath = jest.fn(() => FAKE_APK_PATH);
jest.mock("sumaiya-apk-share", () => ({
  getApkSourcePath: (...a: unknown[]) => mockGetApkSourcePath(...a),
}));

const mockTrack = jest.fn();
jest.mock("./analytics", () => ({ track: (...a: unknown[]) => mockTrack(...a) }));

// Platform.OS is much easier to steer than to fake the whole RN module (see
// services/save-to-device.test.ts).
jest.mock("react-native", () => ({ Platform: { OS: "android" } }));

import {
  cleanupSharedApkCopies,
  getOrCreateShareCode,
  shareApk,
} from "./apk-share";

// A stateful fake, not a mockResolvedValueOnce()/mockResolvedValue() chain:
// several tests below return early (apk-path-unavailable, share-failed, …)
// without ever calling getInfoAsync, which would leave a "once" value
// unconsumed and bleeding into the NEXT test's first call — exactly the kind
// of cross-test pollution a queue-based mock invites.
let cacheFileExists = false;

beforeEach(() => {
  jest.clearAllMocks();
  cacheFileExists = false;
  mockGetApkSourcePath.mockReturnValue(FAKE_APK_PATH);
  mockIsAvailable.mockResolvedValue(true);
  mockReadDir.mockResolvedValue([]);
  mockGetInfo.mockImplementation(async () =>
    cacheFileExists
      ? { exists: true, isDirectory: false, size: 12_345_678, uri: "file:///cache/x" }
      : { exists: false, isDirectory: false },
  );
  mockCopy.mockImplementation(async () => {
    cacheFileExists = true;
  });
});

describe("getOrCreateShareCode", () => {
  it("mints a 6-character code from the safe alphabet and persists it", async () => {
    const code = await getOrCreateShareCode();
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it("reuses the same code on a second call — one code per install, not per share", async () => {
    const first = await getOrCreateShareCode();
    const second = await getOrCreateShareCode();
    expect(second).toBe(first);
  });
});

describe("shareApk", () => {
  it("copies the installed APK into cache under a coded filename and shares it with the APK MIME type", async () => {
    const result = await shareApk();
    expect(result).toEqual({ ok: true });

    const code = await getOrCreateShareCode();
    expect(mockCopy).toHaveBeenCalledWith({
      from: `file://${FAKE_APK_PATH}`,
      to: `file:///cache/sumaiya-${code}.apk`,
    });
    expect(mockShareAsync).toHaveBeenCalledWith(
      `file:///cache/sumaiya-${code}.apk`,
      expect.objectContaining({ mimeType: "application/vnd.android.package-archive" }),
    );
  });

  it("fires the apk_shared analytics event with the sharer's code, on success", async () => {
    await shareApk();
    const code = await getOrCreateShareCode();
    expect(mockTrack).toHaveBeenCalledWith("apk_shared", { code });
  });

  it("does not recopy an already-cached share for the same code", async () => {
    cacheFileExists = true;
    await shareApk();
    expect(mockCopy).not.toHaveBeenCalled();
  });

  it("returns apk-path-unavailable instead of throwing when the native module can't resolve a path", async () => {
    mockGetApkSourcePath.mockReturnValue(null);
    const result = await shareApk();
    expect(result).toEqual({ ok: false, reason: "apk-path-unavailable" });
    expect(mockCopy).not.toHaveBeenCalled();
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("returns copy-failed instead of throwing when copyAsync rejects", async () => {
    mockCopy.mockRejectedValueOnce(new Error("no space"));
    const result = await shareApk();
    expect(result).toEqual({ ok: false, reason: "copy-failed" });
    expect(mockShareAsync).not.toHaveBeenCalled();
  });

  it("returns sharing-unavailable instead of throwing when no share target exists on-device", async () => {
    mockIsAvailable.mockResolvedValue(false);
    const result = await shareApk();
    expect(result).toEqual({ ok: false, reason: "sharing-unavailable" });
    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("returns share-failed instead of throwing when shareAsync rejects", async () => {
    mockShareAsync.mockRejectedValueOnce(new Error("activity gone"));
    const result = await shareApk();
    expect(result).toEqual({ ok: false, reason: "share-failed" });
  });
});

describe("cleanupSharedApkCopies", () => {
  it("deletes prior sumaiya-*.apk copies but leaves other cache files and the kept one alone", async () => {
    mockReadDir.mockResolvedValue(["sumaiya-AB12CD.apk", "sumaiya-ZZ99XX.apk", "some-other-file.pdf"]);
    await cleanupSharedApkCopies("sumaiya-ZZ99XX.apk");
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith("file:///cache/sumaiya-AB12CD.apk", { idempotent: true });
  });

  it("never throws when the cache directory can't be read", async () => {
    mockReadDir.mockRejectedValue(new Error("unreadable"));
    await expect(cleanupSharedApkCopies()).resolves.toBeUndefined();
  });
});

describe("shareApk on a platform with no APK concept", () => {
  it("returns unsupported-platform on iOS without touching the filesystem or the native module", async () => {
    jest.resetModules();
    jest.doMock("react-native", () => ({ Platform: { OS: "ios" } }));
    jest.doMock("@react-native-async-storage/async-storage", () =>
      require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
    );
    jest.doMock("expo-file-system/legacy", () => ({
      cacheDirectory: "file:///cache/",
      getInfoAsync: mockGetInfo,
      copyAsync: mockCopy,
      readDirectoryAsync: mockReadDir,
      deleteAsync: mockDelete,
    }));
    jest.doMock("expo-sharing", () => ({ isAvailableAsync: mockIsAvailable, shareAsync: mockShareAsync }));
    jest.doMock("sumaiya-apk-share", () => ({ getApkSourcePath: mockGetApkSourcePath }));
    jest.doMock("./analytics", () => ({ track: mockTrack }));

    const { shareApk: shareApkOnIos } = require("./apk-share") as typeof import("./apk-share");
    const result = await shareApkOnIos();
    expect(result).toEqual({ ok: false, reason: "unsupported-platform" });
    expect(mockGetApkSourcePath).not.toHaveBeenCalled();
    expect(mockCopy).not.toHaveBeenCalled();
  });
});
