const store: Record<string, string> = {};

jest.mock("@sumaiya/utils", () => ({
  getSecureItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
  setSecureItem: jest.fn(async (k: string, v: string) => {
    store[k] = v;
  }),
}));

import { getDefaultTemplate, setDefaultTemplate } from "./prefs";

describe("prefs — default CV template", () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k];
    jest.clearAllMocks();
  });

  it("defaults to 'classic' when nothing is stored", async () => {
    await expect(getDefaultTemplate()).resolves.toBe("classic");
  });

  it("round-trips a known template id", async () => {
    await setDefaultTemplate("modern");
    await expect(getDefaultTemplate()).resolves.toBe("modern");
  });

  it("falls back to 'classic' for an unknown / stale stored id", async () => {
    store["sumaiya_default_template"] = "neo-brutalist";
    await expect(getDefaultTemplate()).resolves.toBe("classic");
  });

  it("survives a throwing secure store", async () => {
    const { getSecureItem } = jest.requireMock("@sumaiya/utils");
    (getSecureItem as jest.Mock).mockRejectedValueOnce(new Error("keychain locked"));
    await expect(getDefaultTemplate()).resolves.toBe("classic");
  });
});
