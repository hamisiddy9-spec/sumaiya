import * as ImagePicker from "expo-image-picker";
import { requestCameraAccess, __resetCameraPromptForTest } from "./permissions";

/**
 * The camera permission was requested from three call sites with three different
 * behaviours, and two of them returned a bare `null` on refusal — so tapping
 * "Camera", refusing, and seeing nothing happen was the shipped behaviour.
 *
 * These tests pin the two rules that fix it and that are expensive to discover
 * on a phone:
 *
 *   1. at most ONE system prompt per app session (Android keeps its dialog
 *      available while `canAskAgain` is true, so a second tap used to re-open
 *      it — the nag loop the owner reported);
 *   2. `canAskAgain: false` is reported as `blocked`, never as `refused`, so
 *      callers send the user to Settings instead of re-asking forever.
 *
 * The native module is mocked FILE-LOCALLY: a jest.mock elsewhere in the suite
 * would not apply here, and this module has no React or storage dependency to
 * boot.
 */
jest.mock("expo-image-picker", () => ({
  getCameraPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
}));

// The UI barrel pulls in react-native-reanimated (via Button/theme), which cannot
// initialise its native worklets runtime under jest. Only `dialog` and `haptics`
// are used by this module, so mock the barrel file-locally.
jest.mock("../components/ui", () => ({
  dialog: { alert: jest.fn() },
  haptics: {
    warning: jest.fn(),
    light: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    selection: jest.fn(),
  },
}));

// `./i18n` reaches @sumaiya/utils -> expo-sqlite, which is not resolvable under
// jest. This module only reads the current language for the dialog copy.
jest.mock("./i18n", () => ({ getLastKnownLang: () => "en" }));

const getPerm = ImagePicker.getCameraPermissionsAsync as jest.Mock;
const reqPerm = ImagePicker.requestCameraPermissionsAsync as jest.Mock;

type Perm = { granted: boolean; canAskAgain: boolean };

const perm = (granted: boolean, canAskAgain: boolean): Perm => ({ granted, canAskAgain });

beforeEach(() => {
  jest.clearAllMocks();
  __resetCameraPromptForTest();
});

describe("requestCameraAccess", () => {
  it("returns granted without prompting when the camera is already allowed", async () => {
    getPerm.mockResolvedValue(perm(true, true));
    await expect(requestCameraAccess()).resolves.toBe("granted");
    expect(reqPerm).not.toHaveBeenCalled();
  });

  it("prompts once and reports a refusal that can still be asked again", async () => {
    getPerm.mockResolvedValue(perm(false, true));
    reqPerm.mockResolvedValue(perm(false, true));
    await expect(requestCameraAccess()).resolves.toBe("refused");
    expect(reqPerm).toHaveBeenCalledTimes(1);
  });

  it("does NOT open a second system prompt in the same session", async () => {
    getPerm.mockResolvedValue(perm(false, true));
    reqPerm.mockResolvedValue(perm(false, true));

    await requestCameraAccess();
    await requestCameraAccess();
    await requestCameraAccess();

    // The whole point: one prompt per session. Re-prompting on every tap is the
    // nag loop; the caller explains and offers the library instead.
    expect(reqPerm).toHaveBeenCalledTimes(1);
  });

  it("reports blocked — not refused — once Android stops asking", async () => {
    // getCameraPermissionsAsync already says canAskAgain === false, so no prompt
    // is even possible.
    getPerm.mockResolvedValue(perm(false, false));
    await expect(requestCameraAccess()).resolves.toBe("blocked");
    expect(reqPerm).not.toHaveBeenCalled();
  });

  it("reports blocked when the prompt itself comes back with canAskAgain false", async () => {
    getPerm.mockResolvedValue(perm(false, true));
    reqPerm.mockResolvedValue(perm(false, false));
    await expect(requestCameraAccess()).resolves.toBe("blocked");
    expect(reqPerm).toHaveBeenCalledTimes(1);
  });

  it("never throws when the native module fails — a throw must not read as a refusal the user caused", async () => {
    getPerm.mockRejectedValue(new Error("native module missing"));
    await expect(requestCameraAccess()).resolves.toBe("blocked");
  });
});
