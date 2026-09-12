const mockOpenURL = jest.fn();
jest.mock("react-native", () => ({ Linking: { openURL: (...a: unknown[]) => mockOpenURL(...a) } }));

const mockAlert = jest.fn();
jest.mock("../components/ui", () => ({
  dialog: { alert: (...a: unknown[]) => mockAlert(...a) },
  haptics: { light: jest.fn() },
}));

import { confirmAndOpenUrl } from "./external-link";

const t = (en: string, _sw: string) => en;

describe("confirmAndOpenUrl", () => {
  beforeEach(() => {
    mockOpenURL.mockClear();
    mockAlert.mockClear();
    mockOpenURL.mockResolvedValue(undefined);
  });

  it("does not open the URL until the user confirms", () => {
    confirmAndOpenUrl("https://example.com", t);
    expect(mockOpenURL).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalledTimes(1);
  });

  it("opens the URL only when the Continue button is pressed", () => {
    confirmAndOpenUrl("https://example.com", t);
    const buttons = mockAlert.mock.calls[0][2] as { text: string; onPress?: () => void }[];
    const cancel = buttons.find((b) => b.text === "Cancel");
    const cont = buttons.find((b) => b.text === "Continue");
    expect(cancel?.onPress).toBeUndefined();
    cont?.onPress?.();
    expect(mockOpenURL).toHaveBeenCalledWith("https://example.com");
  });
});
