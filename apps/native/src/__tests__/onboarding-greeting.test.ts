/**
 * ONBOARDING — the Home greeting must not tell a first-timer "welcome back".
 *
 * The greeting was chosen purely from the clock, so a brand-new install opened
 * after 21:00 could be greeted "Karibu tena" / "Welcome back" as the very
 * first words the app ever said to that person. These tests pin the rule at
 * the source: the returning-only phrases are unreachable unless the caller
 * positively says the user has been here before.
 */
import { greeting, greetingBucket, GREETINGS, RETURNING_ONLY } from "../lib/greeting";

/** Every hour of the day, every date that changes the variant pick. */
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

describe("Home greeting — new vs returning", () => {
  it("no clock value can produce a returning-only phrase for a first run", () => {
    const offenders: string[] = [];
    for (const day of DAYS) {
      for (const hour of HOURS) {
        const now = new Date(2026, 8, day, hour, 30, 0); // Sept 2026
        for (const lang of ["sw", "en"] as const) {
          const line = greeting(lang, false, now);
          if (RETURNING_ONLY.includes(line)) {
            offenders.push(`${lang} day=${day} hour=${hour} -> "${line}"`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("a first run still gets a real greeting at every hour", () => {
    for (const hour of HOURS) {
      const now = new Date(2026, 8, 3, hour, 0, 0);
      expect(greeting("sw", false, now).length).toBeGreaterThan(0);
      expect(greeting("en", false, now).length).toBeGreaterThan(0);
    }
  });

  it("a returning user DOES get the welcome-back line (it was not just deleted)", () => {
    // Late-night bucket, both languages, listed explicitly.
    expect(GREETINGS.sw[3]).toContain("Karibu tena");
    expect(GREETINGS.en[3]).toContain("Welcome back");
    // 2026-09-02 is even → index 2 in a 3-variant bucket = "Karibu tena"
    expect(greeting("sw", true, new Date(2026, 8, 2, 22, 0, 0))).toBe("Karibu tena");
  });

  it("the late-night first-run line still reads like a greeting, in Swahili", () => {
    const line = greeting("sw", false, new Date(2026, 8, 3, 22, 0, 0));
    expect(line).toBe("Karibu usiku huu");
  });

  it("the small hours are NIGHT, not morning (device-observed at 00:26)", () => {
    // The Home screen said "Habari za leo asubuhi," (good morning) at 00:26.
    for (const h of [0, 1, 2, 3, 4]) expect(greetingBucket(h)).toBe(3);
    expect(greetingBucket(5)).toBe(0);
    const line = greeting("sw", false, new Date(2026, 8, 3, 0, 26, 0));
    expect(line).not.toMatch(/asubuhi|mchana|jioni/);
    expect(line).toMatch(/usiku/);
  });

  it("buckets are hours-of-day boundaries", () => {
    expect(greetingBucket(4)).toBe(3);
    expect(greetingBucket(5)).toBe(0);
    expect(greetingBucket(11)).toBe(0);
    expect(greetingBucket(12)).toBe(1);
    expect(greetingBucket(15)).toBe(1);
    expect(greetingBucket(16)).toBe(2);
    expect(greetingBucket(20)).toBe(2);
    expect(greetingBucket(21)).toBe(3);
    expect(greetingBucket(23)).toBe(3);
  });
});
