/**
 * Regression guard for the bug that silently disabled ALL offline caching on
 * device — and which was misdiagnosed for two sessions as "the SQLite layer
 * fails to initialise".
 *
 * What actually happened: CVs come back over JSON from /api/cv with
 * `createdAt`/`updatedAt` as ISO **strings**, while the `CV` type declares them
 * as `Date`. Nothing converted them. So `offlineStorage.saveCVOffline` hit
 * `cv.createdAt.getTime()` and threw `TypeError: cv.createdAt.getTime is not a
 * function` on **every single write**. Consequences on the device:
 *
 *   - nothing was ever cached locally (the write always threw),
 *   - tapping Edit offline failed with "Couldn't open that CV",
 *   - the list came back empty on a cold start,
 *   - and the app had to admit "This device couldn't cache them".
 *
 * SQLite was never at fault. These assertions pin the coercion at the single
 * point every CV response passes through, so a wire string can never take
 * persistence down again.
 */
import { ApiClient } from "@sumaiya/api-client";
import type { CV } from "@sumaiya/types";

const ISO = "2026-09-12T05:58:02.165Z";

function stubFetch(payload: unknown) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(payload),
  });
}

describe("apiClient CV date coercion", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("turns wire ISO strings on createdAt/updatedAt into real Dates", async () => {
    global.fetch = stubFetch({
      success: true,
      data: [
        {
          id: "m_1",
          userId: "u1",
          templateId: "t1",
          title: "QA Sync Test",
          data: {},
          createdAt: ISO,
          updatedAt: ISO,
        },
      ],
    }) as unknown as typeof fetch;

    const client = new ApiClient({ baseUrl: "https://example.test" });
    const cvs: CV[] = await client.listCVs();

    expect(cvs).toHaveLength(1);
    // The declaration says Date — make the runtime agree with it.
    expect(cvs[0].createdAt).toBeInstanceOf(Date);
    expect(cvs[0].updatedAt).toBeInstanceOf(Date);
    expect(cvs[0].createdAt.toISOString()).toBe(ISO);
    // This is the exact call offlineStorage.saveCVOffline makes. It used to
    // throw here, which is what emptied the offline cache.
    expect(() => cvs[0].createdAt.getTime()).not.toThrow();
    expect(() => cvs[0].updatedAt.getTime()).not.toThrow();
  });

  it("keeps a real Date and tolerates a missing timestamp", async () => {
    global.fetch = stubFetch({
      success: true,
      data: [{ id: "m_2", userId: "u1", templateId: "t1", title: "No dates", data: {} }],
    }) as unknown as typeof fetch;

    const client = new ApiClient({ baseUrl: "https://example.test" });
    const cvs: CV[] = await client.listCVs();

    // Never undefined, never Invalid Date — getTime() must always work.
    expect(Number.isNaN(cvs[0].createdAt.getTime())).toBe(false);
    expect(Number.isNaN(cvs[0].updatedAt.getTime())).toBe(false);
  });
});
