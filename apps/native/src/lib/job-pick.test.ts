/**
 * The Android side of the same choice.
 *
 * The picker in the chat (components/chat/job-choice-sheet.tsx) imports the
 * shared model from @sumaiya/api-client, so these assertions run against the
 * very code the web assistant renders — and they pin the exact strings so the
 * two surfaces cannot drift.
 */
import {
  buildPickListUrl,
  buildPickRowUrl,
  isUsableJd,
  jobChoiceAction,
  jobChoiceModel,
  jobToJd,
  MIN_JD_CHARS,
  parsePickResponse,
} from "@sumaiya/api-client";

describe("native: the two paths in the chat", () => {
  it("offers our listings and the user's own source", () => {
    expect(jobChoiceModel().paths).toEqual(["ours", "own"]);
    expect(jobChoiceModel({ feedEmpty: true }).paths).toEqual(["own"]);
  });

  it("requests the projected pick-list, never the full feed", () => {
    expect(jobChoiceAction("ours").request).toBe("/api/jobs?light=1&limit=12");
    expect(jobChoiceAction("own").request).toBeNull();
  });

  it("fetches one advert by id after the user picks it", () => {
    expect(buildPickRowUrl("abc")).toBe("/api/jobs?id=abc");
    expect(buildPickListUrl({ q: "sales" })).toBe("/api/jobs?light=1&limit=12&q=sales");
  });

  it("hands the snap screen the same JD string the web assistant builds", () => {
    const jd = jobToJd({ title: "Sales Officer job", company: "CCBRT", description: "y".repeat(80) });
    expect(jd).toBe(`Sales Officer job\nCCBRT\n\n${"y".repeat(80)}`);
    expect(jd.startsWith("Sales Officer job\nCCBRT\n\n")).toBe(true);
    expect(isUsableJd(jd)).toBe(true);
  });

  it("refuses a listing with no advert text (never fabricates one)", () => {
    expect(jobToJd({ title: "Sales Officer job", company: "CCBRT", description: "" })).toBe("");
    expect(isUsableJd("too short")).toBe(false);
    expect(MIN_JD_CHARS).toBe(60);
  });

  it("ignores malformed rows from the server", () => {
    expect(parsePickResponse({ data: [{ id: "1", title: "Sales Officer" }, { id: "2" }] })).toEqual([
      { id: "1", title: "Sales Officer", company: "", location: "" },
    ]);
  });
});
