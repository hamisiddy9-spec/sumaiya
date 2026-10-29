/**
 * PayMe Africa client — request signing, the Collection (mobile-money) call,
 * and webhook signature verification.
 *
 * The product once integrated PayMe inside the TemplateHub app; that code was
 * retired and never lived in this repo. This is a fresh, self-contained client
 * built to the documented contract:
 *
 *   base URL  : https://portal.paymeafrica.com/api/v1   (PAYME_BASE_URL overrides)
 *   headers   : X-App-ID, X-Signature, X-Timestamp
 *   signature : HMAC-SHA256(secret, <base>) as base64, where <base> combines the
 *               minified JSON body and the unix timestamp.
 *   collection: POST /transact with { action:"collection", amount, msisdn,
 *               reference, currency, callback_url }
 *               (endpoint + response shape confirmed against the sandbox:
 *                201, top-level status:"success" = request accepted,
 *                payment_status:"PENDING" = settle later via webhook,
 *                transaction_id at top level, our ref in provider_response).
 *
 * THE ONE UNKNOWN — how PayMe orders the signature base — is kept behind
 * PAYME_SIG_MODE so confirming it against the portal's Integration Lab is a
 * one-line env change, not a code change:
 *   body_ts      (default) : HMAC(secret, minifiedBody + timestamp)
 *   ts_body                : HMAC(secret, timestamp + minifiedBody)
 *   body_dot_ts            : HMAC(secret, minifiedBody + "." + timestamp)
 * Run one sandbox Collection in the lab, compare its expected X-Signature with
 * `debugSignatures()` below, and set PAYME_SIG_MODE to whichever matches.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export type SigMode = "body_ts" | "ts_body" | "body_dot_ts";

const SIG_MODES: readonly SigMode[] = ["body_ts", "ts_body", "body_dot_ts"];

export interface PaymeConfig {
  appId: string;
  secret: string;
  baseUrl: string;
  sandbox: boolean;
  sigMode: SigMode;
}

type Env = Record<string, string | undefined>;

/** True when the server switch is on. Separate from NEXT_PUBLIC_PAYMENTS_ENABLED
 *  (the UI switch) so the API can be tested while checkout stays hidden. */
export function paymentsEnabled(env: Env = process.env): boolean {
  return env.PAYMENTS_ENABLED === "true";
}

/** Reads the PayMe config, or null when credentials are absent (so a missing
 *  key is a clean 503 "not configured", never a half-signed request). */
export function readPaymeConfig(env: Env = process.env): PaymeConfig | null {
  const appId = (env.PAYME_APP_ID || "").trim();
  const secret = (env.PAYME_APP_SECRET || "").trim();
  if (!appId || !secret) return null;

  // An override only counts when it is a real http(s) URL: a blank or "/" value
  // in the host env would otherwise yield "/transact" (no host) and every charge
  // would die with "Failed to parse URL".
  const override = (env.PAYME_BASE_URL || "").trim().replace(/\/+$/, "");
  const baseUrl = /^https?:\/\/[^/]/i.test(override)
    ? override
    : "https://portal.paymeafrica.com/api/v1";
  const sandbox = env.PAYME_SANDBOX === "1" || env.PAYME_SANDBOX === "true";
  const mode = (env.PAYME_SIG_MODE || "").trim() as SigMode;
  const sigMode = SIG_MODES.includes(mode) ? mode : "body_ts";

  return { appId, secret, baseUrl, sandbox, sigMode };
}

/** Minified JSON — the exact bytes that get both signed and sent. JSON.stringify
 *  has no insignificant whitespace, so it is already minified; this names the
 *  intent and keys the output to insertion order, which is what we sign. */
export function minifyBody(body: Record<string, unknown>): string {
  return JSON.stringify(body);
}

/** The string that gets HMAC'd, per the selected mode. */
export function signatureBase(mode: SigMode, minifiedBody: string, timestamp: string): string {
  switch (mode) {
    case "ts_body":
      return timestamp + minifiedBody;
    case "body_dot_ts":
      return `${minifiedBody}.${timestamp}`;
    case "body_ts":
    default:
      return minifiedBody + timestamp;
  }
}

/** base64 HMAC-SHA256 of an arbitrary base string. */
export function hmac(secret: string, base: string): string {
  return createHmac("sha256", secret).update(base).digest("base64");
}

/** The X-Signature for a request body + timestamp under a config. */
export function signRequest(cfg: PaymeConfig, minifiedBody: string, timestamp: string): string {
  return hmac(cfg.secret, signatureBase(cfg.sigMode, minifiedBody, timestamp));
}

/**
 * All three candidate signatures for a body+timestamp — a debugging aid for
 * confirming PAYME_SIG_MODE against the Integration Lab's expected value.
 */
export function debugSignatures(
  secret: string,
  minifiedBody: string,
  timestamp: string,
): Record<SigMode, string> {
  return {
    body_ts: hmac(secret, signatureBase("body_ts", minifiedBody, timestamp)),
    ts_body: hmac(secret, signatureBase("ts_body", minifiedBody, timestamp)),
    body_dot_ts: hmac(secret, signatureBase("body_dot_ts", minifiedBody, timestamp)),
  };
}

export interface CollectionInput {
  /** Minor units of `currency` (whole TZS). */
  amount: number;
  /** 2557XXXXXXXX — already normalized (see lib/payments/plans.ts). */
  msisdn: string;
  /** Our merchant reference, echoed back on the webhook. */
  reference: string;
  currency: string;
  /** Where PayMe posts the result; omitted → provider's dashboard default. */
  callbackUrl?: string;
}

export interface CollectionResult {
  ok: boolean;
  status: number;
  raw: unknown;
}

/** Fire a mobile-money collection. Network/parse failures throw; an HTTP error
 *  from PayMe comes back as `{ ok:false, status, raw }` for the caller to map. */
export async function collection(
  cfg: PaymeConfig,
  input: CollectionInput,
): Promise<CollectionResult> {
  const bodyWith = (withCallback: boolean): Record<string, unknown> => ({
    action: "collection",
    amount: input.amount,
    msisdn: input.msisdn,
    reference: input.reference,
    currency: input.currency,
    ...(withCallback && input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
  });

  // PayMe documents the formula (HMAC-SHA256(minifiedBody + timestamp), base64,
  // timestamp in unix SECONDS — milliseconds come back "Request Expired") but not
  // what "minified" means byte-for-byte. Their examples are PHP, whose
  // json_encode escapes "/" as "\/", and our callback_url is full of slashes. So
  // when PayMe answers 401 (signature rejected — nothing is charged) try the
  // plausible variants in turn, stop at the first accepted one, and log it so it
  // can be pinned.
  const others = SIG_MODES.filter((m) => m !== cfg.sigMode);
  const variants: SignVariant[] = [
    { name: "plain", mode: cfg.sigMode, escapeSlashes: false, sendEscaped: false, withCallback: true },
    { name: "sign-escaped-slashes", mode: cfg.sigMode, escapeSlashes: true, sendEscaped: false, withCallback: true },
    { name: "send+sign-escaped-slashes", mode: cfg.sigMode, escapeSlashes: true, sendEscaped: true, withCallback: true },
    { name: "no-callback-url", mode: cfg.sigMode, escapeSlashes: false, sendEscaped: false, withCallback: false },
    ...others.map((mode): SignVariant => ({ name: `mode-${mode}`, mode, escapeSlashes: false, sendEscaped: false, withCallback: true })),
  ];

  let last: CollectionResult = { ok: false, status: 0, raw: null };
  for (const v of variants) {
    last = await postCollection({ ...cfg, sigMode: v.mode }, v, minifyBody(bodyWith(v.withCallback)));
    if (last.status !== 401) {
      if (last.ok && v.name !== "plain") console.warn(`[payme] signature variant "${v.name}" accepted — pin it (configured mode: ${cfg.sigMode})`);
      return last;
    }
  }
  return last;
}

interface SignVariant {
  name: string;
  mode: SigMode;
  escapeSlashes: boolean;
  sendEscaped: boolean;
  withCallback: boolean;
}

async function postCollection(
  cfg: PaymeConfig,
  v: SignVariant,
  minified: string,
): Promise<CollectionResult> {
  const escaped = minified.replace(/\//g, "\\/");
  const signed = v.escapeSlashes ? escaped : minified;
  const sent = v.sendEscaped ? escaped : minified;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const res = await fetch(`${cfg.baseUrl}/transact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-ID": cfg.appId,
      "X-Signature": signRequest(cfg, signed, timestamp),
      "X-Timestamp": timestamp,
      ...(cfg.sandbox ? { "X-Sandbox": "1" } : {}),
    },
    body: sent,
  });

  let raw: unknown = null;
  try {
    raw = await res.json();
  } catch {
    try {
      raw = await res.text();
    } catch {
      raw = null;
    }
  }
  return { ok: res.ok, status: res.status, raw };
}

/** Constant-time string compare that never throws on a length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Verify a webhook. Per PayMe's docs the signature is
 * Base64(HMAC-SHA256(rawBody + X-Timestamp, secret)) in `X-Middleware-Signature`
 * (falling back to `X-Signature`). When the callback carries no timestamp the
 * body alone is checked, the earlier assumption. Returns false for a
 * missing/mismatched signature so an unverified callback can never provision
 * Premium.
 */
export function verifyWebhook(
  cfg: PaymeConfig,
  rawBody: string,
  signatureHeader: string | null | undefined,
  timestamp?: string | null,
): boolean {
  if (!signatureHeader) return false;
  const sig = signatureHeader.trim();
  const ts = (timestamp ?? "").trim();
  if (ts && safeEqual(hmac(cfg.secret, rawBody + ts), sig)) return true;
  return safeEqual(hmac(cfg.secret, rawBody), sig);
}

// ─── Response parsing (shapes confirmed against the sandbox) ─────────────────

export interface ParsedCollection {
  /** The provider accepted the request (top-level status:"success"). */
  accepted: boolean;
  /** PENDING / SUCCESS / FAILED — uppercase, as the provider sends it. */
  paymentStatus: string;
  /** PayMe's transaction id (top-level transaction_id, else provider transid). */
  providerTxnId: string | null;
}

/** Reads the /transact response. The sandbox returns 201 with
 *  `{ status:"success", payment_status:"PENDING", transaction_id,
 *     provider_response:{ result, transid, reference, order_id } }`. */
export function parseCollectionResponse(raw: unknown): ParsedCollection {
  const o = (raw ?? {}) as Record<string, unknown>;
  const pr = (o.provider_response ?? {}) as Record<string, unknown>;
  const accepted = String(o.status ?? "").toLowerCase() === "success";
  const paymentStatus = String(o.payment_status ?? pr.result ?? "").toUpperCase();
  const txn = o.transaction_id ?? pr.transid ?? null;
  return { accepted, paymentStatus, providerTxnId: txn != null ? String(txn) : null };
}

export interface ParsedWebhook {
  reference: string | null;
  paid: boolean;
  failed: boolean;
  providerTxnId: string | null;
}

const PAID_STATES = new Set(["SUCCESS", "COMPLETED", "PAID"]);
const FAILED_STATES = new Set(["FAILED", "FAILURE", "CANCELLED", "CANCELED", "DECLINED", "REVERSED"]);

/**
 * Reads a settlement webhook. The state lives in `payment_status` (or the
 * provider block's `result`); the top-level `status` is only "request accepted"
 * on the collection response, so it is the last fallback. A PENDING state is
 * neither paid nor failed — the caller must leave the payment untouched, not
 * mark it failed.
 */
export function parseWebhook(payload: Record<string, unknown>): ParsedWebhook {
  const pr = (payload.provider_response ?? {}) as Record<string, unknown>;
  const reference =
    String(
      payload.reference ?? payload.order_id ?? payload.reference_id ?? payload.ref ?? pr.reference ?? pr.order_id ?? "",
    ) || null;
  const state = String(payload.payment_status ?? pr.result ?? payload.status ?? "").toUpperCase();
  const txn = payload.transaction_id ?? pr.transid ?? payload.transid ?? null;
  return {
    reference,
    paid: PAID_STATES.has(state),
    failed: FAILED_STATES.has(state),
    providerTxnId: txn != null ? String(txn) : null,
  };
}
