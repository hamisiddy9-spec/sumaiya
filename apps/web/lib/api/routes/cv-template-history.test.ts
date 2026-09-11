import { describe, it, expect } from "vitest";
import { withTemplateInHistory } from "./cv";

describe("withTemplateInHistory — the premium-template grandfather fix", () => {
  it("appends a new template id to existing history", () => {
    expect(withTemplateInHistory(["nakuru"], "rift")).toEqual(["nakuru", "rift"]);
  });

  it("never duplicates an id already in history", () => {
    expect(withTemplateInHistory(["nakuru", "rift"], "rift")).toEqual(["nakuru", "rift"]);
  });

  it("treats a non-array (stale row from before this column existed) as empty history", () => {
    expect(withTemplateInHistory(null, "rift")).toEqual(["rift"]);
    expect(withTemplateInHistory(undefined, "rift")).toEqual(["rift"]);
    expect(withTemplateInHistory("not-an-array", "rift")).toEqual(["rift"]);
  });

  it("no-ops when there's no templateId to add", () => {
    expect(withTemplateInHistory(["nakuru"], undefined)).toEqual(["nakuru"]);
  });

  it("never mutates the input array", () => {
    const original = ["nakuru"];
    withTemplateInHistory(original, "rift");
    expect(original).toEqual(["nakuru"]);
  });
});
