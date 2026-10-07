import { cvProvenanceLines, provenanceSentence } from "./chat-document";
import type { CVData } from "@sumaiya/types";

const full = {
  personalInfo: { fullName: "Amina Juma", phone: "0712345678", email: "a@b.com", location: "Dar es Salaam" },
  summary: "Mtaalamu wa mauzo",
  experience: [{ title: "Sales Officer", company: "CCBRT", description: "Niluza bidhaa za dawa" }],
  skills: Array.from({ length: 9 }, (_, i) => ({ name: `skill-${i}` })),
  education: [{ school: "UDSM", degree: "Biashara" }],
} as unknown as CVData;

describe("the document card's provenance line (§3.4)", () => {
  it("says what she used, in the order a person would say it", () => {
    const { used } = cvProvenanceLines(full, "sw");
    expect(used[0]).toBe("jina");
    expect(used).toContain("muhtasari");
    expect(used).toContain("uzoefu wa mauzo");
    expect(used).toContain("ujuzi 9");
    expect(used).toContain("elimu");
  });

  it("names the real missing field rather than staying silent", () => {
    const bare = { personalInfo: { fullName: "Amina Juma" }, experience: [], skills: [] } as unknown as CVData;
    const { missing } = cvProvenanceLines(bare, "sw");
    expect(missing).toContain("namba ya simu");
    expect(missing).toContain("barua pepe");
    expect(missing).toContain("uzoefu wa kazi");
  });

  it("assembles the sentence the card renders, and never an empty list", () => {
    expect(provenanceSentence(full, "sw")).toMatch(/^Nilichotumia: jina, muhtasari, uzoefu wa mauzo, ujuzi 9, elimu\. /);
    expect(provenanceSentence(full, "sw")).toContain("Sikukosa kitu muhimu.");
    const bare = { personalInfo: { fullName: "A", phone: "07", email: "a@b", location: "Dsm" } } as unknown as CVData;
    expect(provenanceSentence(bare, "sw")).toContain("Nilichokosa:");
    // English is the other half of the same contract.
    expect(provenanceSentence(full, "en")).toContain("What I used: name");
  });

  it("does not invent a field that is absent, and does not invent a count", () => {
    const bare = { personalInfo: { fullName: "A" } } as unknown as CVData;
    const { used } = cvProvenanceLines(bare, "sw");
    expect(used).toEqual(["jina"]);
    expect(provenanceSentence(bare, "sw")).not.toMatch(/ujuzi \d/);
  });
});
