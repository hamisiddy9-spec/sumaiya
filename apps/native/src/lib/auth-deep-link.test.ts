// lib/supabase.ts (imported for EMAIL_REDIRECT_TO) pulls in AsyncStorage and
// GoogleSignin at module load — both throw under jest without a native
// binary. Stub them out; this test only exercises the pure URL match.
jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signIn: jest.fn() },
  statusCodes: {},
  isErrorWithCode: jest.fn(() => false),
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { isConfirmDeepLink } from "./auth-deep-link";

describe("isConfirmDeepLink", () => {
  it("accepts the real confirmation link with its token fragment", () => {
    expect(isConfirmDeepLink("sumaiya://auth/confirm#access_token=abc&refresh_token=def")).toBe(true);
  });

  it("accepts the real confirmation link with a token_hash query param", () => {
    expect(isConfirmDeepLink("sumaiya://auth/confirm?token_hash=abc")).toBe(true);
  });

  it("accepts the bare confirmation link with no params", () => {
    expect(isConfirmDeepLink("sumaiya://auth/confirm")).toBe(true);
  });

  it("rejects a decoy URL that merely contains the substring 'auth/confirm'", () => {
    expect(isConfirmDeepLink("https://evil.example/x?next=auth/confirm")).toBe(false);
    expect(isConfirmDeepLink("sumaiya://not-auth/confirm")).toBe(false);
    expect(isConfirmDeepLink("sumaiya://auth/confirmed")).toBe(false);
    expect(isConfirmDeepLink("evilsumaiya://auth/confirm")).toBe(false);
  });

  it("rejects null/undefined/empty", () => {
    expect(isConfirmDeepLink(null)).toBe(false);
    expect(isConfirmDeepLink(undefined)).toBe(false);
    expect(isConfirmDeepLink("")).toBe(false);
  });
});
