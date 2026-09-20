/**
 * The choice itself: "lenga kwenye kazi" must offer BOTH paths, and each path
 * must be provably wired to a real place.
 *
 * These assertions run against the module the chat component renders — the same
 * one the Android sheet imports (see apps/native/src/lib/job-pick.test.ts, which
 * asserts the identical strings), so the two surfaces cannot drift apart.
 */
import { describe, it, expect } from "vitest";
import {
  buildPickListUrl,
  buildPickRowUrl,
  isPickRequest,
  isUsableJd,
  jobChoiceAction,
  jobChoiceModel,
  jobToJd,
  normalizePickQuery,
  parsePickDetail,
  parsePickResponse,
  PICK_LIMIT_DEFAULT,
  PICK_LIMIT_MAX,
  PICK_QUERY_MAX,
  MIN_JD_CHARS,
} from "@sumaiya/api-client";

// A real row from the live feed (verbatim, 2026-09-20) — the same advert the
// device sweep found already sitting in the snap screen.
const CCBRT = {
  id: "jb_sales_officer",
  title: "Sales Officer job",
  company: "CCBRT",
  location: "Tanzania",
  description: "Sales Officer job\nCCBRT is a leading disability hospital.",
};

describe("the two paths, from one place", () => {
  it("offers our listings AND the user's own source", () => {
    const m = jobChoiceModel();
    expect(m.paths).toEqual(["ours", "own"]);
  });

  it("does not offer our listings when the feed is empty — never a list we do not have", () => {
    expect(jobChoiceModel({ feedEmpty: true }).paths).toEqual(["own"]);
  });

  it("does not re-ask for a job already in the thread", () => {
    expect(jobChoiceModel({ hasPendingJob: true }).continuePending).toBe(true);
    expect(jobChoiceModel().continuePending).toBe(false);
  });

  it("routes 'ours' to the light pick-list and 'own' to no request at all", () => {
    expect(jobChoiceAction("ours")).toEqual({ kind: "ours", request: buildPickListUrl() });
    expect(jobChoiceAction("own")).toEqual({ kind: "own", request: null });
  });
});

describe("the pick-list is cheap and honest", () => {
  it("asks for the projected list, not the full feed", () => {
    const url = buildPickListUrl();
    expect(url).toBe(`/api/jobs?light=1&limit=${PICK_LIMIT_DEFAULT}`);
    expect(url).toContain("light=1"); // no descriptions: ~1–2 KB, not ~350 KB
  });

  it("clamps the limit and carries a normalised search term", () => {
    expect(buildPickListUrl({ limit: 999 })).toContain(`limit=${PICK_LIMIT_MAX}`);
    expect(buildPickListUrl({ limit: 0 })).toContain(`limit=${PICK_LIMIT_DEFAULT}`);
    expect(buildPickListUrl({ q: "  sales   officer  " })).toContain("q=sales+officer");
  });

  it("strips LIKE wildcards and caps the query, because a search box is user input", () => {
    expect(normalizePickQuery("100%_man\\ager")).toBe("100 man ager");
    expect(normalizePickQuery("x".repeat(200))).toHaveLength(PICK_QUERY_MAX);
    expect(normalizePickQuery(undefined)).toBe("");
  });

  it("fetches one advert by id, encoded", () => {
    expect(buildPickRowUrl("a b/c")).toBe("/api/jobs?id=a%20b%2Fc");
  });

  it("leaves the full public feed untouched when no picker parameter is present", () => {
    expect(isPickRequest({})).toBe(false);
    expect(isPickRequest({ light: "1" })).toBe(true);
    expect(isPickRequest({ q: "sales" })).toBe(true);
    expect(isPickRequest({ id: "abc" })).toBe(true);
    expect(isPickRequest({ limit: "12" })).toBe(true);
    expect(isPickRequest({ q: "   " })).toBe(false); // whitespace is not a search
  });

  it("drops malformed rows instead of rendering a job the server never sent", () => {
    expect(parsePickResponse({ data: [{ id: "1", title: "Sales Officer" }, { id: "", title: "x" }, { title: "no id" }, null, "junk"] }))
      .toEqual([{ id: "1", title: "Sales Officer", company: "", location: "" }]);
    expect(parsePickResponse(null)).toEqual([]);
    expect(parsePickResponse({ data: "nope" })).toEqual([]);
  });

  it("reads the one chosen advert, with its real description", () => {
    expect(parsePickDetail({ data: [CCBRT] })?.description).toContain("disability hospital");
    expect(parsePickDetail({ data: [] })).toBeNull();
    expect(parsePickDetail({ data: [{ id: "1" }] })).toBeNull(); // no title → not a job
  });
});

describe("what the engine is handed", () => {
  it("hands over the exact shape the Android jobs screen has always used", () => {
    expect(jobToJd(CCBRT)).toBe(`${CCBRT.title}\n${CCBRT.company}\n\n${CCBRT.description}`);
  });

  it("refuses a listing with no advert text rather than inventing one", () => {
    expect(jobToJd({ title: "Sales Officer job", company: "CCBRT", description: "" })).toBe("");
    expect(jobToJd({ description: "   " })).toBe("");
    expect(isUsableJd(jobToJd({ title: "Sales Officer", company: "CCBRT", description: "" }))).toBe(false);
  });

  it("keeps the same 60-character floor the snap screen already enforces", () => {
    expect(MIN_JD_CHARS).toBe(60);
    expect(isUsableJd("short advert")).toBe(false);
    expect(isUsableJd("x".repeat(MIN_JD_CHARS))).toBe(true);
    expect(isUsableJd(jobToJd(CCBRT))).toBe(true); // the text the picker actually hands over
  });
});
