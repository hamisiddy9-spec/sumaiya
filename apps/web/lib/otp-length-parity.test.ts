/**
 * THE SEAM TEST — web and the Android app must agree on how long a sign-in code
 * is, because the SERVER sends one length and only one of the two can be right.
 *
 * Why this test exists (the bug it would have caught)
 * ---------------------------------------------------
 * `npm run seam` read both surfaces and found:
 *
 *   web    maxLength = 6   (apps/web/app/(app)/(auth)/sign-in/sign-in-form.tsx)
 *   native EMAIL_OTP_DIGITS = 8   (apps/native/src/lib/auth-code.ts)
 *
 * Sumaiya production's Supabase project is configured for an 8-digit email OTP,
 * so the web field could never accept the code it was sent — the sixth digit was
 * all it would take, and the sign-in could not succeed. Both suites passed: web
 * asserted nothing about the length, and the native test asserted its own
 * literal, which is exactly the kind of "each half is self-consistent" that
 * hides a seam.
 *
 * So this file asserts the property that was missing: there is ONE declaration
 * of the number, both surfaces read it, and the native suite's expectation is
 * still the same number. It reads the sources (the pattern already used by
 * lib/signin-mechanism-parity.test.ts) so a re-introduced literal fails here
 * instead of on a user's phone.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  EMAIL_OTP_DIGITS,
  emailOtpPlaceholder,
  isCompleteEmailOtp,
  normalizeEmailOtp,
} from "@sumaiya/utils/auth-code";

// apps/web/lib → apps/web → apps → repo root
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APPS_DIR = path.resolve(HERE, "..", "..");
const REPO = path.resolve(APPS_DIR, "..");

const SHARED = path.join(REPO, "packages", "utils", "src", "auth-code.ts");
const WEB_FORM = path.join(APPS_DIR, "web", "app", "(app)", "(auth)", "sign-in", "sign-in-form.tsx");
const NATIVE_AUTH_CODE = path.join(APPS_DIR, "native", "src", "lib", "auth-code.ts");
const NATIVE_TEST = path.join(APPS_DIR, "native", "src", "lib", "auth-code.test.ts");

const read = (file: string) => readFileSync(file, "utf8");

/** The single declaration, wherever it lives — the number itself. */
function declaredDigits(): number {
  const m = read(SHARED).match(/EMAIL_OTP_DIGITS\s*=\s*(\d+)/);
  if (!m) throw new Error(`no EMAIL_OTP_DIGITS declaration in ${SHARED}`);
  return Number(m[1]);
}

describe("one sign-in-code length, shared by both surfaces", () => {
  it("is declared exactly once — a second literal is the bug coming back", () => {
    expect(declaredDigits()).toBe(8); // what the Supabase project mails out
    // Native must re-export, not restate.
    expect(read(NATIVE_AUTH_CODE)).not.toMatch(/EMAIL_OTP_DIGITS\s*=\s*\d/);
    expect(read(NATIVE_AUTH_CODE)).toContain("@sumaiya/utils/auth-code");
    // Web must not carry its own number, in the field, the gate or the copy.
    const web = read(WEB_FORM);
    expect(web).not.toMatch(/maxLength=\{\d+\}/);
    expect(web).not.toMatch(/length\s*<\s*\d/);
    expect(web).not.toMatch(/slice\(0,\s*\d+\)/);
    expect(web).not.toMatch(/\d+-digit/);
    expect(web).not.toMatch(/tarakimu\s+\d/);
  });

  it("both surfaces read the SAME module — the parity the seam test proved was missing", () => {
    expect(read(WEB_FORM)).toContain("@sumaiya/utils/auth-code");
    expect(read(NATIVE_AUTH_CODE)).toContain("@sumaiya/utils/auth-code");
  });

  it("the value web imports IS the shared declaration", () => {
    // The import above resolves through the same specifier native re-exports,
    // so this equality is the join between the two surfaces.
    expect(EMAIL_OTP_DIGITS).toBe(declaredDigits());
  });

  it("the native suite's expectation still matches the shared number", () => {
    // The native test asserts its own literal (`toBe(8)`) on purpose: changing
    // the project's OTP length must fail there loudly, not silently agree.
    const m = read(NATIVE_TEST).match(/EMAIL_OTP_DIGITS\)\.toBe\((\d+)\)/);
    expect(m).toBeTruthy();
    expect(Number(m![1])).toBe(declaredDigits());
  });

  it("accepts an 8-digit code and rejects the 6 digits the web used to stop at", () => {
    expect(isCompleteEmailOtp("13695957")).toBe(true);
    expect(isCompleteEmailOtp("136959")).toBe(false); // the old web gate said "complete"
    expect(normalizeEmailOtp("13695957")).toHaveLength(EMAIL_OTP_DIGITS);
    expect(normalizeEmailOtp("1369595799")).toHaveLength(EMAIL_OTP_DIGITS); // capped, not truncated short
    expect(normalizeEmailOtp("code: 136-959-57")).toBe("13695957");
    expect(emailOtpPlaceholder()).toBe("•".repeat(EMAIL_OTP_DIGITS));
  });
});
