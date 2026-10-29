import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import {
  readPaymeConfig,
  paymentsEnabled,
  minifyBody,
  signatureBase,
  hmac,
  signRequest,
  debugSignatures,
  verifyWebhook,
  safeEqual,
  parseCollectionResponse,
  parseWebhook,
  type PaymeConfig,
} from "./payme";
import { planAmount, normalizeTzMsisdn, PLANS, isPlanId } from "@/lib/payments/plans";

const cfg: PaymeConfig = {
  appId: "SUMAIYA_PROD_01",
  secret: "sandbox-secret",
  baseUrl: "https://portal.paymeafrica.com/api/v1",
  sandbox: true,
  sigMode: "body_ts",
};

describe("payme signing", () => {
  const body = minifyBody({ action: "collection", amount: 5000, msisdn: "255712345678", reference: "SUM-abc", currency: "TZS" });
  const ts = "1793179589";

  it("minifies with no whitespace", () => {
    expect(minifyBody({ a: 1, b: "x" })).toBe('{"a":1,"b":"x"}');
  });

  it("builds each signature base in the documented order", () => {
    expect(signatureBase("body_ts", body, ts)).toBe(body + ts);
    expect(signatureBase("ts_body", body, ts)).toBe(ts + body);
    expect(signatureBase("body_dot_ts", body, ts)).toBe(`${body}.${ts}`);
  });

  it("hmac matches a hand-computed HMAC-SHA256 base64", () => {
    const expected = createHmac("sha256", cfg.secret).update(body + ts).digest("base64");
    expect(hmac(cfg.secret, body + ts)).toBe(expected);
    expect(signRequest(cfg, body, ts)).toBe(expected);
  });

  it("signRequest follows the configured mode", () => {
    const tsBodyCfg = { ...cfg, sigMode: "ts_body" as const };
    expect(signRequest(tsBodyCfg, body, ts)).toBe(hmac(cfg.secret, ts + body));
  });

  it("debugSignatures returns all three candidates for lab comparison", () => {
    const sigs = debugSignatures(cfg.secret, body, ts);
    expect(sigs.body_ts).toBe(hmac(cfg.secret, body + ts));
    expect(sigs.ts_body).toBe(hmac(cfg.secret, ts + body));
    expect(sigs.body_dot_ts).toBe(hmac(cfg.secret, `${body}.${ts}`));
  });
});

describe("payme config", () => {
  it("returns null when credentials are missing", () => {
    expect(readPaymeConfig({})).toBeNull();
    expect(readPaymeConfig({ PAYME_APP_ID: "x" })).toBeNull();
    expect(readPaymeConfig({ PAYME_APP_ID: "x", PAYME_APP_SECRET: "  " })).toBeNull();
  });

  it("reads config and defaults base URL + sig mode", () => {
    const c = readPaymeConfig({ PAYME_APP_ID: "x", PAYME_APP_SECRET: "s" });
    expect(c).toMatchObject({ appId: "x", secret: "s", baseUrl: "https://portal.paymeafrica.com/api/v1", sandbox: false, sigMode: "body_ts" });
  });

  it("honours sandbox flag and a valid sig mode, ignores an invalid one", () => {
    expect(readPaymeConfig({ PAYME_APP_ID: "x", PAYME_APP_SECRET: "s", PAYME_SANDBOX: "1" })?.sandbox).toBe(true);
    expect(readPaymeConfig({ PAYME_APP_ID: "x", PAYME_APP_SECRET: "s", PAYME_SIG_MODE: "ts_body" })?.sigMode).toBe("ts_body");
    expect(readPaymeConfig({ PAYME_APP_ID: "x", PAYME_APP_SECRET: "s", PAYME_SIG_MODE: "nonsense" })?.sigMode).toBe("body_ts");
  });

  it("strips a trailing slash from an overridden base URL", () => {
    expect(readPaymeConfig({ PAYME_APP_ID: "x", PAYME_APP_SECRET: "s", PAYME_BASE_URL: "https://h/api/" })?.baseUrl).toBe("https://h/api");
  });

  it("paymentsEnabled is strictly the string 'true'", () => {
    expect(paymentsEnabled({ PAYMENTS_ENABLED: "true" })).toBe(true);
    expect(paymentsEnabled({ PAYMENTS_ENABLED: "1" })).toBe(false);
    expect(paymentsEnabled({})).toBe(false);
  });
});

describe("webhook verification", () => {
  const raw = '{"reference":"SUM-abc","status":"success"}';
  const good = createHmac("sha256", cfg.secret).update(raw).digest("base64");

  it("accepts a correctly signed body", () => {
    expect(verifyWebhook(cfg, raw, good)).toBe(true);
    expect(verifyWebhook(cfg, raw, ` ${good} `)).toBe(true);
  });

  it("rejects a missing, empty, or wrong signature", () => {
    expect(verifyWebhook(cfg, raw, null)).toBe(false);
    expect(verifyWebhook(cfg, raw, "")).toBe(false);
    expect(verifyWebhook(cfg, raw, "deadbeef")).toBe(false);
    expect(verifyWebhook(cfg, raw + "x", good)).toBe(false);
  });

  it("safeEqual is false on length mismatch without throwing", () => {
    expect(safeEqual("a", "aa")).toBe(false);
    expect(safeEqual("abc", "abc")).toBe(true);
  });
});

describe("response parsing (real sandbox shapes)", () => {
  // The exact body the sandbox /transact returned.
  const sandboxResponse = {
    status: "success",
    transaction_id: "7WSL7MW9",
    payment_status: "PENDING",
    checkout_url: null,
    financials: null,
    provider_response: {
      result: "SUCCESS",
      resultcode: "000",
      reference: "SUM-TEST-002",
      transid: "SBFL1T2N",
      message: "[Sandbox] Simulation Successful",
      order_id: "SUM-TEST-002",
    },
    provider_request: null,
  };

  it("parseCollectionResponse reads the accept + pending shape", () => {
    const p = parseCollectionResponse(sandboxResponse);
    expect(p.accepted).toBe(true);
    expect(p.paymentStatus).toBe("PENDING");
    expect(p.providerTxnId).toBe("7WSL7MW9");
  });

  it("parseWebhook treats a PENDING callback as neither paid nor failed", () => {
    // If the collection-style body arrived as a webhook, it must NOT settle.
    const e = parseWebhook(sandboxResponse);
    expect(e.paid).toBe(false);
    expect(e.failed).toBe(false);
    expect(e.reference).toBe("SUM-TEST-002");
  });

  it("parseWebhook settles on a SUCCESS payment_status", () => {
    const e = parseWebhook({ reference: "SUM-9", payment_status: "SUCCESS", transaction_id: "TX1" });
    expect(e.paid).toBe(true);
    expect(e.failed).toBe(false);
    expect(e.reference).toBe("SUM-9");
    expect(e.providerTxnId).toBe("TX1");
  });

  it("parseWebhook marks failure states", () => {
    expect(parseWebhook({ reference: "r", payment_status: "FAILED" }).failed).toBe(true);
    expect(parseWebhook({ reference: "r", payment_status: "CANCELLED" }).failed).toBe(true);
  });

  it("parseWebhook finds the reference under order_id / provider_response", () => {
    expect(parseWebhook({ order_id: "SUM-A", payment_status: "SUCCESS" }).reference).toBe("SUM-A");
    expect(parseWebhook({ provider_response: { reference: "SUM-B" }, payment_status: "SUCCESS" }).reference).toBe("SUM-B");
    expect(parseWebhook({ payment_status: "SUCCESS" }).reference).toBeNull();
  });
});

describe("plans", () => {
  it("prices day 1,000 / week 3,000 / month 7,000", () => {
    expect(planAmount("day", "TZS")).toBe(1000);
    expect(planAmount("week", "TZS")).toBe(3000);
    expect(planAmount("month", "TZS")).toBe(7000);
    expect(PLANS.day.days).toBe(1);
    expect(PLANS.week.days).toBe(7);
    expect(PLANS.month.days).toBe(30);
  });

  it("isPlanId guards unknown plans", () => {
    expect(isPlanId("day")).toBe(true);
    expect(isPlanId("lifetime")).toBe(false);
  });
});

describe("TZ msisdn normalization", () => {
  it("accepts the shapes a user types", () => {
    expect(normalizeTzMsisdn("0712345678")).toBe("255712345678");
    expect(normalizeTzMsisdn("712345678")).toBe("255712345678");
    expect(normalizeTzMsisdn("+255 712 345 678")).toBe("255712345678");
    expect(normalizeTzMsisdn("255-712-345-678")).toBe("255712345678");
    expect(normalizeTzMsisdn("0655123456".replace("0655", "0655"))).toBe("255655123456");
  });

  it("rejects implausible numbers", () => {
    expect(normalizeTzMsisdn("")).toBeNull();
    expect(normalizeTzMsisdn(null)).toBeNull();
    expect(normalizeTzMsisdn("12345")).toBeNull();
    expect(normalizeTzMsisdn("0812345678")).toBeNull(); // 08 is not a TZ mobile prefix
  });
});
