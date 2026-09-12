// No jsdom needed — atob/btoa are plain Node globals, and this only tests
// the pure byte-conversion helper, not anything DOM/browser-API-shaped.
import { describe, it, expect } from "vitest";
import { urlBase64ToUint8Array } from "./push-client";

describe("urlBase64ToUint8Array (VAPID key conversion)", () => {
  it("round-trips a real-shaped VAPID public key (65 raw bytes, uncompressed EC point)", () => {
    // A genuine VAPID public key is 65 bytes starting with 0x04 (uncompressed
    // point). Build one, base64url-encode it (no padding, - and _ instead of
    // + and /), then confirm the decode recovers the exact original bytes.
    // A wrong decode here would silently corrupt every subscription's
    // applicationServerKey — no error, just a key nothing can ever push to.
    const original = new Uint8Array(65);
    original[0] = 0x04;
    for (let i = 1; i < 65; i++) original[i] = (i * 3 + 1) % 256; // deterministic filler, spans the byte range
    const std = btoa(String.fromCharCode(...original));
    const urlSafe = std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const decoded = urlBase64ToUint8Array(urlSafe);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it("handles keys needing each possible padding length (0, 1, 2 '=' chars)", () => {
    for (const len of [64, 65, 66]) {
      const bytes = new Uint8Array(len).map((_, i) => i % 256);
      const urlSafe = btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      expect(Array.from(urlBase64ToUint8Array(urlSafe))).toEqual(Array.from(bytes));
    }
  });

  it("correctly maps url-safe characters back to standard base64 (- -> +, _ -> /)", () => {
    // Pick bytes specifically chosen so the standard-base64 encoding is
    // known to contain '+' and '/' — proving the substitution actually runs,
    // not just a coincidentally-padding-free input.
    const bytes = new Uint8Array([251, 255, 191, 62, 63]); // encodes to "+/++Pj8" in standard base64
    const std = btoa(String.fromCharCode(...bytes));
    expect(std).toMatch(/[+/]/); // sanity: this fixture really exercises both chars
    const urlSafe = std.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(Array.from(urlBase64ToUint8Array(urlSafe))).toEqual(Array.from(bytes));
  });
});
