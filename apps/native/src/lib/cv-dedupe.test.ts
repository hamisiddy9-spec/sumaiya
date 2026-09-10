import { dedupe } from "../lib/cv-dedupe";
import type { CV } from "@sumaiya/types";

const mk = (id: string, name: string, title: string, updatedAt: string): CV =>
  ({
    id,
    userId: "me",
    templateId: "classic",
    title,
    data: { personalInfo: { fullName: name, email: "", phone: "", location: "" }, experience: [], education: [], skills: [], certifications: [], languages: [] },
    createdAt: new Date(updatedAt),
    updatedAt: new Date(updatedAt),
  }) as CV;

describe("dedupe", () => {
  it("drops the local row when a caught-up server twin exists", () => {
    const list = [
      mk("abc123", "Asha Mwangi", "Asha Mwangi", "2026-09-10T00:00:00Z"),
      mk("m_xyz", "Asha Mwangi", "Asha Mwangi", "2026-09-10T00:00:01Z"),
    ];
    const { kept, drop } = dedupe(list);
    expect(drop).toEqual(["abc123"]);
    expect(kept.map((c) => c.id)).toEqual(["m_xyz"]);
  });

  it("keeps the local row when the server twin is stale (unsynced edit)", () => {
    const list = [
      mk("abc123", "Asha Mwangi", "Asha Mwangi", "2026-09-10T00:05:00Z"),
      mk("m_xyz", "Asha Mwangi", "Asha Mwangi", "2026-09-10T00:00:00Z"),
    ];
    expect(dedupe(list).drop).toEqual([]);
  });

  it("never merges two blank 'My CV' rows", () => {
    const list = [
      mk("a1", "", "My CV", "2026-09-10T00:00:00Z"),
      mk("m_b2", "", "My CV", "2026-09-10T00:00:01Z"),
    ];
    expect(dedupe(list).drop).toEqual([]);
  });

  it("keeps two genuinely different CVs with different names", () => {
    const list = [
      mk("m_a", "Asha Mwangi", "Warehouse CV", "2026-09-10T00:00:00Z"),
      mk("m_b", "Asha Mwangi", "Sales CV", "2026-09-10T00:00:00Z"),
    ];
    expect(dedupe(list).kept).toHaveLength(2);
  });
});
