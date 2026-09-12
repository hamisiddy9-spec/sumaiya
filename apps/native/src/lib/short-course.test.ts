jest.mock("@react-native-async-storage/async-storage", () => {
  const store: Record<string, string> = {};
  return {
    getItem: jest.fn(async (k: string) => store[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      store[k] = v;
    }),
    __store: store,
  };
});

import {
  EMPTY_COURSE,
  courseDone,
  courseIsComplete,
  courseLessonCount,
  coursePercent,
  courseTotal,
  getCourseProgress,
  markCourseUnit,
  resetCourse,
} from "./short-course";
import {
  APP_TOUR_COURSE,
  APP_TOUR_KEY,
  JOB_SEARCH_COURSE,
  JOB_SEARCH_KEY,
  SHORT_COURSES,
} from "./short-courses";

const AsyncStorage = require("@react-native-async-storage/async-storage");

beforeEach(async () => {
  await resetCourse(JOB_SEARCH_KEY);
  await resetCourse(APP_TOUR_KEY);
  AsyncStorage.__store[JOB_SEARCH_KEY] = undefined;
  AsyncStorage.__store[APP_TOUR_KEY] = undefined;
});

describe("the courses themselves", () => {
  it("are free, short, and ask for nothing unmarked", () => {
    for (const c of SHORT_COURSES) {
      expect(c.units.length).toBeGreaterThanOrEqual(4);
      expect(c.minutes).toBeLessThanOrEqual(20);
      expect(c.title.sw.trim().length).toBeGreaterThan(3);
      expect(c.blurb.en.trim().length).toBeGreaterThan(10);
    }
  });

  it("never reuse a unit id — one store holds both courses", () => {
    const ids = SHORT_COURSES.flatMap((c) => c.units.map((u) => u.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("give every unit a bilingual title, and every task a button that says where it goes", () => {
    for (const c of SHORT_COURSES) {
      for (const u of c.units) {
        expect(u.title.en.trim().length).toBeGreaterThan(2);
        expect(u.title.sw.trim().length).toBeGreaterThan(2);
        if (u.kind === "task") {
          expect(u.action).toBeTruthy();
          expect(u.cta?.sw.trim().length ?? 0).toBeGreaterThan(2);
          expect(u.body?.sw.trim().length ?? 0).toBeGreaterThan(20);
        }
      }
    }
  });

  it("keeps websites as resources, never as steps", () => {
    // The fix for "endless links": if a course links out, the link lives in
    // `resources`, where it adds no progress and cannot be mistaken for a step.
    const resources = SHORT_COURSES.flatMap((c) => c.resources ?? []);
    expect(resources.length).toBeGreaterThanOrEqual(5);
    for (const r of resources) {
      expect(r.url).toMatch(/^https:\/\//);
      expect(r.note.en.trim().length).toBeGreaterThan(10);
      expect(r.note.sw.trim().length).toBeGreaterThan(10);
      expect(r.name.en.trim().length).toBeGreaterThan(1);
      expect(r.name.sw.trim().length).toBeGreaterThan(1);
    }
  });

  it("has an opening lesson in the job-search course, not a wall of links", () => {
    // This is the pilot. If it regresses, the course goes back to feeling like
    // a checklist of other people's websites.
    expect(JOB_SEARCH_COURSE.units[0].kind).toBe("lesson");
    expect(courseLessonCount(JOB_SEARCH_COURSE)).toBeGreaterThanOrEqual(1);
    expect(JOB_SEARCH_COURSE.resourcesAfter).toBe(JOB_SEARCH_COURSE.units[0].id);
  });

  it("never lets a resource count as a step", () => {
    const withResources = JOB_SEARCH_COURSE.resources?.length ?? 0;
    expect(withResources).toBeGreaterThan(0);
    expect(courseTotal(JOB_SEARCH_COURSE)).toBe(JOB_SEARCH_COURSE.units.length);
    // Opening every website must not move the bar at all.
    expect(coursePercent(EMPTY_COURSE, JOB_SEARCH_COURSE)).toBe(0);
  });

  it("says the thing out loud — no 'kimoja' in Swahili copy", () => {
    // The user's rule: "umeona moja" leaves people asking "one what?" Name it.
    const swText = SHORT_COURSES.flatMap((c) => [
      c.title.sw,
      c.blurb.sw,
      ...c.units.flatMap((u) => [
        u.title.sw,
        u.body?.sw ?? "",
        u.cta?.sw ?? "",
        // Lesson copy is the most-read text in the hub now, so the rule has to
        // reach it too.
        ...(u.lesson?.paragraphs.sw ?? []),
        u.lesson?.keyPoint?.sw ?? "",
        u.lesson?.checkpoint?.question.sw ?? "",
        ...(u.lesson?.checkpoint?.options.map((o) => o.sw) ?? []),
        u.lesson?.checkpoint?.why.sw ?? "",
      ]),
    ]).join(" ");
    // "kila kimoja" (each one) is fine Swahili; the question "umeona kimoja?" is
    // the one that leaves people asking "one what?" — that's what we forbid.
    expect(swText).not.toMatch(/umeona\s+kimoja|unaona\s+kimoja/i);
    expect(swText).toMatch(/tangazo la kazi/);
  });
});

describe("progress", () => {
  it("starts empty and reports zero", async () => {
    expect(await getCourseProgress(JOB_SEARCH_KEY)).toEqual(EMPTY_COURSE);
    expect(courseDone(EMPTY_COURSE, JOB_SEARCH_COURSE)).toBe(0);
    expect(coursePercent(EMPTY_COURSE, JOB_SEARCH_COURSE)).toBe(0);
    expect(courseIsComplete(EMPTY_COURSE, JOB_SEARCH_COURSE)).toBe(false);
  });

  it("ticks a unit once, and only if the course knows it", async () => {
    const first = JOB_SEARCH_COURSE.units[0].id;
    const p1 = await markCourseUnit(JOB_SEARCH_KEY, JOB_SEARCH_COURSE, first);
    expect(p1.done).toEqual([first]);
    const p2 = await markCourseUnit(JOB_SEARCH_KEY, JOB_SEARCH_COURSE, first);
    expect(p2.done).toEqual([first]); // idempotent
    const p3 = await markCourseUnit(JOB_SEARCH_KEY, JOB_SEARCH_COURSE, "src:zoomtanzania-ghost");
    expect(p3.done).toEqual([first]); // unknown id ignored
  });

  it("keeps each course's progress separate", async () => {
    const first = JOB_SEARCH_COURSE.units[0].id;
    await markCourseUnit(JOB_SEARCH_KEY, JOB_SEARCH_COURSE, first);
    const tour = await getCourseProgress(APP_TOUR_KEY);
    expect(tour.done).toEqual([]);
    const job = await getCourseProgress(JOB_SEARCH_KEY);
    expect(job.done).toEqual([first]);
  });

  it("still counts a lesson, and ticks it like any other unit", async () => {
    // The whole point of `kind: "lesson"` being additive: progress machinery
    // needed no changes, so this is a regression guard, not new behaviour.
    const lesson = JOB_SEARCH_COURSE.units.find((u) => u.kind === "lesson");
    expect(lesson).toBeTruthy();
    const p = await markCourseUnit(JOB_SEARCH_KEY, JOB_SEARCH_COURSE, lesson!.id);
    expect(p.done).toEqual([lesson!.id]);
    expect(courseDone(p, JOB_SEARCH_COURSE)).toBe(1);
  });

  it("ignores ids that are no longer units — the six old link units must not linger", async () => {
    // The six `src:*` ids were units and are now resources. Anyone who ticked
    // them must simply see them gone, not see a course stuck at 100%-impossible.
    const p = await markCourseUnit(JOB_SEARCH_KEY, JOB_SEARCH_COURSE, "src:ajira-portal");
    expect(p.done).toEqual([]);
    expect(courseTotal(JOB_SEARCH_COURSE)).toBe(JOB_SEARCH_COURSE.units.length);
  });

  it("reaches 100% only when every unit is finished", async () => {
    for (const u of APP_TOUR_COURSE.units.slice(0, -1)) await markCourseUnit(APP_TOUR_KEY, APP_TOUR_COURSE, u.id);
    const almost = await getCourseProgress(APP_TOUR_KEY);
    expect(coursePercent(almost, APP_TOUR_COURSE)).toBe(Math.round(((APP_TOUR_COURSE.units.length - 1) / APP_TOUR_COURSE.units.length) * 100));
    expect(courseIsComplete(almost, APP_TOUR_COURSE)).toBe(false);

    await markCourseUnit(APP_TOUR_KEY, APP_TOUR_COURSE, APP_TOUR_COURSE.units[APP_TOUR_COURSE.units.length - 1].id);
    const full = await getCourseProgress(APP_TOUR_KEY);
    expect(courseDone(full, APP_TOUR_COURSE)).toBe(courseTotal(APP_TOUR_COURSE));
    expect(coursePercent(full, APP_TOUR_COURSE)).toBe(100);
    expect(courseIsComplete(full, APP_TOUR_COURSE)).toBe(true);
  });

  it("survives junk in storage instead of blanking the hub", async () => {
    AsyncStorage.__store[APP_TOUR_KEY] = "{not json";
    expect(await getCourseProgress(APP_TOUR_KEY)).toEqual(EMPTY_COURSE);
    AsyncStorage.__store[APP_TOUR_KEY] = JSON.stringify({ done: "nope" });
    expect(await getCourseProgress(APP_TOUR_KEY)).toEqual(EMPTY_COURSE);
    AsyncStorage.__store[APP_TOUR_KEY] = JSON.stringify({ done: [1, "tour:cv", null] });
    expect(await getCourseProgress(APP_TOUR_KEY)).toEqual({ done: ["tour:cv"] });
  });
});

describe("lessons", () => {
  const lessons = SHORT_COURSES.flatMap((c) => c.units.filter((u) => u.kind === "lesson"));

  it("exist, and carry their own content", () => {
    expect(lessons.length).toBeGreaterThanOrEqual(1);
    for (const l of lessons) expect(l.lesson).toBeTruthy();
  });

  it("read at a sensible length — 2 to 4 short paragraphs, both languages", () => {
    for (const l of lessons) {
      const { en, sw } = l.lesson!.paragraphs;
      expect(en.length).toBe(sw.length); // bilingual parity, or one language drifts
      expect(en.length).toBeGreaterThanOrEqual(2);
      expect(en.length).toBeLessThanOrEqual(4);
      for (const p of [...en, ...sw]) expect(p.trim().length).toBeGreaterThan(40);
    }
  });

  it("gives every checkpoint a real, answerable question", () => {
    for (const l of lessons) {
      const cp = l.lesson!.checkpoint;
      if (!cp) continue;
      expect(cp.options.length).toBeGreaterThanOrEqual(2);
      expect(cp.options.length).toBeLessThanOrEqual(4);
      // An out-of-range index would leave the lesson unanswerable — every
      // attempt wrong, and no way to finish it.
      expect(cp.answer).toBeGreaterThanOrEqual(0);
      expect(cp.answer).toBeLessThan(cp.options.length);
      expect(cp.question.en.trim().length).toBeGreaterThan(10);
      expect(cp.question.sw.trim().length).toBeGreaterThan(10);
      expect(cp.why.en.trim().length).toBeGreaterThan(20);
      expect(cp.why.sw.trim().length).toBeGreaterThan(20);
      for (const o of cp.options) {
        expect(o.en.trim().length).toBeGreaterThan(1);
        expect(o.sw.trim().length).toBeGreaterThan(1);
      }
    }
  });

  it("gives a lesson a way out — the practice step, or an explicit finish", () => {
    // A lesson whose checkpoint is answered must always be closable: either it
    // has a CTA to press, or the sheet offers "Nimeelewa".
    for (const l of lessons) {
      if (l.cta) expect(l.action).toBeTruthy();
    }
  });
});
