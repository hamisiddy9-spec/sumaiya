import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import { createEmptyCVData, parseCVData, isTemplateId, type CVData, type TemplateId, type PersonalInfo, type ExperienceEntry, type EducationEntry, type SkillEntry, type LanguageEntry, type CertificationEntry, type RefereeEntry, type ProjectEntry } from "@/types";
import type { CV } from "@/lib/db/schema";
import { exportElementToPdf, buildCvText, ExportOverflowError, exportOverflowMessage } from "@/lib/pdf";
import type { Lang } from "@/lib/i18n/translations";

// Bounded auto-retry for a failed autosave. A transient network blip used to
// leave the edit unsaved until the user's NEXT edit (or a manual tap) — this
// retries a few times on its own with backoff. Module-level because the store
// is a singleton; a fresh save (new edit) supersedes any pending retry.
let saveRetryTimer: ReturnType<typeof setTimeout> | undefined;
let saveAttempts = 0;
const SAVE_RETRY_BACKOFF_MS = [2000, 5000, 10000];

interface EditorState {
  title: string;
  cv: CVData;
  templateId: TemplateId;
  primaryColor: string;
  fontFamily: string;
  isSaving: boolean;
  saveError: string | null;
  lastSaved?: Date;
  activeSection: string;
  accessToken: string;

  setInitialState: (doc: CV) => void;
  setAccessToken: (token: string) => void;
  setTitle: (title: string) => void;
  setActiveSection: (section: string) => void;

  loadCvData: (data: CVData) => void;
  updatePersonal: (data: Partial<PersonalInfo>) => void;
  setSummary: (summary: string) => void;

  addExperience: () => void;
  updateExperience: (id: string, data: Partial<ExperienceEntry>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;

  addEducation: () => void;
  updateEducation: (id: string, data: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;
  reorderEducation: (fromIndex: number, toIndex: number) => void;

  addSkill: () => void;
  updateSkill: (id: string, data: Partial<SkillEntry>) => void;
  removeSkill: (id: string) => void;
  reorderSkills: (fromIndex: number, toIndex: number) => void;

  addLanguage: () => void;
  updateLanguage: (id: string, data: Partial<LanguageEntry>) => void;
  removeLanguage: (id: string) => void;
  reorderLanguages: (fromIndex: number, toIndex: number) => void;

  addCertification: () => void;
  updateCertification: (id: string, data: Partial<CertificationEntry>) => void;
  removeCertification: (id: string) => void;
  reorderCertifications: (fromIndex: number, toIndex: number) => void;
  addProject: () => void;
  updateProject: (id: string, data: Partial<ProjectEntry>) => void;
  removeProject: (id: string) => void;
  reorderProjects: (fromIndex: number, toIndex: number) => void;
  addReferee: () => void;
  updateReferee: (id: string, data: Partial<RefereeEntry>) => void;
  removeReferee: (id: string) => void;
  reorderReferees: (fromIndex: number, toIndex: number) => void;
  setHobbies: (hobbies: string) => void;
  toggleSectionVisibility: (section: string) => void;
  setSectionOrder: (order: string[]) => void;
  setDensity: (density: "compact" | "normal" | "airy") => void;
  setMode: (mode: string) => void;

  setTemplate: (id: TemplateId) => void;
  setPrimaryColor: (color: string) => void;
  setFontFamily: (font: string) => void;

  saveCv: (id: string, opts?: { keepalive?: boolean }) => Promise<void>;
  exportPdf: (previewRef: React.RefObject<HTMLDivElement>, lang?: Lang) => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    title: "My CV",
    cv: createEmptyCVData(),
    templateId: "nakuru",
    primaryColor: "#DA4A1C",
    fontFamily: "Inter",
    isSaving: false,
    saveError: null,
    activeSection: "personal",
    accessToken: "",

    setAccessToken: (token) => set((s) => { s.accessToken = token; }),

    setInitialState: (doc) => {
      set((state) => {
        state.title = doc.title;
        state.cv = parseCVData(doc.data);
        state.templateId = isTemplateId(doc.templateId) ? doc.templateId : "nakuru";
        state.primaryColor = doc.primaryColor;
        state.fontFamily = doc.fontFamily;
      });
    },

    setTitle: (title) => set((s) => { s.title = title; }),
    setActiveSection: (section) => set((s) => { s.activeSection = section; }),

    // Replace the whole CV payload (keeps template/colour/font/title) — used by
    // "Start from an example" to load the sample into an empty editor.
    loadCvData: (data) => set((s) => { s.cv = parseCVData(data); }),
    updatePersonal: (data) => set((s) => { Object.assign(s.cv.personal, data); }),
    setSummary: (summary) => set((s) => { s.cv.summary = summary; }),

    addExperience: () => set((s) => {
      s.cv.experience.push({ id: nanoid(), company: "", position: "", startDate: "", endDate: "Present", current: true, description: "" });
    }),
    updateExperience: (id, data) => set((s) => {
      const idx = s.cv.experience.findIndex((e) => e.id === id);
      if (idx !== -1) Object.assign(s.cv.experience[idx], data);
    }),
    removeExperience: (id) => set((s) => {
      s.cv.experience = s.cv.experience.filter((e) => e.id !== id);
    }),
    reorderExperience: (from, to) => set((s) => {
      const items = s.cv.experience.splice(from, 1);
      s.cv.experience.splice(to, 0, items[0]);
    }),

    addEducation: () => set((s) => {
      s.cv.education.push({ id: nanoid(), institution: "", degree: "", field: "", startDate: "", endDate: "" });
    }),
    updateEducation: (id, data) => set((s) => {
      const idx = s.cv.education.findIndex((e) => e.id === id);
      if (idx !== -1) Object.assign(s.cv.education[idx], data);
    }),
    removeEducation: (id) => set((s) => {
      s.cv.education = s.cv.education.filter((e) => e.id !== id);
    }),
    reorderEducation: (from, to) => set((s) => {
      const items = s.cv.education.splice(from, 1);
      s.cv.education.splice(to, 0, items[0]);
    }),

    addSkill: () => set((s) => {
      s.cv.skills.push({ id: nanoid(), name: "", level: 3 });
    }),
    updateSkill: (id, data) => set((s) => {
      const idx = s.cv.skills.findIndex((e) => e.id === id);
      if (idx !== -1) Object.assign(s.cv.skills[idx], data);
    }),
    removeSkill: (id) => set((s) => {
      s.cv.skills = s.cv.skills.filter((e) => e.id !== id);
    }),
    reorderSkills: (from, to) => set((s) => {
      const items = s.cv.skills.splice(from, 1);
      s.cv.skills.splice(to, 0, items[0]);
    }),

    addLanguage: () => set((s) => {
      s.cv.languages.push({ id: nanoid(), name: "", proficiency: "Intermediate" });
    }),
    updateLanguage: (id, data) => set((s) => {
      const idx = s.cv.languages.findIndex((e) => e.id === id);
      if (idx !== -1) Object.assign(s.cv.languages[idx], data);
    }),
    removeLanguage: (id) => set((s) => {
      s.cv.languages = s.cv.languages.filter((e) => e.id !== id);
    }),
    reorderLanguages: (from, to) => set((s) => {
      const items = s.cv.languages.splice(from, 1);
      s.cv.languages.splice(to, 0, items[0]);
    }),

    addCertification: () => set((s) => {
      s.cv.certifications.push({ id: nanoid(), name: "", issuer: "", date: "", url: "" });
    }),
    updateCertification: (id, data) => set((s) => {
      const idx = s.cv.certifications.findIndex((e) => e.id === id);
      if (idx !== -1) Object.assign(s.cv.certifications[idx], data);
    }),
    removeCertification: (id) => set((s) => {
      s.cv.certifications = s.cv.certifications.filter((e) => e.id !== id);
    }),
    reorderCertifications: (from, to) => set((s) => {
      const items = s.cv.certifications.splice(from, 1);
      s.cv.certifications.splice(to, 0, items[0]);
    }),
    addProject: () => set((s) => {
      if (!s.cv.projects) s.cv.projects = [];
      s.cv.projects.push({ id: nanoid(), name: "", description: "", role: "", url: "", date: "" });
    }),
    updateProject: (id, data) => set((s) => {
      const idx = s.cv.projects.findIndex((e) => e.id === id);
      if (idx !== -1) Object.assign(s.cv.projects[idx], data);
    }),
    removeProject: (id) => set((s) => {
      s.cv.projects = s.cv.projects.filter((e) => e.id !== id);
    }),
    reorderProjects: (from, to) => set((s) => {
      const items = s.cv.projects.splice(from, 1);
      s.cv.projects.splice(to, 0, items[0]);
    }),
    addReferee: () => set((s) => {
      s.cv.referees.push({ id: nanoid(), name: "", title: "", company: "", email: "", phone: "" });
    }),
    updateReferee: (id, data) => set((s) => {
      const idx = s.cv.referees.findIndex((e) => e.id === id);
      if (idx !== -1) Object.assign(s.cv.referees[idx], data);
    }),
    removeReferee: (id) => set((s) => {
      s.cv.referees = s.cv.referees.filter((e) => e.id !== id);
    }),
    reorderReferees: (from, to) => set((s) => {
      const items = s.cv.referees.splice(from, 1);
      s.cv.referees.splice(to, 0, items[0]);
    }),
    setHobbies: (hobbies) => set((s) => { s.cv.hobbies = hobbies; }),
    setSectionOrder: (order) => set((s) => { s.cv.sectionOrder = order; }),
    setDensity: (density) => set((s) => { s.cv.density = density; }),
    setMode: (mode) => set((s) => { s.cv.mode = mode; }),
    toggleSectionVisibility: (section) => set((s) => {
      const hidden = s.cv.hiddenSections ?? [];
      if (hidden.includes(section)) {
        s.cv.hiddenSections = hidden.filter((h) => h !== section);
      } else {
        s.cv.hiddenSections = [...hidden, section];
      }
    }),

    setTemplate: (id) => set((s) => { s.templateId = id; }),
    setPrimaryColor: (color) => set((s) => { s.primaryColor = color; }),
    setFontFamily: (font) => set((s) => { s.fontFamily = font; }),

    saveCv: async (id, opts) => {
      // A new save supersedes any pending auto-retry from a prior failure.
      if (saveRetryTimer) { clearTimeout(saveRetryTimer); saveRetryTimer = undefined; }
      const { cv: cvData, title, templateId, primaryColor, fontFamily, accessToken } = get();
      set((s) => { s.isSaving = true; s.saveError = null; });
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
        const res = await fetch(`/api/cv/${id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ title, templateId, primaryColor, fontFamily, data: cvData }),
          // On page-unload flushes, keepalive lets the request survive the tab
          // teardown that would otherwise abort a normal fetch (dropping the last
          // edits). CV JSON is well under the 64KB keepalive body limit.
          keepalive: opts?.keepalive ?? false,
        });
        if (!res.ok) throw new Error(`Save failed (${res.status})`);
        saveAttempts = 0;
        set((s) => { s.lastSaved = new Date(); });
      } catch (err) {
        set((s) => { s.saveError = err instanceof Error ? err.message : "Failed to save"; });
        // Auto-retry a live (non-unload) save a few times with backoff before
        // falling back to the passive tap-to-retry affordance. Unload flushes
        // (keepalive) aren't retried — the component is already tearing down.
        if (!opts?.keepalive && saveAttempts < SAVE_RETRY_BACKOFF_MS.length) {
          const delay = SAVE_RETRY_BACKOFF_MS[saveAttempts];
          saveAttempts += 1;
          saveRetryTimer = setTimeout(() => { saveRetryTimer = undefined; get().saveCv(id); }, delay);
        }
      } finally {
        set((s) => { s.isSaving = false; });
      }
    },

    exportPdf: async (previewRef, lang = "en") => {
      if (!previewRef.current) return;
      const { title, cv, accessToken } = get();
      // Fall back to the person's name (matching the .txt/.docx handlers) so an
      // empty title never yields a nameless ".pdf" dotfile, and strip filesystem-
      // unsafe characters that browsers otherwise mangle or drop.
      const safeName = (title || cv.personal?.fullName || "CV")
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, "_") || "CV";
      try {
        await exportElementToPdf(previewRef.current, {
          filename: `${safeName}.pdf`,
          // Embed an invisible, ATS-readable text layer from the structured CV.
          textLayer: buildCvText(cv, lang),
          // NEVER deliver a page-box-clipped CV: the A4 sheet hides its own
          // overflow, so an over-long CV used to export ONE page cut off
          // mid-sentence while the invisible text layer still carried all 7,347
          // characters — the applicant's own ATS score describing a document
          // that was never delivered (measured 2026-09-20, QA-IO-MATRIX D9).
          // With this flag the export refuses, visibly, instead.
          refuseIfClipped: true,
        });
      } catch (err) {
        const message = err instanceof ExportOverflowError
          ? exportOverflowMessage(lang === "sw", err.overflow)
          : err instanceof Error ? err.message : "PDF export failed";
        set((s) => { s.saveError = message; });
        // Rethrow so the caller cannot report success (the editor shows its
        // export-failed overlay with this same message). Silently returning
        // here is how a refusal would turn into a second silent failure.
        throw err;
      }
      // Fire-and-forget download log
      const cvId = typeof window !== "undefined"
        ? window.location.pathname.split("/").pop()
        : null;
      if (cvId && cvId !== "new") {
        const headers: Record<string, string> = {};
        if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
        fetch(`/api/cv/${cvId}/download`, { method: "POST", headers }).catch(() => {});
      }
    },
  }))
);
