import { friendlyApiError, friendlyImportError, isTransportError } from "./app-errors";
import { SUPPORT_EMAIL } from "./app-hosts";

/**
 * These are the strings a user reads at the moment something has already gone
 * wrong, on a screen that is otherwise Swahili. Two rules are asserted over and
 * over below, because both were violated in the code this replaces:
 *
 *   1. `message` NEVER reaches the user. On this codebase it is English
 *      hard-coded in @sumaiya/api-client ("Network error. Check your
 *      connection."), or a bare HTTP status line ("500 Internal Server
 *      Error") used as the message when the server sends no `error` field.
 *   2. No branch accuses the user's connection for a fault that is ours.
 *
 * The statuses and messages below are the real ones, taken from
 * packages/api-client/src/index.ts.
 */

/** What api-client actually builds when the fetch itself fails. */
const REAL_NETWORK_ERROR = { status: 0, kind: "network" as const, message: "Network error. Check your connection." };
/** What it builds when WE abort — the request may still be running server-side. */
const REAL_TIMEOUT_ERROR = { status: 0, kind: "timeout" as const, message: "Request timed out. Check your connection." };
/** What it builds when the response has no `error` field: `${status} ${statusText}`. */
const REAL_500_ERROR = { status: 500, message: "500 Internal Server Error" };

const LANGS = ["en", "sw"] as const;

describe("isTransportError", () => {
  it("recognises the api-client shape", () => {
    expect(isTransportError(REAL_NETWORK_ERROR)).toBe(true);
    expect(isTransportError(REAL_500_ERROR)).toBe(true);
  });

  it("rejects things that are not transport errors", () => {
    for (const v of [null, undefined, "boom", 500, new Error("boom"), {}, { kind: "network" }]) {
      expect(isTransportError(v)).toBe(false);
    }
  });
});

describe("friendlyApiError never leaks the transport's own message", () => {
  it("does not echo any of the real api-client strings", () => {
    const leaked = [/Network error/, /Request timed out/, /Check your connection/, /500/, /Internal Server Error/];
    for (const err of [REAL_NETWORK_ERROR, REAL_TIMEOUT_ERROR, REAL_500_ERROR]) {
      for (const lang of LANGS) {
        const msg = friendlyApiError(err, lang);
        for (const pattern of leaked) {
          expect(msg).not.toMatch(pattern);
        }
      }
    }
  });

  it("does not echo an unknown status's status line", () => {
    const msg = friendlyApiError({ status: 418, message: "418 I'm a teapot" }, "en");
    expect(msg).not.toMatch(/418|teapot/i);
  });

  it("does not echo a non-transport Error's message when no fallback is given", () => {
    // An unrecognised throw must not be rendered: its message is exactly the
    // raw string this module exists to stop showing.
    const msg = friendlyApiError(new Error("TypeError: undefined is not a function"), "sw");
    expect(msg).not.toMatch(/TypeError|undefined is not a function/);
    expect(msg).toContain(SUPPORT_EMAIL);
  });
});

describe("friendlyApiError keeps status and kind apart", () => {
  it("tells a local timeout from a dead connection, because the advice differs", () => {
    const timeout = friendlyApiError(REAL_TIMEOUT_ERROR, "en");
    const network = friendlyApiError(REAL_NETWORK_ERROR, "en");
    expect(timeout).not.toBe(network);
    // Our abort: the work may still be finishing, so we must not imply it failed.
    expect(timeout).toMatch(/still be finishing/i);
    // A real transport failure: the connection is the actionable thing.
    expect(network).toMatch(/internet connection/i);
  });

  it("does not blame the connection for a status 0 timeout", () => {
    expect(friendlyApiError(REAL_TIMEOUT_ERROR, "sw")).not.toMatch(/mtandao/);
  });

  it("names the status family correctly across the range", () => {
    const byStatus = (status: number, lang: "en" | "sw" = "en") =>
      friendlyApiError({ status, message: `${status} Something` }, lang);

    expect(byStatus(401)).toMatch(/session has expired/i);
    expect(byStatus(403)).toMatch(/access/i);
    expect(byStatus(404)).toMatch(/any more/i);
    expect(byStatus(413)).toMatch(/too large/i);
    expect(byStatus(429)).toMatch(/wait a minute/i);
    expect(byStatus(503)).toMatch(/busy right now/i);
    expect(byStatus(502)).toMatch(/busy right now/i);
    expect(byStatus(504)).toMatch(/busy right now/i);
  });

  it("offers a retry for a transient 5xx but pairs a persistent 500 with a way to reach us", () => {
    // 503 is a flake; "try again" is honest.
    expect(friendlyApiError({ status: 503, message: "x" }, "en")).not.toContain(SUPPORT_EMAIL);
    // 500 is ours; a retry alone is a promise we may not keep.
    expect(friendlyApiError(REAL_500_ERROR, "en")).toContain(SUPPORT_EMAIL);
  });
});

describe("friendlyApiError is localised into the persona's voice", () => {
  it("answers in Swahili for sw, with no English left in it", () => {
    for (const err of [REAL_NETWORK_ERROR, REAL_TIMEOUT_ERROR, REAL_500_ERROR, { status: 401, message: "x" }]) {
      const sw = friendlyApiError(err, "sw");
      expect(sw).not.toMatch(/check your|try again|connection|expired/i);
    }
  });

  it("takes the blame in the first person, never the machine register", () => {
    const sw = friendlyApiError(REAL_NETWORK_ERROR, "sw");
    expect(sw).toMatch(/^Sikuweza/);
    expect(sw).not.toMatch(/\b(Imeshindwa|Inashindwa|imeshindwa)\b/);
  });
});

describe("friendlyApiError honours a caller's fallback for non-transport throws", () => {
  it("uses the fallback when the error is not a transport error", () => {
    const fallback = { en: "I couldn't build the CV just now.", sw: "Sikuweza kutengeneza CV sasa." };
    expect(friendlyApiError(new Error("kaboom"), "en", fallback)).toBe(fallback.en);
    expect(friendlyApiError(new Error("kaboom"), "sw", fallback)).toBe(fallback.sw);
  });

  it("ignores the fallback when it IS a transport error, so screens cannot hand-roll it", () => {
    const fallback = { en: "custom", sw: "custom-sw" };
    expect(friendlyApiError(REAL_500_ERROR, "en", fallback)).not.toBe("custom");
    expect(friendlyApiError(REAL_500_ERROR, "en", fallback)).toContain(SUPPORT_EMAIL);
  });
});

/**
 * The import path's own copy. The device measured the 502/503/504 class as the
 * ONLY failure the CV import produces (four runs: ~75 s and ~75 s on 2026-09-20,
 * ~62 s and ~70 s on 2026-09-21), and the shared mapper answered it with the
 * transient "I'm busy right now. Try again in a moment." — which says nothing
 * about the photo and invites a retry that had already failed twice on the same
 * input. These tests pin the difference, and pin that everything else still
 * comes from the shared mapper.
 */
describe("friendlyImportError names the condition the import actually hits", () => {
  const BUSY = "I'm busy right now. Try again in a moment.";
  const BUSY_SW = "Nina shughuli nyingi sasa hivi. Jaribu tena baada ya muda mfupi.";

  it("does NOT use the transient busy line for a 502/503/504", () => {
    for (const status of [502, 503, 504]) {
      const en = friendlyImportError({ status, message: `${status} Bad Gateway` }, "en");
      expect(en).not.toBe(BUSY);
      expect(en).toContain("couldn't finish reading that photo");
      const sw = friendlyImportError({ status, message: `${status} Bad Gateway` }, "sw");
      expect(sw).not.toBe(BUSY_SW);
      expect(sw).toMatch(/^Sikuweza/);
    }
  });

  it("says the same thing for a timeout the client hit first", () => {
    expect(friendlyImportError(REAL_TIMEOUT_ERROR, "en")).toContain("couldn't finish reading that photo");
    expect(friendlyImportError(REAL_TIMEOUT_ERROR, "sw")).toMatch(/^Sikuweza/);
  });

  it("takes the blame rather than blaming the reader's network", () => {
    expect(friendlyImportError({ status: 504, message: "504 Gateway Timeout" }, "en")).toContain("on my side");
    expect(friendlyImportError({ status: 504, message: "504 Gateway Timeout" }, "sw")).toContain("upande wangu");
    for (const lang of LANGS) {
      const copy = friendlyImportError(REAL_TIMEOUT_ERROR, lang);
      expect(copy).not.toMatch(/\bImeshindwa\b/);
      // The client's generic timeout text is English and must never surface.
      expect(copy).not.toContain("Request timed out");
    }
  });

  it("keeps the honest cases on the shared mapper", () => {
    // A 401 is a session problem the import cannot fix by re-photographing.
    expect(friendlyImportError({ status: 401 }, "sw")).toContain("Kipindi chako kimeisha");
    expect(friendlyImportError({ status: 413 }, "en")).toContain("too large");
    // A non-transport throw still gets the generic, never its own message.
    expect(friendlyImportError(new Error("boom"), "en")).toContain(SUPPORT_EMAIL);
  });
});
