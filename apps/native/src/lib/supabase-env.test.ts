import { readFileSync } from "fs";
import path from "path";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  projectRefFromJwt,
  projectRefFromUrl,
  supabaseCredentialsAreConsistent,
} from "./supabase-env";

/**
 * The regression these cover: the shipped APK contained NO Supabase anon key.
 *
 * `??` does not fall back on an empty string, so when the build had
 * EXPO_PUBLIC_SUPABASE_ANON_KEY set to "", the hardcoded key became dead code
 * and was dropped. The bundle had the project URL and zero copies of the key;
 * every auth call went out without `apikey` and Supabase answered
 * "Invalid API key". With Google sign-in separately broken, the app had no
 * working way in at all.
 */
describe("supabase credentials", () => {
  it("resolves a real anon key, never an empty string", () => {
    expect(SUPABASE_ANON_KEY.length).toBeGreaterThan(100);
    expect(SUPABASE_ANON_KEY.trim()).toBe(SUPABASE_ANON_KEY);
  });

  it("resolves a real project URL", () => {
    expect(projectRefFromUrl(SUPABASE_URL)).toBe("duywnmibgiqulqzunsmh");
  });

  it("the key is a well-formed three-part JWT with role anon", () => {
    const parts = SUPABASE_ANON_KEY.split(".");
    expect(parts).toHaveLength(3);
    const payload = JSON.parse(
      Buffer.from(parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4), "base64").toString(),
    );
    expect(payload.role).toBe("anon");
    expect(payload.ref).toBe("duywnmibgiqulqzunsmh");
  });

  it("the key belongs to the project the URL points at", () => {
    // A key for a different project is worse than no key: the app looks broken
    // and the cause is invisible.
    expect(supabaseCredentialsAreConsistent()).toBe(true);
  });

  it("is imported by supabase.ts rather than re-implemented there", () => {
    // Guards against the two-copies-of-the-truth failure that caused this.
    const client = readFileSync(path.join(__dirname, "supabase.ts"), "utf8");
    expect(client).toContain('from "./supabase-env"');
    expect(client).not.toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("detects a mismatched project", () => {
    expect(projectRefFromJwt("a.b.c")).toBeNull();
    expect(projectRefFromJwt("")).toBeNull();
    expect(projectRefFromJwt("not-a-jwt")).toBeNull();
  });
});
