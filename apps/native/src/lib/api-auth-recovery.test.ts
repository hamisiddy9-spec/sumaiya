/**
 * The 401 recovery path.
 *
 * Measured failure (HLTE272E, 1.6.15, signed in): the CV list said "we just
 * couldn't reach the server" and stayed that way through every tap of Try
 * again. The request had reached the server; the server had refused it. The
 * window that makes this ordinary: `auth-context` pushes the access token in
 * AFTER `supabase.auth.getSession()` resolves, while the first screen's fetch
 * has already gone out with no Authorization header.
 *
 * These assertions pin the contract: retry once with a recovered token, never
 * more than once, never for non-auth failures, and always label the failure so
 * the UI can stop blaming the network.
 */
import { ApiClient, ApiError } from "@sumaiya/api-client";

const ISO = "2026-09-15T09:00:00.000Z";
const CV_ROW = {
  id: "cv_1",
  userId: "u1",
  templateId: "t1",
  title: "CV",
  data: {},
  createdAt: ISO,
  updatedAt: ISO,
};

function jsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    text: async () => JSON.stringify(payload),
  };
}

describe("ApiClient token recovery on 401", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("refreshes the token and retries once, so the cold-start race is invisible", async () => {
    const seenAuth: (string | undefined)[] = [];
    global.fetch = jest.fn(async (_url: unknown, init: RequestInit) => {
      seenAuth.push((init.headers as Record<string, string> | undefined)?.Authorization);
      if (seenAuth.length === 1) return jsonResponse(401, { error: "Unauthorized" });
      return jsonResponse(200, { success: true, data: [CV_ROW] });
    }) as unknown as typeof fetch;

    const client = new ApiClient({ baseUrl: "https://example.test", retryAttempts: 1 });
    const refresh = jest.fn(async () => {
      client.setAccessToken("fresh-token");
      return true;
    });
    client.setRefreshAuth(refresh);

    const cvs = await client.listCVs();

    expect(cvs).toHaveLength(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    // First attempt genuinely had no token — the race this fixes…
    expect(seenAuth[0]).toBeUndefined();
    // …and the retry carried the recovered one.
    expect(seenAuth[1]).toBe("Bearer fresh-token");
  });

  it("retries only once, then reports unauthorized — never a connection problem", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(401, { error: "Unauthorized" }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new ApiClient({ baseUrl: "https://example.test", retryAttempts: 1 });
    const refresh = jest.fn(async () => false); // no session left to recover
    client.setRefreshAuth(refresh);

    await expect(client.listCVs()).rejects.toMatchObject({ status: 401, kind: "unauthorized" });
    // No refresh possible → no retry: one request, one claim about the world.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("labels a 401 unauthorized even with no recovery handler wired", async () => {
    global.fetch = jest.fn(async () => jsonResponse(401, { error: "Unauthorized" })) as unknown as typeof fetch;
    const client = new ApiClient({ baseUrl: "https://example.test", retryAttempts: 1 });

    const err = await client.listCVs().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).kind).toBe("unauthorized");
  });

  it("does not refresh or retry failures that are not auth", async () => {
    const fetchMock = jest.fn(async () => jsonResponse(500, { error: "boom" }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new ApiClient({ baseUrl: "https://example.test", retryAttempts: 1 });
    const refresh = jest.fn(async () => true);
    client.setRefreshAuth(refresh);

    await expect(client.listCVs()).rejects.toMatchObject({ status: 500 });
    expect(refresh).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
