import { rawIsOnline, resolveOnline, probeBackend } from "./connectivity";

/**
 * These cover the "offline" banner that lied to a real user on a perfectly
 * healthy Wi-Fi connection (validated network, backend reachable). The cause is
 * that expo-network reports isInternetReachable=false unless Android's own
 * validation probe has completed AND the radio is not suspended — states in
 * which our backend answers fine.
 */
describe("rawIsOnline — what the platform reports", () => {
  it("treats an unanswered first tick as online (no cold-start flash)", () => {
    expect(rawIsOnline({})).toBe(true);
  });

  it("reflects a definite reachable reading", () => {
    expect(rawIsOnline({ isInternetReachable: true })).toBe(true);
    expect(rawIsOnline({ isInternetReachable: false })).toBe(false);
  });

  it("falls back to isConnected when reachability is unknown", () => {
    expect(rawIsOnline({ isConnected: true })).toBe(true);
    expect(rawIsOnline({ isConnected: false })).toBe(false);
    // Reachability is the stronger signal when both are present.
    expect(rawIsOnline({ isInternetReachable: true, isConnected: false })).toBe(true);
  });
});

describe("resolveOnline — the decision", () => {
  it("trusts the platform when it says we are reachable", () => {
    expect(resolveOnline({ isInternetReachable: true }, null)).toBe(true);
  });

  it("believes the backend over the platform's false negative", () => {
    // The production bug: platform says offline, our API answers 200.
    expect(resolveOnline({ isInternetReachable: false }, true)).toBe(true);
  });

  it("reports offline only when the backend is genuinely unreachable", () => {
    expect(resolveOnline({ isInternetReachable: false }, false)).toBe(false);
  });

  it("does not claim offline when the probe has not run", () => {
    expect(resolveOnline({ isInternetReachable: false }, null)).toBe(false);
  });

  it("never shows the banner while the platform still says reachable", () => {
    // Even a failed probe cannot flip a reachable reading to offline.
    expect(resolveOnline({ isInternetReachable: true }, false)).toBe(true);
  });
});

describe("probeBackend", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("is true when the backend answers 200", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    await expect(probeBackend()).resolves.toBe(true);
  });

  it("is false on a non-2xx answer", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false } as Response);
    await expect(probeBackend()).resolves.toBe(false);
  });

  it("is false when the request throws (no route, DNS failure)", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network request failed"));
    await expect(probeBackend()).resolves.toBe(false);
  });

  it("asks our own health endpoint, not a third party", async () => {
    const spy = jest.fn().mockResolvedValue({ ok: true } as Response);
    global.fetch = spy;
    await probeBackend();
    expect(spy.mock.calls[0][0]).toMatch(/\/api\/health$/);
  });
});
