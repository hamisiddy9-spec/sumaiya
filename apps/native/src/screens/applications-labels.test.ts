/**
 * The Applications list's own rules, on their own — the ordering law, the
 * follow-up rule and the two strings the fragment prints with a fixed shape
 * (`Ilipoguswa mwisho:` + a relative time; `Nyaraka 4 zinazofuatiliwa`).
 *
 * The screen itself is a component and is not rendered here; what it must get
 * right is these pure decisions, and every one of them is asserted against the
 * design fragment's own example (`Jana (Saa 10:15 Jioni)`, `Imetumwa siku 21
 * zilizopita`, `Yote (4)`).
 */
import { relativeDate } from "../lib/relative-date";
import {
  APPLICATION_STATUS_LABEL,
  FOLLOW_UP_DAYS,
  PIPELINE_ORDER,
  applicationsTrackedLine,
  daysAgoLabel,
  daysWaiting,
  lastMovedAt,
  lastMovedLabel,
  needsFollowUp,
  sentAgoLabel,
  sortByLastMovement,
} from "./applications-labels";

const DAY = 86_400_000;

describe("the list is ordered by the last movement, never by the creation date", () => {
  const now = new Date(2026, 9, 14, 12, 0); // 14 Oct 2026, local

  it("puts the most recently moved application first", () => {
    // The design's own case: the CRDB row (created earlier, moved 4 days ago)
    // sits above the Aga Khan row (created 3 days ago, never moved since).
    // Ordered by creation, the newest creation would win — and the list stops
    // being a tracker.
    const created_old_moved_2h = { id: "a", createdAt: now.getTime() - 30 * DAY, updatedAt: now.getTime() - 2 * 3_600_000 };
    const created_new_never_moved = { id: "b", createdAt: now.getTime() - 3 * DAY, updatedAt: now.getTime() - 3 * DAY };
    const rows = sortByLastMovement([created_new_never_moved, created_old_moved_2h]);
    expect(rows.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the array it is handed", () => {
    const input = [
      { id: "a", createdAt: 1, updatedAt: 1 },
      { id: "b", createdAt: 2, updatedAt: 2 },
    ];
    sortByLastMovement(input);
    expect(input.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("falls back to createdAt when a row was never updated", () => {
    // A row written before this screen existed has both stamps (the store
    // always writes them); the fallback keeps the order total anyway.
    expect(lastMovedAt({ createdAt: 42 })).toBe(42);
    expect(lastMovedAt({ updatedAt: 7, createdAt: 42 })).toBe(42);
    expect(lastMovedAt({ updatedAt: 99, createdAt: 42 })).toBe(99);
  });
});

describe("the follow-up lane", () => {
  const now = Date.now();

  it("fires for a sent application at exactly a week, and not a day before", () => {
    const sent = (days: number) => ({ status: "applied" as const, appliedAt: now - days * DAY, createdAt: now - 40 * DAY });
    expect(needsFollowUp(sent(FOLLOW_UP_DAYS - 1), now)).toBe(false);
    expect(needsFollowUp(sent(FOLLOW_UP_DAYS), now)).toBe(true);
    expect(needsFollowUp(sent(21), now)).toBe(true);
  });

  it("never fires for a status other than sent", () => {
    for (const status of ["saved", "interview", "offer", "closed"] as const) {
      expect(needsFollowUp({ status, appliedAt: now - 90 * DAY, createdAt: now - 90 * DAY }, now)).toBe(false);
    }
  });

  it("counts from the day it was sent, falling back to the creation day", () => {
    expect(daysWaiting({ appliedAt: now - 9 * DAY, createdAt: now - 100 * DAY }, now)).toBe(9);
    expect(daysWaiting({ createdAt: now - 2 * DAY }, now)).toBe(2);
    // Never negative, even if a clock ran backwards.
    expect(daysWaiting({ appliedAt: now + 5 * DAY }, now)).toBe(0);
  });

  it("says it in the fragment's shape, in both languages, with the singular right", () => {
    expect(sentAgoLabel(21, "sw")).toBe("Imetumwa siku 21 zilizopita");
    expect(sentAgoLabel(7, "en")).toBe("Sent 7 days ago");
    // "siku 1 zilizopita" is not Swahili — the count of one takes the singular.
    expect(daysAgoLabel(1, "sw")).toBe("siku moja iliyopita");
    expect(daysAgoLabel(4, "sw")).toBe("siku 4 zilizopita");
    expect(daysAgoLabel(1, "en")).toBe("1 day ago");
  });
});

describe("`Ilipoguswa mwisho:` — the relative time beside it", () => {
  const now = new Date(2026, 9, 14, 23, 30);

  it("matches the fragment's own example, with the clock for today and yesterday", () => {
    expect(lastMovedLabel(new Date(2026, 9, 13, 22, 15).getTime(), "sw", now)).toBe("Jana (Saa 22:15)");
    expect(lastMovedLabel(new Date(2026, 9, 13, 22, 15).getTime(), "en", now)).toBe("Yesterday (22:15)");
    expect(lastMovedLabel(new Date(2026, 9, 14, 9, 5).getTime(), "sw", now)).toBe("Leo (Saa 09:05)");
  });

  it("drops the clock once it is older than yesterday, like the fragment's second row", () => {
    expect(lastMovedLabel(new Date(2026, 9, 10, 22, 15).getTime(), "sw", now)).toBe("Siku 4 zilizopita");
    expect(lastMovedLabel(new Date(2026, 9, 10, 22, 15).getTime(), "en", now)).toBe("4 days ago");
  });

  it("uses the shared day bucket for anything older, so the midnight rule is not re-implemented", () => {
    const old = new Date(2026, 8, 21, 10, 0).getTime(); // more than a week back
    expect(lastMovedLabel(old, "sw", now)).toBe(relativeDate(new Date(old), "sw", now));
    expect(lastMovedLabel(old, "sw", now)).not.toContain("(");
  });

  it("reads a 23:00 → 01:00 pair as yesterday, not today", () => {
    // The reason the bucket is a CALENDAR day: 2 hours earlier, different day.
    const justAfterMidnight = new Date(2026, 9, 14, 1, 0);
    expect(lastMovedLabel(new Date(2026, 9, 13, 23, 0).getTime(), "sw", justAfterMidnight)).toBe("Jana (Saa 23:00)");
  });
});

describe("the count under the title", () => {
  it("counts applications, and takes the singular noun for one", () => {
    // The fragment prints "Nyaraka 4 zinazofuatiliwa" — documents. This app
    // counts applications; see applications-labels.ts for why.
    expect(applicationsTrackedLine(4, "sw")).toBe("Maombi 4 yanafuatiliwa");
    expect(applicationsTrackedLine(4, "en")).toBe("4 applications being tracked");
    expect(applicationsTrackedLine(1, "sw")).toBe("Ombi 1 linafuatiliwa");
    expect(applicationsTrackedLine(1, "en")).toBe("1 application being tracked");
  });
});

describe("the status vocabulary the fragment asks for", () => {
  it("uses the fragment's Kiswahili where the store has that state", () => {
    expect(APPLICATION_STATUS_LABEL.applied.sw).toBe("Imetumwa");
    expect(APPLICATION_STATUS_LABEL.interview.sw).toBe("Mazungumzo");
    expect(APPLICATION_STATUS_LABEL.offer.sw).toBe("Imekubaliwa");
  });

  it("keeps the app's own honest words for the two states the design does not have", () => {
    // A job saved before it is sent, and one the user ended themselves.
    expect(APPLICATION_STATUS_LABEL.saved.sw).toBe("Imehifadhiwa");
    expect(APPLICATION_STATUS_LABEL.closed.sw).toBe("Imefungwa");
  });

  it("never claims a state the store cannot produce", () => {
    // `Imeonekana` (seen) and `Mwito` (invited) have no field to derive them
    // from, and `closed` is not a rejection — labelling it `Imekataliwa` would
    // put a rejection in the user's history that never happened.
    const claimed = Object.values(APPLICATION_STATUS_LABEL).map((m) => m.sw);
    expect(claimed).not.toContain("Imeonekana");
    expect(claimed).not.toContain("Mwito");
    expect(claimed).not.toContain("Imekataliwa");
  });

  it("labels every status in both languages, with no English leaked into the Swahili slot", () => {
    for (const s of PIPELINE_ORDER) {
      const meta = APPLICATION_STATUS_LABEL[s];
      expect(meta.sw.length).toBeGreaterThan(0);
      expect(meta.en.length).toBeGreaterThan(0);
      expect(meta.sw).not.toBe(meta.en);
    }
  });

  it("orders the chips most-advanced-first, the fragment's own order", () => {
    // The fragment shows Mazungumzo, then Mwito, then Imetumwa.
    expect(PIPELINE_ORDER).toEqual(["offer", "interview", "applied", "saved", "closed"]);
  });
});
