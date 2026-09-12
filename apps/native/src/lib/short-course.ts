/**
 * Short courses — the free, self-paced units in the Learning Hub.
 *
 * Two of them so far: finding a vacancy, and learning the app itself. They
 * share one shape and one store because they fail the same way otherwise — a
 * course that forgets where you were is just an article.
 *
 * Progress is local and per-device (AsyncStorage), like course-progress.ts.
 * Nothing here is a claim on the CV; it only records where someone got to.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CourseProgress {
  /** Unit ids the user finished. Namespaced ("src:…", "step:…") so one list holds both kinds. */
  done: string[];
}

export const EMPTY_COURSE: CourseProgress = { done: [] };

export interface Bilingual {
  en: string;
  sw: string;
}

/**
 * What a unit asks the app to do when tapped. Kept as a string union (not a
 * callback) so course content stays data — it can be listed, counted and tested
 * without a navigator in scope, and the screen decides where each one goes.
 */
export type CourseAction =
  | "mark" // nothing to open — the tap IS the confirmation
  | "sumaiya"
  | "cvs"
  | "import"
  | "ats"
  | "profile"
  | "letter"
  | "jobs"
  | "applications";

export interface CourseUnit {
  id: string;
  /**
   * "lesson" — the unit's whole value is on the screen you're looking at.
   * "link"   — opens a website.
   * "task"   — opens a place in the app.
   *
   * The first two are the point. Without "lesson" every unit was a doorway to
   * somewhere else, which made a course indistinguishable from a list of links.
   */
  kind: "lesson" | "link" | "task";
  title: Bilingual;
  body?: Bilingual;
  cta?: Bilingual;
  /** kind === "link" */
  url?: string;
  /** kind === "task", and the lesson's closing practice step. */
  action?: CourseAction;
  /** kind === "lesson" */
  lesson?: Lesson;
}

/**
 * One question at the end of a lesson.
 *
 * This is the line between "I opened it" and "I learned it": reading is passive
 * and can be skimmed in three seconds, answering cannot. Kept to a single
 * question on purpose — this is the on-ramp to a career, not a school test.
 */
export interface LessonCheckpoint {
  question: Bilingual;
  /** 2–4 choices, shown in this order. */
  options: Bilingual[];
  /** Index into `options` of the right answer. */
  answer: number;
  /** Why that one is right. Shown once they get there. */
  why: Bilingual;
}

/** The reading half of a lesson — the part that lives on the screen. */
export interface Lesson {
  /** 2–4 short paragraphs, in reading order. Both languages, always. */
  paragraphs: { en: string[]; sw: string[] };
  /** The one sentence to carry away, set apart at the end. */
  keyPoint?: Bilingual;
  checkpoint?: LessonCheckpoint;
}

/**
 * A website worth looking at, attached to a course but NOT a step in it.
 *
 * These used to be units, so six of them presented themselves as "step 1–6" of
 * a course about *reading* — a wall of links standing where the teaching should
 * be. A resource is not a lesson and must not be counted, ticked or completed.
 */
export interface CourseResource {
  id: string;
  /**
   * A site's own name. A proper noun, so it is never translated — but some of
   * these genuinely go by two names ("Ajira Portal (PSRS)" / "(Utumishi)"), so
   * it stays bilingual like everything else here.
   */
  name: Bilingual;
  note: Bilingual;
  url: string;
}

export interface ShortCourse {
  id: string;
  /**
   * Every course is free. Deliberate: a job seeker with no income is exactly
   * who needs this, and charging them for "where to look for work" would be
   * indefensible. The field stays so a future non-course content type can
   * differ, but nothing in the Learning Hub is ever gated.
   */
  tier: "free";
  title: Bilingual;
  blurb: Bilingual;
  minutes: number;
  units: CourseUnit[];
  /**
   * Places to go, shown as a compact list. Deliberately NOT units: they add no
   * progress, so a course can never be "completed" by opening six websites.
   */
  resources?: CourseResource[];
  /**
   * The unit the resource list belongs after. Explicit rather than "always at
   * the bottom": the list exists to serve one step (the one about looking at
   * listings), and dropping it at the end of the card would separate them.
   */
  resourcesAfter?: string;
}

/** Deterministic, testable: no navigator, no state. */
export function courseTotal(course: ShortCourse): number {
  return course.units.length;
}

export function courseDone(p: CourseProgress, course: ShortCourse): number {
  return course.units.filter((u) => p.done.includes(u.id)).length;
}

export function coursePercent(p: CourseProgress, course: ShortCourse): number {
  const total = courseTotal(course);
  return total === 0 ? 0 : Math.round((courseDone(p, course) / total) * 100);
}

export function courseIsComplete(p: CourseProgress, course: ShortCourse): boolean {
  return courseDone(p, course) === courseTotal(course);
}

/** Lessons teach; used by the card to label them honestly. */
export function courseLessonCount(course: ShortCourse): number {
  return course.units.filter((u) => u.kind === "lesson").length;
}

/** Kept so a lock can never sneak back in unnoticed: no course is ever gated. */
export function courseIsLocked(_course: ShortCourse, _hasPremium?: boolean): boolean {
  return false;
}

async function read(key: string): Promise<CourseProgress> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { ...EMPTY_COURSE };
    const parsed = JSON.parse(raw) as Partial<CourseProgress>;
    return { done: Array.isArray(parsed.done) ? parsed.done.filter((d) => typeof d === "string") : [] };
  } catch {
    return { ...EMPTY_COURSE };
  }
}

async function write(key: string, p: CourseProgress): Promise<CourseProgress> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(p));
  } catch {
    /* best-effort — a lost tick is not worth breaking the hub for */
  }
  return p;
}

export async function getCourseProgress(key: string): Promise<CourseProgress> {
  return read(key);
}

/**
 * Ticks one unit. Unknown ids are ignored so a stale build or a renamed unit
 * can never poison the store, and ticking twice is a no-op.
 */
export async function markCourseUnit(key: string, course: ShortCourse, unitId: string): Promise<CourseProgress> {
  const cur = await read(key);
  if (!course.units.some((u) => u.id === unitId)) return cur;
  if (cur.done.includes(unitId)) return cur;
  return write(key, { done: [...cur.done, unitId] });
}

export async function resetCourse(key: string): Promise<CourseProgress> {
  return write(key, { ...EMPTY_COURSE });
}
