import { describe, it, expect } from "vitest";
import { toolCatalogPrompt } from "./tools";

/**
 * The bug this guards: Sumaiya knew 34 things she could DO to a document and
 * nothing about the fact that the person can walk away with the file. Someone
 * could be told to "make this change" and never learn the PDF export exists.
 */
describe("toolCatalogPrompt — export knowledge", () => {
  it("always tells the assistant the document can be downloaded", () => {
    const prompt = toolCatalogPrompt({ hasCv: true, hasFile: true });
    expect(prompt).toContain("GETTING THE DOCUMENT OUT");
    expect(prompt.toLowerCase()).toContain("pakua");
  });

  it("still includes it when no tool is available — she is present everywhere", () => {
    // This is the case that used to return an empty string: a brand-new user
    // with no CV and no attachment. She must still know about exports.
    const prompt = toolCatalogPrompt({ hasCv: false, hasFile: false });
    expect(prompt.length).toBeGreaterThan(100);
    expect(prompt).toContain("GETTING THE DOCUMENT OUT");
  });

  it("names both real export paths, so she points at the right button", () => {
    const prompt = toolCatalogPrompt({ hasCv: true });
    expect(prompt).toContain("CV zangu");
    expect(prompt).toContain("Cover letter");
    expect(prompt).toContain("Sambaza");
  });

  it("forbids the two things that would send someone away empty-handed", () => {
    const prompt = toolCatalogPrompt({ hasCv: true });
    expect(prompt).toContain("never say the app cannot produce one");
    expect(prompt).toContain("never tell them to retype it somewhere else");
  });

  it("does not invent a tool id to go with it", () => {
    const prompt = toolCatalogPrompt({ hasCv: true });
    // The knowledge block must not read as an action the model can return.
    expect(prompt).not.toMatch(/export\.[a-z]+ —/);
  });
});
