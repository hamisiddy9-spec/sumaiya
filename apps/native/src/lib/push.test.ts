const mockGetPermissions = jest.fn();
const mockGetToken = jest.fn();
const mockSetChannel = jest.fn();
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: (...a: unknown[]) => mockGetPermissions(...a),
  getExpoPushTokenAsync: (...a: unknown[]) => mockGetToken(...a),
  setNotificationChannelAsync: (...a: unknown[]) => mockSetChannel(...a),
  AndroidImportance: { DEFAULT: 3 },
}));

let mockProjectId: string | undefined;
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { extra: { eas: { projectId: mockProjectId } } };
    },
  },
}));

const mockRegisterPushToken = jest.fn();
jest.mock("./api-client", () => ({ apiClient: { registerPushToken: (...a: unknown[]) => mockRegisterPushToken(...a) } }));

jest.mock("@sumaiya/utils", () => ({
  getSecureItem: jest.fn().mockResolvedValue(null),
  setSecureItem: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("./reporting", () => ({ reportError: jest.fn() }));

import { isPushAvailable, registerForPush } from "./push";

describe("isPushAvailable", () => {
  it("is false with no EAS projectId", () => {
    mockProjectId = undefined;
    expect(isPushAvailable()).toBe(false);
  });

  it("is true once a projectId exists", () => {
    mockProjectId = "real-project-id";
    expect(isPushAvailable()).toBe(true);
  });
});

describe("registerForPush", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectId = "real-project-id";
    mockGetPermissions.mockResolvedValue({ granted: true });
    mockGetToken.mockResolvedValue({ data: "ExponentPushToken[abc]" });
  });

  it("no-ops without an EAS projectId — never even checks permission", async () => {
    mockProjectId = undefined;
    const ok = await registerForPush("user-1");
    expect(ok).toBe(false);
    expect(mockGetPermissions).not.toHaveBeenCalled();
  });

  it("no-ops when permission isn't granted — the exact case that used to strand the Profile toggle", async () => {
    mockGetPermissions.mockResolvedValue({ granted: false });
    const ok = await registerForPush("user-1");
    expect(ok).toBe(false);
    expect(mockRegisterPushToken).not.toHaveBeenCalled();
  });

  it("registers a token when permission is granted and a projectId exists", async () => {
    const ok = await registerForPush("user-1");
    expect(ok).toBe(true);
    expect(mockRegisterPushToken).toHaveBeenCalledWith(
      expect.objectContaining({ pushToken: "ExponentPushToken[abc]" }),
    );
  });
});
