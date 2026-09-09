// Unit tests for the D4 server-side share token — deterministic, node-only.
//
// These assert the PII contract: a minted token serializes to exactly
// { v, s, j, l, iat } — score + sanitized title + language — and nothing
// else, and a tampered/expired/malformed token never verifies.

import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  buildSnapShareToken,
  parseSnapShareToken,
  SNAP_SHARE_TTL_MS,
  SNAP_SHARE_VERSION,
} from "@/lib/api/snap-share";

describe("buildSnapShareToken", () => {
  it("mints a signed token that round-trips", () => {
    const token = buildSnapShareToken({ score: 87, jobTitle: "Sales Manager", lang: "en" });
    const payload = parseSnapShareToken(token);
    expect(payload).not.toBeNull();
    expect(payload).toMatchObject({ v: SNAP_SHARE_VERSION, s: 87, j: "Sales Manager", l: "en" });
  });

  it("clamps the score into 0–100", () => {
    expect(parseSnapShareToken(buildSnapShareToken({ score: 250, jobTitle: "", lang: "en" }))?.s).toBe(100);
    expect(parseSnapShareToken(buildSnapShareToken({ score: -5, jobTitle: "", lang: "en" }))?.s).toBe(0);
    expect(parseSnapShareToken(buildSnapShareToken({ score: 87.6, jobTitle: "", lang: "en" }))?.s).toBe(88);
  });

  it("normalizes the language", () => {
    expect(parseSnapShareToken(buildSnapShareToken({ score: 50, jobTitle: "", lang: "sw" }))?.l).toBe("sw");
    expect(parseSnapShareToken(buildSnapShareToken({ score: 50, jobTitle: "", lang: "en" }))?.l).toBe("en");
  });

  it("sanitizes the job title before it enters the token", () => {
    const token = buildSnapShareToken({
      score: 70,
      jobTitle: "Sales https://evil.example/x lead me@example.com",
      lang: "en",
    });
    const payload = parseSnapShareToken(token);
    expect(payload?.j).toBe("Sales lead");
  });

  it("never serializes CV text or PII fields into the token", () => {
    const token = buildSnapShareToken({ score: 91, jobTitle: "Engineer", lang: "sw" });
    const decoded = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"));
    expect(Object.keys(decoded).sort()).toEqual(["iat", "j", "l", "s", "v"]);
    expect(decoded).not.toHaveProperty("cv");
    expect(decoded).not.toHaveProperty("name");
    expect(decoded).not.toHaveProperty("email");
    expect(decoded).not.toHaveProperty("phone");
    expect(decoded).not.toHaveProperty("coverLetter");
  });
});

describe("parseSnapShareToken", () => {
  it("returns null for empty/garbage input", () => {
    expect(parseSnapShareToken("")).toBeNull();
    expect(parseSnapShareToken("   ")).toBeNull();
    expect(parseSnapShareToken("not-a-token")).toBeNull();
    expect(parseSnapShareToken("a.b")).toBeNull(); // not JSON payload
  });

  it("rejects a tampered signature", () => {
    const token = buildSnapShareToken({ score: 80, jobTitle: "Engineer", lang: "en" });
    const [payloadB64, sig] = token.split(".");
    const forged = `${payloadB64}.${sig.slice(0, -1)}${sig.endsWith("a") ? "b" : "a"}`;
    expect(parseSnapShareToken(forged)).toBeNull();
  });

  it("rejects a re-signed payload with different content (no forgery)", () => {
    const token = buildSnapShareToken({ score: 80, jobTitle: "Engineer", lang: "en" });
    const [payloadB64] = token.split(".");
    const altPayload = Buffer.from(JSON.stringify({ v: 1, s: 99, j: "Fake", l: "en", iat: Date.now() })).toString("base64url");
    const altToken = `${altPayload}.${token.split(".")[1]}`;
    expect(parseSnapShareToken(altToken)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = buildSnapShareToken({ score: 60, jobTitle: "", lang: "en" });
    const now = Date.now() + SNAP_SHARE_TTL_MS + 1;
    expect(parseSnapShareToken(token, now)).toBeNull();
  });

  it("accepts a token just inside the TTL", () => {
    const token = buildSnapShareToken({ score: 60, jobTitle: "", lang: "en" });
    const now = Date.now() + SNAP_SHARE_TTL_MS - 1;
    expect(parseSnapShareToken(token, now)).not.toBeNull();
  });

  it("rejects a token minted in the future (clock skew)", () => {
    const token = buildSnapShareToken({ score: 60, jobTitle: "", lang: "en" });
    const now = Date.now() - 120_000; // token iat is 2min in the future
    expect(parseSnapShareToken(token, now)).toBeNull();
  });

  it("rejects wrong-version payloads", () => {
    const token = buildSnapShareToken({ score: 60, jobTitle: "", lang: "en" });
    const [payloadB64, sig] = token.split(".");
    const parsed = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    parsed.v = 999;
    const badPayload = Buffer.from(JSON.stringify(parsed)).toString("base64url");
    // Can't reuse the signature (it signs the payload) — forge the whole thing.
    const badSig = createHmac("sha256", "th-snap-share-dev-secret").update(badPayload).digest("base64url");
    expect(parseSnapShareToken(`${badPayload}.${badSig}`)).toBeNull();
  });
});
