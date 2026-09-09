// Snap-to-Apply (D4) — "Made with Sumaiya" share tokens (server-only).
//
// The viral hook lets a user share their snap result as a public link. The
// hard rule: the shared artifact NEVER carries PII. Unlike the snap response
// (which contains the user's tailored CV, cover letter and match details),
// a share token is built server-side from ONLY three fields:
//   • s — the ATS match score (0–100) — the hook
//   • j — a SANITIZED job title ("" if none) — the only JD-derived content,
//         and only because a role title is what makes a shared card readable
//   • l — the language the result was generated in
// No CV text, no names, no employers, no matched/missing keyword lists, no
// requirements, no cover letter — nothing else survives into the token.
//
// The token is signed (HMAC-SHA256) so a public URL can never be forged into
// arbitrary content: only tokens we minted render on the share page. Signed
// + self-contained means no DB writes and no lookups (serverless-friendly),
// at the cost of a hard expiry (90 days) so stale links die on their own.
//
// Server-only module (node:crypto) — never import from client code. The
// client-safe helpers live in lib/snap-share.ts.

import { createHmac, timingSafeEqual } from "node:crypto";
import { sanitizeShareTitle } from "@/lib/snap-share";

export const SNAP_SHARE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
export const SNAP_SHARE_VERSION = 1 as const;

/** The ONLY fields that ever leave the server in a share artifact. */
export interface SnapSharePayload {
  v: typeof SNAP_SHARE_VERSION;
  /** ATS match score after tailoring (0–100), from the real engine. */
  s: number;
  /** Sanitized job title (may be ""). Never raw JD text. */
  j: string;
  l: "en" | "sw";
  /** Issued-at epoch ms — drives the hard expiry. */
  iat: number;
}

// Production value comes from env (Vercel). The dev fallback keeps tests and
// local builds deterministic without a .env.local; it is NOT intended for
// production — ops should set SNAP_SHARE_SECRET (same class of env as
// OUTCOME_SALT). Worst case with the fallback: a forgeable token renders a
// score + title card (no PII, no privileged data), so impact is spam-level,
// but prod must still set the secret.
const SECRET = process.env.SNAP_SHARE_SECRET || "th-snap-share-dev-secret";

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromB64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

/** Mint a signed, URL-safe share token from the PII-free payload. */
export function buildSnapShareToken(input: {
  score: number;
  jobTitle: string;
  lang: "en" | "sw";
}): string {
  const payload: SnapSharePayload = {
    v: SNAP_SHARE_VERSION,
    s: Math.max(0, Math.min(100, Math.round(input.score))),
    j: sanitizeShareTitle(input.jobTitle),
    l: input.lang === "sw" ? "sw" : "en",
    iat: Date.now(),
  };
  const payloadB64 = b64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verify a share token and return its payload, or null if it is malformed,
 * tampered with, or expired. Never throws.
 */
export function parseSnapShareToken(token: string, now: number = Date.now()): SnapSharePayload | null {
  if (typeof token !== "string" || !token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(payloadB64);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromB64url(payloadB64));
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const p = parsed as Record<string, unknown>;
  if (p.v !== SNAP_SHARE_VERSION) return null;
  if (typeof p.s !== "number" || !Number.isFinite(p.s) || p.s < 0 || p.s > 100) return null;
  if (typeof p.j !== "string" || p.j.length > 120) return null;
  if (p.l !== "en" && p.l !== "sw") return null;
  if (typeof p.iat !== "number" || !Number.isFinite(p.iat)) return null;
  // Hard expiry + clock-skew guard: links die after 90 days; a token minted
  // more than a minute in the future is rejected outright.
  if (now - p.iat > SNAP_SHARE_TTL_MS || p.iat > now + 60_000) return null;

  return { v: SNAP_SHARE_VERSION, s: p.s, j: p.j, l: p.l, iat: p.iat };
}
