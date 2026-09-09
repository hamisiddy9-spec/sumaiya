import { z } from "zod";

// ─── Zod Schemas for Runtime Validation ──────────────────────────────────────

export const personalInfoSchema = z.object({
  fullName: z.string(),
  jobTitle: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  photo: z.string().optional(),
});

export const experienceEntrySchema = z.object({
  id: z.string(),
  company: z.string(),
  position: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  description: z.string(),
});

export const educationEntrySchema = z.object({
  id: z.string(),
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  grade: z.string().optional(),
  description: z.string().optional(),
});

export const skillEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});

export const languageEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.enum(["Native", "Fluent", "Advanced", "Intermediate", "Basic"]),
});

export const certificationEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  url: z.string().optional(),
});

export const projectEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  role: z.string().optional(),
  url: z.string().optional(),
  date: z.string().optional(),
});

export const refereeEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  company: z.string(),
  email: z.string(),
  phone: z.string(),
});

export const cvDataSchema = z.object({
  personal: personalInfoSchema,
  summary: z.string(),
  experience: z.array(experienceEntrySchema),
  education: z.array(educationEntrySchema),
  skills: z.array(skillEntrySchema),
  // Optional-with-default so CVs saved before projects existed still parse.
  projects: z.array(projectEntrySchema).default([]),
  languages: z.array(languageEntrySchema),
  certifications: z.array(certificationEntrySchema),
  referees: z.array(refereeEntrySchema),
  hobbies: z.string(),
  hiddenSections: z.array(z.string()).optional(),
  sectionOrder: z.array(z.string()).optional(),
  density: z.enum(["compact", "normal", "airy"]).optional(),
  mode: z.string().optional(),
});

export function parseCVData(data: unknown): CVData {
  const result = cvDataSchema.safeParse(data);
  if (result.success) return result.data;
  return createEmptyCVData();
}

// ─── CV Data Types ────────────────────────────────────────────────────────────

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  photo?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  grade?: string;
  description?: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  level: 1 | 2 | 3 | 4 | 5;
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency: "Native" | "Fluent" | "Advanced" | "Intermediate" | "Basic";
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  role?: string;
  url?: string;
  date?: string;
}

export interface RefereeEntry {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
}

export interface CVData {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  projects: ProjectEntry[];
  languages: LanguageEntry[];
  certifications: CertificationEntry[];
  referees: RefereeEntry[];
  hobbies: string;
  hiddenSections?: string[];
  sectionOrder?: string[];
  density?: "compact" | "normal" | "airy";
  mode?: string;
}

// ─── Career Profile (source of truth) ─────────────────────────────────────────
// The single verified career fact-set that CVs are derived from. One profile →
// many targeted CVs. Lives on user_profile.career_profile (jsonb).
//
// Section entry types are REUSED from CVData so profile↔CV mapping is
// mechanical and the deterministic engines (ats-score, job-match, tailor) keep
// consuming CVData built from the profile.
//
// Provenance seam (Task 2 fills this in; Task 1 only defines it):
// `factMeta` tags individual entries by their id with a status. When Task 2
// lands, AI-drafted facts get "needs-confirmation" / "ai-suggested" and the
// TRUTH_CONSTRAINT provenance is recorded here — never beside it.

export type FactStatus = "confirmed" | "needs-confirmation" | "ai-suggested" | "inferred" | "unverified";
// Provenance of a career fact. `cv:<id>` means "derived from saved CV <id>".
// Priority (iron rule): user-edited > interview > conversation > cv:<id> >
// legacy (ai-draft/backfill/import). A user-edited fact is NEVER silently
// overwritten by a derived one.
export type FactSource =
  | "user-edited"   // typed/saved by the user directly (Settings / editor save)
  | "user"          // legacy: user-typed before provenance existed (treated as user-edited)
  | "interview"     // answered in the Career Interview
  | "conversation"  // confirmed while chatting with Sumaiya / built from a chat
  | `cv:${string}`  // derived from a saved CV (the suffix is the CV id)
  | "ai-draft"      // AI-generated, not yet confirmed
  | "backfill"      // legacy bulk migration
  | "import";       // legacy import path

export interface FactMeta {
  status?: FactStatus;
  source?: string;
  /** 0..1 — how confident we are the fact is real (1 = user-stated/typed). */
  confidence?: number;
  updatedAt?: string;
}

export interface AchievementEntry {
  id: string;
  title: string;
  description?: string;
  date?: string;
  category?: string;
}

export interface VolunteerEntry {
  id: string;
  organization: string;
  role: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
}

export interface CareerPreferences {
  targetRoles: string[];
  preferredLocations: string[];
  remotePreference: "remote" | "hybrid" | "onsite" | "";
  salaryExpectation?: string;
  noticePeriod?: string;
  workAuthorization?: string;
  availability?: string;
}

export interface CareerProfile {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  volunteer: VolunteerEntry[];
  references: RefereeEntry[];
  preferences: CareerPreferences;
  factMeta?: Record<string, FactMeta>;
}

export function createEmptyCareerProfile(): CareerProfile {
  return {
    personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
    projects: [],
    achievements: [],
    volunteer: [],
    references: [],
    preferences: {
      targetRoles: [],
      preferredLocations: [],
      remotePreference: "",
    },
  };
}

// ─── Career Profile Zod (additive; section arrays default so old/partial
// payloads always parse). Entry schemas mirror the CVData ones.
export const achievementEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  date: z.string().optional(),
  category: z.string().optional(),
});

export const volunteerEntrySchema = z.object({
  id: z.string(),
  organization: z.string(),
  role: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  description: z.string().optional(),
});

export const careerPreferencesSchema = z.object({
  targetRoles: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  remotePreference: z.enum(["remote", "hybrid", "onsite", ""]).default(""),
  salaryExpectation: z.string().optional(),
  noticePeriod: z.string().optional(),
  workAuthorization: z.string().optional(),
  availability: z.string().optional(),
});

export const factMetaSchema = z.object({
  status: z.enum(["confirmed", "needs-confirmation", "ai-suggested", "inferred", "unverified"]).optional(),
  source: z.string().max(64).optional(),
  confidence: z.number().min(0).max(1).optional(),
  updatedAt: z.string().optional(),
});

export const careerProfileSchema = z.object({
  personal: personalInfoSchema,
  summary: z.string(),
  experience: z.array(experienceEntrySchema).default([]),
  education: z.array(educationEntrySchema).default([]),
  skills: z.array(skillEntrySchema).default([]),
  certifications: z.array(certificationEntrySchema).default([]),
  languages: z.array(languageEntrySchema).default([]),
  projects: z.array(projectEntrySchema).default([]),
  achievements: z.array(achievementEntrySchema).default([]),
  volunteer: z.array(volunteerEntrySchema).default([]),
  references: z.array(refereeEntrySchema).default([]),
  preferences: careerPreferencesSchema.default({
    targetRoles: [],
    preferredLocations: [],
    remotePreference: "",
  }),
  factMeta: z.record(z.string(), factMetaSchema).optional(),
});

export function parseCareerProfile(data: unknown): CareerProfile {
  const result = careerProfileSchema.safeParse(data);
  if (result.success) return result.data;
  return createEmptyCareerProfile();
}

export const DEFAULT_SECTION_ORDER = [
  "summary", "experience", "projects", "education", "skills",
  "languages", "certifications", "referees", "hobbies",
] as const;

export type SectionKey = typeof DEFAULT_SECTION_ORDER[number];

export interface SectionTemplate {
  name: string;
  label: string;
  order: string[];
}

export function createEmptyCVData(): CVData {
  return {
    personal: { fullName: "", jobTitle: "", email: "", phone: "", location: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
    referees: [],
    hobbies: "",
  };
}

// ─── CV Templates ─────────────────────────────────────────────────────────────

export type TemplateId =
  | "rift" | "zahabu" | "nuru" | "pemba" | "malachite" | "coral" | "kioo"
  | "bento" | "zege" | "console" | "riso" | "vibe" | "neon"
  | "regent" | "marlowe" | "cavendish" | "haven"
  | "nakuru" | "kilimanjaro" | "serengeti" | "zanzibar" | "nile"
  | "ubuntu" | "savanna" | "sahara" | "nairobi" | "mombasa" | "victoria"
  | "canvas-magazine" | "monarch" | "vertex" | "berlin" | "atlas"
  | "aurora-edge" | "nordic-minimal" | "executive-one" | "tokyo-grid" | "silicon-pro"
  | "eclipse" | "muse" | "titan" | "alpine" | "nova"
  | "oxford" | "metro" | "horizon" | "ascent" | "imperial"
  | "meridian" | "apex" | "studio" | "grid" | "narrative"
  | "cascade"
  | "dusk"
  | "verdant"
  | "terracotta"
  | "slate-two"
  | "carbon"
  | "aurora-two"
  | "crimson"
  | "ocean"
  | "graphite"
  | "jade"
  | "ember"
  | "cobalt"
  | "storm"
  | "bloom"
  | "stripe"
  | "rail"
  | "inset"
  | "ribbon"
  | "edge"
  | "axis"
  | "ledger"
  | "serif-cv"
  | "flux"
  | "tempo"
  | "margin"
  | "script-cv"
  | "mono-cv"
  | "pier"
  | "herald"
  | "kibo"
  | "lodge"
  | "brisk"
  | "chrome"
  | "linen"
  | "denim"
  | "cocoa"
  | "slate-v2"
  | "onyx"
  | "cobblestone"
  | "capsule"
  | "ledge"
  | "ticker"
  | "slab"
  | "peel"
  | "trace"
  | "clean-cv"
  | "herald-cv"
  | "folio"
  | "atlas-v2"
  | "ruwenzori"
  | "turkana"
  | "aberdare"
  | "samburu"
  | "laikipia"
  | "marsabit"
  | "malindi"
  | "watamu"
  | "diani"
  | "lamu"
  | "busia"
  | "homabay"
  | "migori"
  | "kisii"
  | "kericho"
  | "kitale"
  | "machakos"
  | "kajiado"
  | "narok"
  | "voi"
  | "wajir"
  | "garissa"
  | "moyale"
  | "tanganyika"
  | "bangweulu"
  | "okavango"
  | "kariba"
  | "rufiji"
  | "ruvuma"
  | "kagera"
  | "lukuga"
  | "volta-cv"
  | "gambia-cv"
  | "cunene"
  | "limpopo-cv"
  | "kavango"
  | "tana"
  | "ewaso"
  | "galana"
  | "sabaki"
  | "athi"
  | "awash"
  | "baro"
  | "tekeze"
  | "mareb"
  | "gash"
  | "geneva"
  | "zurich"
  | "vienna"
  | "stockholm"
  | "oslo"
  | "copenhagen"
  | "helsinki"
  | "dublin"
  | "warsaw"
  | "prague"
  | "budapest"
  | "lisbon"
  | "madrid"
  | "athens"
  | "istanbul"
  | "dubai"
  | "singapore-cv"
  | "sydney-cv"
  | "melbourne"
  | "toronto"
  | "montreal"
  | "vancouver"
  | "chicago"
  | "boston"
  | "seattle"
  | "portland"
  | "austin"
  | "nashville"
  | "atlanta"
  | "houston"
  | "denver"
  | "dallas"
  | "minneapolis"
  | "indianapolis"
  | "charlotte"
  | "baltimore"
  | "tampa"
  | "sacramento"
  | "pittsburgh"
  | "cincinnati"
  | "louisville"
  | "richmond"
  | "raleigh"
  | "miami-cv"
  | "phoenix"
  | "detroit"
  | "memphis"
  | "st-louis"
  | "bauhaus"
  | "futura-cv"
  | "bodoni-cv"
  | "garamond-cv"
  | "caslon"
  | "palatino-cv"
  | "baskerville-cv"
  | "didot-cv"
  | "clarendon-cv"
  | "rockwell-cv"
  | "brutalist-cv"
  | "modernist-cv"
  | "constructivist"
  | "deco-cv"
  | "structuralist"
  | "impressionist-cv"
  | "baroque-cv"
  | "classical-cv"
  | "neoclassical-cv"
  | "avant-garde-cv"
  | "de-stijl"
  | "suprematist"
  | "dadaist"
  | "futurism-cv"
  | "nebula"
  | "cosmos"
  | "orbit"
  | "solstice"
  | "equinox"
  | "zenith"
  | "solaris"
  | "lunar"
  | "stellar"
  | "stratus"
  | "nimbus"
  | "cirrus"
  | "cumulus"
  | "altus"
  | "celeste"
  | "quantum"
  | "photon"
  | "quasar"
  | "pulsar"
  | "gravity"
  | "vector"
  | "neural"
  | "cipher"
  | "prism"
  | "mosaic"
  | "parallax"
  | "collage"
  | "panorama"
  | "montage"
  | "fjord"
  | "canyon"
  | "veldt"
  | "fractal"
  | "relief"
  | "tableau"
  | "cameo"
  | "vignette"
  | "lagoon"
  | "delta"
  | "plateau"
  | "highland"
  | "estuary"
  | "mesa"
  | "contour"
  | "silhouette";

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  previewColor: string;
  style: "sidebar" | "header" | "minimal" | "creative" | "classic";
  popular?: boolean;
}

export const TEMPLATES: Template[] = [
  { id: "rift",        name: "Rift",        description: "Premium colour sidebar · photo ring · skill bars", previewColor: "#12433D", style: "sidebar", popular: true },
  { id: "zahabu",      name: "Zahabu",      description: "Dark charcoal · gold accent · timeline",          previewColor: "#F2A93B", style: "sidebar", popular: true },
  { id: "nuru",        name: "Nuru",        description: "Infographic · stat strip · skill rings",          previewColor: "#C13E14", style: "creative", popular: true },
  { id: "pemba",       name: "Pemba",       description: "Editorial serif · masthead · drop cap",           previewColor: "#B57A18", style: "creative", popular: true },
  { id: "malachite",   name: "Malachite",   description: "Two-column · chip skills · ring photo",           previewColor: "#0E7490", style: "header",  popular: true },
  { id: "coral",       name: "Coral",       description: "Accent header bars · timeline · photo",           previewColor: "#E4572E", style: "sidebar", popular: true },
  { id: "kioo",        name: "Kioo",        description: "Full-height photo column · charcoal panel",       previewColor: "#1E3A5F", style: "sidebar", popular: true },
  { id: "bento",       name: "Bento",       description: "Bento-grid of rounded cards · contemporary",      previewColor: "#4F46E5", style: "creative", popular: true },
  { id: "zege",        name: "Zege",        description: "Neo-brutalist · thick borders · hard shadows",    previewColor: "#3D5AFE", style: "creative", popular: true },
  { id: "console",     name: "Console",     description: "Terminal · monospace · ascii meters",             previewColor: "#3FB950", style: "creative", popular: true },
  { id: "riso",        name: "Riso",        description: "Risograph poster · offset colour · numbered",     previewColor: "#F0466E", style: "creative", popular: true },
  { id: "vibe",        name: "Vibe",        description: "Vibrant gradient header · gradient meters",       previewColor: "#6366F1", style: "creative", popular: true },
  { id: "neon",        name: "Neon",        description: "Dark · sleek · gradient bars on cards",           previewColor: "#22D3EE", style: "creative", popular: true },
  { id: "regent",      name: "Regent",      description: "Executive · serif header · gold rule · two-column", previewColor: "#1E3A5F", style: "classic", popular: true },
  { id: "marlowe",     name: "Marlowe",     description: "Elegant serif · centered · refined",              previewColor: "#8A6D3B", style: "classic", popular: true },
  { id: "cavendish",   name: "Cavendish",   description: "Academic · long-form · ruled sections",           previewColor: "#7F1D1D", style: "classic", popular: true },
  { id: "haven",       name: "Haven",       description: "Clean · calm · rounded · people-facing roles",    previewColor: "#0E9488", style: "minimal", popular: true },
  { id: "nakuru",      name: "Nakuru",      description: "Modern sidebar · skill bars",    previewColor: "#DA4A1C", style: "sidebar",  popular: true },
  { id: "kilimanjaro", name: "Kilimanjaro", description: "Classic centered serif",           previewColor: "#211A15", style: "classic" },
  { id: "serengeti",   name: "Serengeti",   description: "Header band · two-column",         previewColor: "#12433D", style: "header" },
  { id: "zanzibar",    name: "Zanzibar",    description: "Editorial display serif",          previewColor: "#7C3AED", style: "creative" },
  { id: "nile",        name: "Nile",        description: "Classic traditional",              previewColor: "#1D4ED8", style: "classic" },
  { id: "ubuntu",      name: "Ubuntu",      description: "Executive dark sidebar",           previewColor: "#F2A93B", style: "sidebar" },
  { id: "savanna",     name: "Savanna",     description: "Minimal · timeline margin",        previewColor: "#B57A18", style: "header" },
  { id: "sahara",      name: "Sahara",      description: "Ultra-minimal whitespace",          previewColor: "#6B7280", style: "minimal" },
  { id: "nairobi",     name: "Nairobi",     description: "Corporate ledger rule",            previewColor: "#1E3A5F", style: "header" },
  { id: "mombasa",     name: "Mombasa",     description: "Photo header · portrait",          previewColor: "#0E7490", style: "sidebar" },
  { id: "victoria",    name: "Victoria",    description: "Elegant serif · executive",        previewColor: "#7A5410", style: "classic" },
  { id: "canvas-magazine", name: "Canvas Magazine", description: "Editorial magazine feel",       previewColor: "#7C3AED", style: "creative" },
  { id: "monarch",         name: "Monarch",         description: "Classic prestigious layout",   previewColor: "#B45309", style: "classic" },
  { id: "vertex",          name: "Vertex",          description: "Diagonal accent header",       previewColor: "#0891B2", style: "creative" },
  { id: "berlin",          name: "Berlin",          description: "Brutalist minimal density",    previewColor: "#111827", style: "minimal" },
  { id: "atlas",           name: "Atlas",           description: "Dark header band with cards",  previewColor: "#2563EB", style: "header" },
  { id: "aurora-edge",    name: "Aurora Edge",    description: "Sidebar with pill skills",      previewColor: "#2563EB", style: "sidebar" },
  { id: "nordic-minimal", name: "Nordic Minimal", description: "Ultra-clean single column",    previewColor: "#0F172A", style: "minimal" },
  { id: "executive-one",  name: "Executive One",  description: "Centered serif classic",        previewColor: "#1E293B", style: "classic" },
  { id: "tokyo-grid",     name: "Tokyo Grid",     description: "Dark sidebar, bold red header", previewColor: "#DC2626", style: "creative" },
  { id: "silicon-pro",    name: "Silicon Pro",    description: "Tech header band with bars",    previewColor: "#2563EB", style: "header" },
  { id: "eclipse",        name: "Eclipse",        description: "Dark full header executive",    previewColor: "#0F172A", style: "header" },
  { id: "muse",           name: "Muse",           description: "Creative pink sidebar",         previewColor: "#EC4899", style: "creative" },
  { id: "titan",          name: "Titan",          description: "Bold navy authority",           previewColor: "#1E3A8A", style: "classic" },
  { id: "alpine",         name: "Alpine",         description: "Airy green minimal",            previewColor: "#10B981", style: "minimal" },
  { id: "nova",           name: "Nova",           description: "Purple header two-column",      previewColor: "#8B5CF6", style: "header" },
  { id: "oxford",         name: "Oxford",         description: "Academic centered layout",      previewColor: "#374151", style: "classic" },
  { id: "metro",          name: "Metro",          description: "Urban sidebar with stripe",     previewColor: "#2563EB", style: "sidebar" },
  { id: "horizon",        name: "Horizon",        description: "Orange banner three-column",    previewColor: "#F97316", style: "creative" },
  { id: "ascent",         name: "Ascent",         description: "Green header timeline",         previewColor: "#059669", style: "header" },
  { id: "imperial",       name: "Imperial",       description: "Prestigious deep crimson",      previewColor: "#7C2D12", style: "classic" },
  { id: "meridian",       name: "Meridian",       description: "Dark sidebar, accent dots",       previewColor: "#0F172A", style: "sidebar",  popular: true },
  { id: "apex",           name: "Apex",           description: "Bold header, timeline body",      previewColor: "#1E293B", style: "header",   popular: true },
  { id: "studio",         name: "Studio",         description: "Editorial single-column",         previewColor: "#6366F1", style: "minimal",  popular: true },
  { id: "grid",           name: "Grid",           description: "ATS-strict, machine-readable",    previewColor: "#0F172A", style: "minimal",  popular: true },
  { id: "narrative",      name: "Narrative",      description: "Bold header, editorial story",    previewColor: "#7C3AED", style: "creative", popular: true },
  { id: "cascade", name: "Cascade", description: "Dark header, left skill column, right story", previewColor: "#0F172A", style: "creative" },
  { id: "dusk", name: "Dusk", description: "Dark left column, accent-line right body", previewColor: "#1E293B", style: "creative" },
  { id: "verdant", name: "Verdant", description: "Green header, pill labels, two-column", previewColor: "#059669", style: "creative" },
  { id: "terracotta", name: "Terracotta", description: "Warm amber header, ruled section dividers", previewColor: "#B45309", style: "creative" },
  { id: "slate-two", name: "Slate Two", description: "Steel blue, two-col, grid skill display", previewColor: "#334155", style: "creative" },
  { id: "carbon", name: "Carbon", description: "Near-black header+left, timeline-v2 body", previewColor: "#059669", style: "creative" },
  { id: "aurora-two", name: "Aurora Two", description: "Violet header, pill labels, airy body", previewColor: "#6D28D9", style: "creative" },
  { id: "crimson", name: "Crimson", description: "Deep red, box sections, two-column", previewColor: "#DC2626", style: "creative" },
  { id: "ocean", name: "Ocean", description: "Ocean blue, numbered sections, timeline", previewColor: "#0369A1", style: "creative" },
  { id: "graphite", name: "Graphite", description: "Near-black, ruled labels, grid skills, compact", previewColor: "#404040", style: "creative" },
  { id: "jade", name: "Jade", description: "Forest green, pill skills, accent lines", previewColor: "#059669", style: "creative" },
  { id: "ember", name: "Ember", description: "Deep orange, timeline-v2 body", previewColor: "#EA580C", style: "creative" },
  { id: "cobalt", name: "Cobalt", description: "Deep blue, airy two-column layout", previewColor: "#1D4ED8", style: "creative" },
  { id: "storm", name: "Storm", description: "Steel, numbered+tag-rated, ruled body", previewColor: "#374151", style: "creative" },
  { id: "bloom", name: "Bloom", description: "Pink, pill labels, card body, two-column", previewColor: "#DB2777", style: "creative" },
  { id: "stripe", name: "Stripe", description: "8px left accent band, clean single column", previewColor: "#1D4ED8", style: "minimal" },
  { id: "rail", name: "Rail", description: "12px rail, timeline, accent lines", previewColor: "#059669", style: "minimal" },
  { id: "inset", name: "Inset", description: "6px band, ruled sections, airy", previewColor: "#7C3AED", style: "minimal" },
  { id: "ribbon", name: "Ribbon", description: "10px ribbon, pill section labels, photo", previewColor: "#DC2626", style: "minimal" },
  { id: "edge", name: "Edge", description: "Wide 16px edge, card experience, rounded photo", previewColor: "#0F172A", style: "minimal" },
  { id: "axis", name: "Axis", description: "Black band, timeline-v2 experience", previewColor: "#0F172A", style: "minimal" },
  { id: "ledger", name: "Ledger", description: "Dark band, numbered headers, table exp, grid skills", previewColor: "#1E293B", style: "minimal" },
  { id: "serif-cv", name: "Serif", description: "Warm paper bg, ruled sections, bar skills", previewColor: "#78350F", style: "minimal" },
  { id: "flux", name: "Flux", description: "10px band, box headers, chip skills", previewColor: "#6D28D9", style: "minimal" },
  { id: "tempo", name: "Tempo", description: "Accent name, dot sections, dot skills, timeline", previewColor: "#0891B2", style: "minimal" },
  { id: "margin", name: "Margin", description: "Slate band, square photo, tag-rated skills", previewColor: "#374151", style: "minimal" },
  { id: "script-cv", name: "Script", description: "Warm background, timeline-v2, accent lines", previewColor: "#B45309", style: "minimal" },
  { id: "mono-cv", name: "Mono", description: "Black band, no section headers, ultra compact", previewColor: "#111827", style: "minimal" },
  { id: "pier", name: "Pier", description: "Teal band, pill labels, grid skills", previewColor: "#0369A1", style: "minimal" },
  { id: "herald", name: "Herald", description: "Dark band, ruled sections, table layout, rounded photo", previewColor: "#0F172A", style: "minimal" },
  { id: "kibo", name: "Kibo", description: "Dark sidebar, pill labels, numbered mains, grid skills", previewColor: "#0F172A", style: "sidebar" },
  { id: "lodge", name: "Lodge", description: "Charcoal, dot sidebar, ruled main, tag-rated, timeline-v2", previewColor: "#1E293B", style: "sidebar" },
  { id: "brisk", name: "Brisk", description: "Dark, tag sidebar, pill main, table experience", previewColor: "#111827", style: "sidebar" },
  { id: "chrome", name: "Chrome", description: "Light sidebar, numbered main, grid skills", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "linen", name: "Linen", description: "Warm cream sidebar, ruled sections, airy", previewColor: "#D97706", style: "sidebar" },
  { id: "denim", name: "Denim", description: "Ice blue sidebar, pill mains, card experience", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "cocoa", name: "Cocoa", description: "Warm yellow sidebar, numbered, tag-rated skills", previewColor: "#B45309", style: "sidebar" },
  { id: "slate-v2", name: "Slate v2", description: "White-ish sidebar, ruled main, grid, timeline-v2", previewColor: "#374151", style: "sidebar" },
  { id: "onyx", name: "Onyx", description: "Near-black, pill sidebar, accent lines, compact", previewColor: "#6D28D9", style: "sidebar" },
  { id: "cobblestone", name: "Cobblestone", description: "Warm dark, numbered main, table exp, timeline", previewColor: "#1C1917", style: "sidebar" },
  { id: "capsule", name: "Capsule", description: "Pill section labels, accent name, solid divider", previewColor: "#7C3AED", style: "minimal" },
  { id: "ledge", name: "Ledge", description: "Ruled sections, grid skills, no divider", previewColor: "#0F172A", style: "minimal" },
  { id: "ticker", name: "Ticker", description: "Centered, numbered, timeline-v2 experience", previewColor: "#DC2626", style: "minimal" },
  { id: "slab", name: "Slab", description: "Numbered headers, table experience, tag-rated skills", previewColor: "#374151", style: "minimal" },
  { id: "peel", name: "Peel", description: "Centered, pill labels, chip skills, card exp, airy", previewColor: "#BE185D", style: "minimal" },
  { id: "trace", name: "Trace", description: "Ruled sections, dotted divider, left-aligned", previewColor: "#0891B2", style: "minimal" },
  { id: "clean-cv", name: "Clean", description: "No section labels, grid skills, ultra compact", previewColor: "#1E293B", style: "minimal" },
  { id: "herald-cv", name: "Herald", description: "Centered, numbered, dot skills, accent name", previewColor: "#1D4ED8", style: "minimal" },
  { id: "folio", name: "Folio", description: "Pill labels, tag-rated skills, timeline-v2, airy", previewColor: "#059669", style: "minimal" },
  { id: "atlas-v2", name: "Atlas v2", description: "Numbered, chip skills, card blocks, accent name", previewColor: "#0F172A", style: "minimal" },
  { id: "ruwenzori", name: "Ruwenzori", description: "Dark slate sidebar, bar skills", previewColor: "#0F172A", style: "sidebar" },
  { id: "turkana", name: "Turkana", description: "Charcoal sidebar, dot skills, timeline", previewColor: "#1E293B", style: "sidebar" },
  { id: "aberdare", name: "Aberdare", description: "Dark charcoal, compact, rounded photo", previewColor: "#111827", style: "sidebar" },
  { id: "samburu", name: "Samburu", description: "Wide dark sidebar, accent lines", previewColor: "#0F172A", style: "sidebar" },
  { id: "laikipia", name: "Laikipia", description: "Deep navy, card experience blocks", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "marsabit", name: "Marsabit", description: "Square photo, airy spacing", previewColor: "#1E293B", style: "sidebar" },
  { id: "malindi", name: "Malindi", description: "Borderless sections, accent lines", previewColor: "#0F172A", style: "sidebar" },
  { id: "watamu", name: "Watamu", description: "Narrow compact sidebar, skills only", previewColor: "#111827", style: "sidebar" },
  { id: "diani", name: "Diani", description: "Wide airy sidebar, full sections", previewColor: "#1E293B", style: "sidebar" },
  { id: "lamu", name: "Lamu", description: "Midnight blue, card layout", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "busia", name: "Busia", description: "Square photo, borderless sections", previewColor: "#0F172A", style: "sidebar" },
  { id: "homabay", name: "Homabay", description: "Charcoal sidebar, rounded photo, timeline", previewColor: "#1E293B", style: "sidebar" },
  { id: "migori", name: "Migori", description: "Dot-style sections throughout", previewColor: "#111827", style: "sidebar" },
  { id: "kisii", name: "Kisii", description: "Deep navy, chip skills", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "kericho", name: "Kericho", description: "Minimal sections, card experience", previewColor: "#0F172A", style: "sidebar" },
  { id: "kitale", name: "Kitale", description: "Rounded photo, airy, accent lines", previewColor: "#1E293B", style: "sidebar" },
  { id: "machakos", name: "Machakos", description: "Midnight, timeline, dot labels", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "kajiado", name: "Kajiado", description: "Narrow, square photo, compact", previewColor: "#111827", style: "sidebar" },
  { id: "narok", name: "Narok", description: "Full sidebar sections, airy layout", previewColor: "#1A1A2E", style: "sidebar" },
  { id: "voi", name: "Voi", description: "Card experience, timeline, rounded photo", previewColor: "#0F172A", style: "sidebar" },
  { id: "wajir", name: "Wajir", description: "Box sections, dot labels, compact", previewColor: "#1E293B", style: "sidebar" },
  { id: "garissa", name: "Garissa", description: "Square photo, chip skills", previewColor: "#111827", style: "sidebar" },
  { id: "moyale", name: "Moyale", description: "Midnight, airy, dot sections, timeline", previewColor: "#0D1B2A", style: "sidebar" },
  { id: "tanganyika", name: "Tanganyika", description: "Teal accent sidebar, clean underlines", previewColor: "#0891B2", style: "sidebar" },
  { id: "bangweulu", name: "Bangweulu", description: "Purple accent, timeline, dot sections", previewColor: "#7C3AED", style: "sidebar" },
  { id: "okavango", name: "Okavango", description: "Green accent, airy, full sidebar sections", previewColor: "#059669", style: "sidebar" },
  { id: "kariba", name: "Kariba", description: "Red accent, square photo, compact", previewColor: "#DC2626", style: "sidebar" },
  { id: "rufiji", name: "Rufiji", description: "Amber accent, wide sidebar, timeline", previewColor: "#D97706", style: "sidebar" },
  { id: "ruvuma", name: "Ruvuma", description: "Pink accent, card experience", previewColor: "#BE185D", style: "sidebar" },
  { id: "kagera", name: "Kagera", description: "Blue accent, rounded, compact", previewColor: "#0369A1", style: "sidebar" },
  { id: "lukuga", name: "Lukuga", description: "Forest green, full sections", previewColor: "#065F46", style: "sidebar" },
  { id: "volta-cv", name: "Volta", description: "Brown accent, square photo, card blocks", previewColor: "#7C2D12", style: "sidebar" },
  { id: "gambia-cv", name: "Gambia", description: "Royal blue accent sidebar", previewColor: "#1D4ED8", style: "sidebar" },
  { id: "cunene", name: "Cunene", description: "Slate accent, narrow, compact", previewColor: "#374151", style: "sidebar" },
  { id: "limpopo-cv", name: "Limpopo", description: "Teal-green, wide airy sidebar", previewColor: "#0F766E", style: "sidebar" },
  { id: "kavango", name: "Kavango", description: "Violet accent, compact, dot labels", previewColor: "#6D28D9", style: "sidebar" },
  { id: "tana", name: "Tana", description: "Deep ocean blue, square photo", previewColor: "#0C4A6E", style: "sidebar" },
  { id: "ewaso", name: "Ewaso", description: "Warm brown, card experience", previewColor: "#78350F", style: "sidebar" },
  { id: "galana", name: "Galana", description: "Deep green accent sidebar", previewColor: "#166534", style: "sidebar" },
  { id: "sabaki", name: "Sabaki", description: "Navy accent, dot labels, accent lines", previewColor: "#1E3A5F", style: "sidebar" },
  { id: "athi", name: "Athi", description: "Deep rose, square photo, timeline", previewColor: "#831843", style: "sidebar" },
  { id: "awash", name: "Awash", description: "Deep plum, card blocks, airy", previewColor: "#4A044E", style: "sidebar" },
  { id: "baro", name: "Baro", description: "Dark amber, compact, rounded photo", previewColor: "#422006", style: "sidebar" },
  { id: "tekeze", name: "Tekeze", description: "Steel blue accent, timeline", previewColor: "#1C3A5E", style: "sidebar" },
  { id: "mareb", name: "Mareb", description: "Dark forest green, accent lines", previewColor: "#14532D", style: "sidebar" },
  { id: "gash", name: "Gash", description: "Indigo accent, square photo, dot sections", previewColor: "#1E1B4B", style: "sidebar" },
  { id: "geneva", name: "Geneva", description: "Slate header, centered contact row", previewColor: "#0F172A", style: "header" },
  { id: "zurich", name: "Zurich", description: "Charcoal header, photo right", previewColor: "#1E293B", style: "header" },
  { id: "vienna", name: "Vienna", description: "Dark header, amber subtext, card blocks", previewColor: "#B45309", style: "header" },
  { id: "stockholm", name: "Stockholm", description: "Midnight header, green sub, airy body", previewColor: "#059669", style: "header" },
  { id: "oslo", name: "Oslo", description: "Deep navy, violet accent, compact", previewColor: "#7C3AED", style: "header" },
  { id: "copenhagen", name: "Copenhagen", description: "Slate header, pink sub, photo right", previewColor: "#BE185D", style: "header" },
  { id: "helsinki", name: "Helsinki", description: "Charcoal, cyan accent, timeline", previewColor: "#0891B2", style: "header" },
  { id: "dublin", name: "Dublin", description: "Dark, emerald accent, clean body", previewColor: "#059669", style: "header" },
  { id: "warsaw", name: "Warsaw", description: "Midnight, orange accent, card blocks", previewColor: "#EA580C", style: "header" },
  { id: "prague", name: "Prague", description: "Deep navy, purple, photo right, airy", previewColor: "#7C3AED", style: "header" },
  { id: "budapest", name: "Budapest", description: "Slate, amber sub, dot-label sections", previewColor: "#D97706", style: "header" },
  { id: "lisbon", name: "Lisbon", description: "Charcoal, cyan, compact body", previewColor: "#0891B2", style: "header" },
  { id: "madrid", name: "Madrid", description: "Dark, rose accent, photo right", previewColor: "#E11D48", style: "header" },
  { id: "athens", name: "Athens", description: "Midnight, light blue sub, clean body", previewColor: "#1D4ED8", style: "header" },
  { id: "istanbul", name: "Istanbul", description: "Deep navy, pink, card experience", previewColor: "#DB2777", style: "header" },
  { id: "dubai", name: "Dubai", description: "Slate, gold sub, photo right, airy", previewColor: "#D97706", style: "header" },
  { id: "singapore-cv", name: "Singapore", description: "Charcoal, mint, chip skills", previewColor: "#059669", style: "header" },
  { id: "sydney-cv", name: "Sydney", description: "Dark, sky blue sub, dot sections", previewColor: "#0284C7", style: "header" },
  { id: "melbourne", name: "Melbourne", description: "Midnight, lavender, compact", previewColor: "#6D28D9", style: "header" },
  { id: "toronto", name: "Toronto", description: "Deep navy, red-pink accent", previewColor: "#DC2626", style: "header" },
  { id: "montreal", name: "Montreal", description: "Slate, green, card timeline", previewColor: "#166534", style: "header" },
  { id: "vancouver", name: "Vancouver", description: "Charcoal, pink, photo right, airy", previewColor: "#E11D48", style: "header" },
  { id: "chicago", name: "Chicago", description: "Dark, ice cyan, accent lines", previewColor: "#0891B2", style: "header" },
  { id: "boston", name: "Boston", description: "Midnight, purple sub, timeline", previewColor: "#7C3AED", style: "header" },
  { id: "seattle", name: "Seattle", description: "Dark header, skill aside, timeline", previewColor: "#0F172A", style: "header" },
  { id: "portland", name: "Portland", description: "Charcoal, narrow aside, accent lines", previewColor: "#1E293B", style: "header" },
  { id: "austin", name: "Austin", description: "Dark, full aside, card blocks", previewColor: "#111827", style: "header" },
  { id: "nashville", name: "Nashville", description: "Midnight, compact, box aside", previewColor: "#0D1B2A", style: "header" },
  { id: "atlanta", name: "Atlanta", description: "Deep navy, airy, accent lines", previewColor: "#1A1A2E", style: "header" },
  { id: "houston", name: "Houston", description: "Slate, wide aside, box sections", previewColor: "#0F172A", style: "header" },
  { id: "denver", name: "Denver", description: "Charcoal, narrow aside, card body", previewColor: "#1E293B", style: "header" },
  { id: "dallas", name: "Dallas", description: "Dark, dot sections, skill aside", previewColor: "#111827", style: "header" },
  { id: "minneapolis", name: "Minneapolis", description: "Midnight, accent lines, aside skills", previewColor: "#0D1B2A", style: "header" },
  { id: "indianapolis", name: "Indianapolis", description: "Deep navy, compact, box aside", previewColor: "#1A1A2E", style: "header" },
  { id: "charlotte", name: "Charlotte", description: "Slate, card blocks, aside with hobbies", previewColor: "#0F172A", style: "header" },
  { id: "baltimore", name: "Baltimore", description: "Charcoal, airy body, dot sections", previewColor: "#1E293B", style: "header" },
  { id: "tampa", name: "Tampa", description: "Dark, narrow aside, accent lines", previewColor: "#111827", style: "header" },
  { id: "sacramento", name: "Sacramento", description: "Midnight, compact, slim aside", previewColor: "#0D1B2A", style: "header" },
  { id: "pittsburgh", name: "Pittsburgh", description: "Deep navy, wide aside, box layout", previewColor: "#1A1A2E", style: "header" },
  { id: "cincinnati", name: "Cincinnati", description: "Slate, card timeline, accent lines", previewColor: "#0F172A", style: "header" },
  { id: "louisville", name: "Louisville", description: "Charcoal, clean underline sections", previewColor: "#1E293B", style: "header" },
  { id: "richmond", name: "Richmond", description: "Dark, airy body, dot labels", previewColor: "#111827", style: "header" },
  { id: "raleigh", name: "Raleigh", description: "Midnight, compact, narrow aside", previewColor: "#0D1B2A", style: "header" },
  { id: "miami-cv", name: "Miami", description: "Deep navy, timeline, hobbies in aside", previewColor: "#1A1A2E", style: "header" },
  { id: "phoenix", name: "Phoenix", description: "Slate, box sections, skill aside", previewColor: "#0F172A", style: "header" },
  { id: "detroit", name: "Detroit", description: "Charcoal, card layout, dot sections", previewColor: "#1E293B", style: "header" },
  { id: "memphis", name: "Memphis", description: "Dark, compact, chip skills", previewColor: "#111827", style: "header" },
  { id: "st-louis", name: "St Louis", description: "Midnight, wide aside, full sections", previewColor: "#0D1B2A", style: "header" },
  { id: "bauhaus", name: "Bauhaus", description: "Left-aligned, solid divider, compact", previewColor: "#0F172A", style: "minimal" },
  { id: "futura-cv", name: "Futura", description: "Blue accent name, accent-line sections", previewColor: "#1D4ED8", style: "minimal" },
  { id: "bodoni-cv", name: "Bodoni", description: "No divider, borderless, generous whitespace", previewColor: "#111827", style: "minimal" },
  { id: "garamond-cv", name: "Garamond", description: "Dotted divider, dot-label sections", previewColor: "#374151", style: "minimal" },
  { id: "caslon", name: "Caslon", description: "Tag labels, compact, solid divider", previewColor: "#0F172A", style: "minimal" },
  { id: "palatino-cv", name: "Palatino", description: "No divider, accent name, airy", previewColor: "#1E293B", style: "minimal" },
  { id: "baskerville-cv", name: "Baskerville", description: "Box sections, dotted divider", previewColor: "#374151", style: "minimal" },
  { id: "didot-cv", name: "Didot", description: "Card experience, accent name, solid divider", previewColor: "#111827", style: "minimal" },
  { id: "clarendon-cv", name: "Clarendon", description: "No divider, accent-line sections", previewColor: "#0F172A", style: "minimal" },
  { id: "rockwell-cv", name: "Rockwell", description: "Dot sections, compact, solid divider", previewColor: "#1E293B", style: "minimal" },
  { id: "brutalist-cv", name: "Brutalist", description: "Tag labels, accent name, borderless", previewColor: "#0F172A", style: "minimal" },
  { id: "modernist-cv", name: "Modernist", description: "Blue accent name, dotted divider", previewColor: "#1D4ED8", style: "minimal" },
  { id: "constructivist", name: "Constructivist", description: "Red accent, box sections, compact", previewColor: "#DC2626", style: "minimal" },
  { id: "deco-cv", name: "Deco", description: "Gold accent name, airy, accent lines", previewColor: "#B45309", style: "minimal" },
  { id: "structuralist", name: "Structuralist", description: "Dot sections, dotted divider, slate", previewColor: "#374151", style: "minimal" },
  { id: "impressionist-cv", name: "Impressionist", description: "Purple accent, borderless sections, airy", previewColor: "#7C3AED", style: "minimal" },
  { id: "baroque-cv", name: "Baroque", description: "Card experience, no divider, dark", previewColor: "#0F172A", style: "minimal" },
  { id: "classical-cv", name: "Classical", description: "Tag labels, dotted divider, charcoal", previewColor: "#1E293B", style: "minimal" },
  { id: "neoclassical-cv", name: "Neoclassical", description: "Box sections, compact, solid divider", previewColor: "#111827", style: "minimal" },
  { id: "avant-garde-cv", name: "Avant Garde", description: "Violet accent name, accent lines", previewColor: "#6D28D9", style: "minimal" },
  { id: "de-stijl", name: "De Stijl", description: "Blue, dot sections, card experience", previewColor: "#1D4ED8", style: "minimal" },
  { id: "suprematist", name: "Suprematist", description: "Borderless, accent name, ultra-compact", previewColor: "#0F172A", style: "minimal" },
  { id: "dadaist", name: "Dadaist", description: "Dotted divider, underline sections", previewColor: "#374151", style: "minimal" },
  { id: "futurism-cv", name: "Futurism", description: "Red accent name, tag labels, airy", previewColor: "#DC2626", style: "minimal" },
  { id: "nebula", name: "Nebula", description: "Centered violet name, airy whitespace", previewColor: "#6D28D9", style: "minimal" },
  { id: "cosmos", name: "Cosmos", description: "Dark centered name, accent lines, airy", previewColor: "#1E293B", style: "minimal" },
  { id: "orbit", name: "Orbit", description: "Cyan, dot sections, dotted divider", previewColor: "#0891B2", style: "minimal" },
  { id: "solstice", name: "Solstice", description: "Amber name, tag labels, solid divider", previewColor: "#D97706", style: "minimal" },
  { id: "equinox", name: "Equinox", description: "No divider, borderless, spacious", previewColor: "#374151", style: "minimal" },
  { id: "zenith", name: "Zenith", description: "Purple name, underline sections", previewColor: "#7C3AED", style: "minimal" },
  { id: "solaris", name: "Solaris", description: "Amber, box sections, card experience", previewColor: "#F59E0B", style: "minimal" },
  { id: "lunar", name: "Lunar", description: "Dark centered, accent lines, spacious", previewColor: "#1E293B", style: "minimal" },
  { id: "stellar", name: "Stellar", description: "Dark, dot sections, dotted divider", previewColor: "#0F172A", style: "minimal" },
  { id: "stratus", name: "Stratus", description: "Slate, borderless, compact centered", previewColor: "#374151", style: "minimal" },
  { id: "nimbus", name: "Nimbus", description: "Blue name, compact, no divider", previewColor: "#1D4ED8", style: "minimal" },
  { id: "cirrus", name: "Cirrus", description: "Cyan, tag labels, dotted divider", previewColor: "#0891B2", style: "minimal" },
  { id: "cumulus", name: "Cumulus", description: "Green name, box sections, airy", previewColor: "#059669", style: "minimal" },
  { id: "altus", name: "Altus", description: "Slate, card experience, accent lines", previewColor: "#374151", style: "minimal" },
  { id: "celeste", name: "Celeste", description: "Pink name, dot sections, dotted divider", previewColor: "#BE185D", style: "minimal" },
  { id: "quantum", name: "Quantum", description: "Charcoal, borderless centered body", previewColor: "#1E293B", style: "minimal" },
  { id: "photon", name: "Photon", description: "Sky blue name, airy, underline sections", previewColor: "#0284C7", style: "minimal" },
  { id: "quasar", name: "Quasar", description: "Purple, accent lines, dotted divider", previewColor: "#7C3AED", style: "minimal" },
  { id: "pulsar", name: "Pulsar", description: "Dark name, tag labels, compact", previewColor: "#0F172A", style: "minimal" },
  { id: "gravity", name: "Gravity", description: "Slate, box sections, no divider", previewColor: "#374151", style: "minimal" },
  { id: "vector", name: "Vector", description: "Blue name, dot sections, airy", previewColor: "#1D4ED8", style: "minimal" },
  { id: "neural", name: "Neural", description: "Green, card experience, centered", previewColor: "#059669", style: "minimal" },
  { id: "cipher", name: "Cipher", description: "Red name, accent lines, no divider", previewColor: "#DC2626", style: "minimal" },
  { id: "prism", name: "Prism", description: "Violet banner, card timeline, no aside", previewColor: "#8B5CF6", style: "creative" },
  { id: "mosaic", name: "Mosaic", description: "Teal banner, skill aside, chip tags", previewColor: "#0891B2", style: "creative" },
  { id: "parallax", name: "Parallax", description: "Red banner, aside, card experience", previewColor: "#DC2626", style: "creative" },
  { id: "collage", name: "Collage", description: "Amber banner, full aside, dot sections", previewColor: "#F59E0B", style: "creative" },
  { id: "panorama", name: "Panorama", description: "Green banner, single column, airy", previewColor: "#059669", style: "creative" },
  { id: "montage", name: "Montage", description: "Pink banner, photo right, timeline", previewColor: "#BE185D", style: "creative" },
  { id: "fjord", name: "Fjord", description: "Ocean blue banner, airy single column", previewColor: "#0369A1", style: "creative" },
  { id: "canyon", name: "Canyon", description: "Brick banner, compact, aside", previewColor: "#7C2D12", style: "creative" },
  { id: "veldt", name: "Veldt", description: "Forest banner, tag labels", previewColor: "#166534", style: "creative" },
  { id: "fractal", name: "Fractal", description: "Light grey sidebar, purple accent lines", previewColor: "#6D28D9", style: "creative" },
  { id: "relief", name: "Relief", description: "Ice blue sidebar, rounded photo", previewColor: "#1D4ED8", style: "creative" },
  { id: "tableau", name: "Tableau", description: "Lavender sidebar, square photo, cards", previewColor: "#7C3AED", style: "creative" },
  { id: "cameo", name: "Cameo", description: "Warm cream sidebar, amber accent", previewColor: "#D97706", style: "creative" },
  { id: "vignette", name: "Vignette", description: "Mint sidebar, airy accent lines", previewColor: "#059669", style: "creative" },
  { id: "lagoon", name: "Lagoon", description: "Teal mint sidebar, rounded photo", previewColor: "#0F766E", style: "creative" },
  { id: "delta", name: "Delta", description: "Sand sidebar, square photo, card body", previewColor: "#B45309", style: "creative" },
  { id: "plateau", name: "Plateau", description: "Near-white sidebar, navy accent", previewColor: "#1E3A8A", style: "creative" },
  { id: "highland", name: "Highland", description: "Clean white sidebar, dark accent lines", previewColor: "#0F172A", style: "creative" },
  { id: "estuary", name: "Estuary", description: "Light blue sidebar, chip skills", previewColor: "#0891B2", style: "creative" },
  { id: "mesa", name: "Mesa", description: "Warm sand sidebar, compact, square", previewColor: "#92400E", style: "creative" },
  { id: "contour", name: "Contour", description: "Slate-tint sidebar, box sections", previewColor: "#1E293B", style: "creative" },
  { id: "silhouette", name: "Silhouette", description: "Barely-there sidebar, sharp accent lines", previewColor: "#0F172A", style: "creative" },
];

// Curated set of genuinely-distinct CV layouts, surfaced in the gallery and the
// editor picker. The full TEMPLATES list (and the component registry) stays
// intact so every existing document keeps rendering — this only controls what's
// *offered*, cutting the dozens of recolor/rename variants down to real variety.
export const CURATED_CV_TEMPLATE_IDS: TemplateId[] = [
  // Premium flagships
  "rift", "zahabu", "nuru", "pemba", "malachite", "coral", "kioo",
  // Contemporary / experimental
  "bento", "zege", "console", "riso", "vibe", "neon",
  // Timeless / professional
  "regent", "marlowe", "cavendish", "haven",
  // Sidebar
  "nakuru", "ubuntu", "mombasa", "aurora-edge", "metro", "meridian",
  // Header / two-column
  "serengeti", "nairobi", "atlas", "eclipse", "horizon", "nova",
  // Classic / serif
  "kilimanjaro", "victoria", "monarch", "oxford", "titan",
  // Creative / editorial
  "zanzibar", "canvas-magazine", "vertex", "muse", "narrative", "tokyo-grid",
  // Minimal / ATS
  "sahara", "nordic-minimal", "berlin", "grid", "stripe", "serif-cv", "mono-cv",
];

export const CURATED_CV_TEMPLATES: Template[] = CURATED_CV_TEMPLATE_IDS
  .map((id) => TEMPLATES.find((t) => t.id === id))
  .filter((t): t is Template => Boolean(t));

const VALID_TEMPLATE_IDS = new Set<string>(TEMPLATES.map(t => t.id));

export function isTemplateId(id: string): id is TemplateId {
  return VALID_TEMPLATE_IDS.has(id);
}

// ─── Business Card Types ──────────────────────────────────────────────────────

export type BusinessCardTemplateId =
  | "zege-card" | "neon-card" | "bento-card" | "riso-card"
  | "classic" | "modern" | "bold" | "minimal" | "corporate"
  | "gradient-bc" | "dark-pro-bc" | "neon-bc" | "earthy-bc" | "luxury-bc"
  | "creative-bc" | "tech-bc" | "nature-bc" | "artistic-bc" | "retro-bc"
  | "geometric-bc" | "organic-bc" | "marble-bc" | "duo-tone-bc" | "watercolor-bc"
  | "premium-bc" | "glass-bc" | "nordic-bc" | "tropical-bc" | "urban-bc";

export interface BusinessCardData {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website?: string;
  address?: string;
  tagline?: string;
}

export function createEmptyBusinessCardData(): BusinessCardData {
  return { name: "", title: "", company: "", email: "", phone: "" };
}

export interface BusinessCardTemplate {
  id: BusinessCardTemplateId;
  name: string;
  description: string;
  previewColor: string;
  popular?: boolean;
}

export const BUSINESS_CARD_TEMPLATES: BusinessCardTemplate[] = [
  { id: "zege-card",    name: "Zege",         description: "Neo-brutalist · pairs with Zege CV",  previewColor: "#3D5AFE", popular: true },
  { id: "neon-card",    name: "Neon",         description: "Dark · sleek · pairs with Neon CV",   previewColor: "#22D3EE", popular: true },
  { id: "bento-card",   name: "Bento",        description: "Rounded panels · pairs with Bento CV", previewColor: "#4F46E5", popular: true },
  { id: "riso-card",    name: "Riso",         description: "Risograph poster · pairs with Riso CV", previewColor: "#F0466E", popular: true },
  { id: "classic",      name: "Duka",         description: "Retail / SME · clean classic",     previewColor: "#DA4A1C", popular: true },
  { id: "modern",       name: "Boda",         description: "Services · bold accent panel",      previewColor: "#DA4A1C" },
  { id: "bold",         name: "Soko",         description: "Consulting · minimal centered",     previewColor: "#211A15" },
  { id: "minimal",      name: "Kahawa",       description: "Hospitality · split accent bar",    previewColor: "#F2A93B" },
  { id: "corporate",    name: "Chai",         description: "Startup · circular brand dot",      previewColor: "#12433D" },
  { id: "gradient-bc",  name: "Mkeka",        description: "Creative · purple geometric",       previewColor: "#7C3AED" },
  { id: "dark-pro-bc",  name: "Pesa",         description: "Finance · corporate top border",    previewColor: "#1E3A5F" },
  { id: "neon-bc",      name: "Afya",         description: "Healthcare · mint organic",         previewColor: "#12433D" },
  { id: "earthy-bc",    name: "Shamba",       description: "Agriculture · warm organic tones",  previewColor: "#B45309" },
  { id: "luxury-bc",    name: "Jenga",        description: "Trades/Construction · dark gold",   previewColor: "#211A15" },
  { id: "creative-bc",  name: "Wasomi",       description: "Education · clean general",         previewColor: "#211A15" },
  { id: "tech-bc",      name: "Sanaa",        description: "Arts · gradient magenta-pink",      previewColor: "#BE185D" },
  { id: "nature-bc",    name: "Biashara",     description: "Corporate · dark ruled accent",     previewColor: "#211A15" },
  { id: "artistic-bc",  name: "Rafiki",       description: "Freelance · warm cream gold",       previewColor: "#F2A93B" },
  { id: "retro-bc",     name: "Uzuri",        description: "Beauty/Salon · pink accent",        previewColor: "#BE185D" },
  { id: "geometric-bc", name: "Teknolojia",   description: "Tech · dark green terminal",        previewColor: "#4ADE80" },
  { id: "organic-bc",   name: "Kilimo",       description: "Nonprofit/NGO · mint green",        previewColor: "#12433D" },
  { id: "marble-bc",    name: "Bahari",       description: "Tourism/Travel · ocean blue",       previewColor: "#0E7490" },
  { id: "duo-tone-bc",  name: "Zawadi",       description: "Events · portrait accent bar",      previewColor: "#DA4A1C" },
  { id: "watercolor-bc",name: "Simba",        description: "Luxury · gold foil effect",         previewColor: "#F2A93B" },
  { id: "premium-bc",   name: "Serengeti",    description: "Premium · black gold top border",   previewColor: "#D97706" },
  { id: "glass-bc",     name: "Nairobi",      description: "Corporate · frosted modern",        previewColor: "#6366F1" },
  { id: "nordic-bc",    name: "Zanzibar",     description: "Creative · hairline divider",       previewColor: "#0F172A" },
  { id: "tropical-bc",  name: "Mombasa",      description: "Hospitality · vibrant solid",       previewColor: "#0E7490" },
  { id: "urban-bc",     name: "Kilimanjaro",  description: "Executive · dark top strip",        previewColor: "#111827" },
];

// ─── Letter Types ─────────────────────────────────────────────────────────────

export type LetterType =
  | "reference" | "resignation" | "application"
  | "employment-verification" | "salary-increase" | "promotion"
  | "leave-of-absence" | "job-offer" | "appointment-confirmation"
  | "termination" | "business-proposal" | "complaint"
  | "apology" | "inquiry" | "authorization"
  | "partnership-mou" | "vacate-notice" | "scholarship"
  | "internship" | "sponsorship"
  | "quotation" | "invoice" | "letterhead";
export type LetterTemplateId =
  | "formal"
  | "modern-letter"
  | "executive-letter"
  | "clean-letter"
  | "minimal-letter"
  | "classic-letter"
  | "bold-letter"
  | "contemporary-letter"
  | "professional-letter"
  | "elegant-letter"
  | "compact-letter"
  | "academic-letter"
  | "official-letter"
  | "diplomatic-letter"
  | "corporate-letter"
  | "legal-letter"
  | "nonprofit-letter";

export interface LetterFrom {
  name: string;
  title?: string;
  company?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface LetterTo {
  name: string;
  title?: string;
  company?: string;
  address?: string;
}

export interface LetterData {
  letterType: LetterType;
  from: LetterFrom;
  to: LetterTo;
  date: string;
  subject: string;
  body: string;
  closing: string;
}

export function createEmptyLetterData(letterType: LetterType = "reference", lang: "en" | "sw" = "en"): LetterData {
  const subjects: Record<LetterType, string> = {
    reference:   "Letter of Reference",
    resignation: "Letter of Resignation",
    application: "Job Application",
    "employment-verification": "Employment Verification",
    "salary-increase": "Salary Increase Request",
    promotion:   "Promotion Request",
    "leave-of-absence": "Leave of Absence Request",
    "job-offer":  "Job Offer Letter",
    "appointment-confirmation": "Appointment Confirmation",
    termination: "Termination Notice",
    "business-proposal": "Business Proposal",
    complaint:   "Complaint Letter",
    apology:     "Apology Letter",
    inquiry:     "Inquiry Letter",
    authorization: "Authorization Letter",
    "partnership-mou": "Partnership / MOU Cover Letter",
    "vacate-notice": "Notice to Vacate",
    scholarship:              "Scholarship Application",
    internship:               "Internship Application",
    sponsorship:              "Sponsorship Request",
    quotation:                "Quotation",
    invoice:                  "Invoice",
    letterhead:               "Letterhead",
  };
  return {
    letterType,
    from: { name: "", title: "", company: "", address: "", email: "", phone: "" },
    to:   { name: "", title: "", company: "", address: "" },
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    subject: subjects[letterType],
    body: "",
    closing: lang === "sw" ? "Wako mwaminifu" : "Yours sincerely",
  };
}

export interface LetterTemplate {
  id: LetterTemplateId;
  name: string;
  description: string;
  previewColor: string;
  popular?: boolean;
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  { id: "formal",               name: "Formal",         description: "Traditional corporate layout",      previewColor: "#1e293b", popular: true },
  { id: "modern-letter",        name: "Modern",         description: "Clean contemporary style",          previewColor: "#2563EB" },
  { id: "executive-letter",     name: "Executive",      description: "Centered sender, wide margins",     previewColor: "#111111" },
  { id: "clean-letter",         name: "Clean",          description: "Top border, underlined subject",    previewColor: "#374151" },
  { id: "minimal-letter",       name: "Minimal",        description: "No border, open leading",           previewColor: "#6B7280" },
  { id: "classic-letter",       name: "Classic",        description: "Block format, sender top-right",    previewColor: "#1D4ED8" },
  { id: "bold-letter",          name: "Bold",           description: "Full-width color header",           previewColor: "#0F172A" },
  { id: "contemporary-letter",  name: "Contemporary",   description: "Two-column header, accent rule",    previewColor: "#0891B2" },
  { id: "professional-letter",  name: "Professional",   description: "Sender side-bordered, ruled",       previewColor: "#1E3A8A" },
  { id: "elegant-letter",       name: "Elegant",        description: "Italic name, double-rule header",   previewColor: "#78350F" },
  { id: "compact-letter",       name: "Compact",        description: "Tight spacing, fits more content",  previewColor: "#374151" },
  { id: "academic-letter",      name: "Academic",       description: "Centered institution header",       previewColor: "#4F46E5" },
  { id: "official-letter",      name: "Official",       description: "Government style with ref line",    previewColor: "#1E293B" },
  { id: "diplomatic-letter",    name: "Diplomatic",     description: "Small-caps, centered, ornamental",  previewColor: "#7C3AED" },
  { id: "corporate-letter",     name: "Corporate",      description: "Letterhead feel with logo space",   previewColor: "#0369A1" },
  { id: "legal-letter",         name: "Legal",          description: "Numbered paragraphs, dense text",   previewColor: "#111827" },
  { id: "nonprofit-letter",     name: "Nonprofit",      description: "Accent left strip, warm tone",      previewColor: "#059669" },
];

export const LETTER_TYPE_META: Record<LetterType, { label: string; description: string; emoji: string }> = {
  reference:   { label: "Reference Letter",   description: "Recommend a colleague or employee", emoji: "📋" },
  resignation: { label: "Resignation Letter", description: "Formally resign from a position",   emoji: "✉️" },
  application: { label: "Application Letter", description: "Apply for a job or program",        emoji: "📝" },
  "employment-verification": { label: "Employment Verification", description: "Confirm role, tenure & salary", emoji: "✅" },
  "salary-increase":        { label: "Salary Increase Request", description: "Evidence-based raise appeal", emoji: "📈" },
  promotion:                { label: "Promotion Request",       description: "Case for role advancement", emoji: "⭐" },
  "leave-of-absence":       { label: "Leave of Absence",       description: "Annual, study or medical leave", emoji: "🏖️" },
  "job-offer":              { label: "Job Offer Letter",        description: "Employer to candidate with terms", emoji: "🎉" },
  "appointment-confirmation": { label: "Appointment Confirmation", description: "Interview or meeting confirmation", emoji: "📅" },
  termination:              { label: "Termination Notice",      description: "Compliant end-of-contract", emoji: "🔚" },
  "business-proposal":      { label: "Business Proposal",      description: "Cover letter for pitch or bid", emoji: "💼" },
  complaint:                { label: "Complaint Letter",        description: "Firm but professional grievance", emoji: "⚠️" },
  apology:                  { label: "Apology Letter",          description: "Service recovery apology", emoji: "🙏" },
  inquiry:                  { label: "Inquiry Letter",          description: "Request for info or quote", emoji: "❓" },
  authorization:            { label: "Authorization Letter",    description: "Delegate someone to act for you", emoji: "📄" },
  "partnership-mou":        { label: "Partnership / MOU",      description: "Introduces partnership agreement", emoji: "🤝" },
  "vacate-notice":          { label: "Notice to Vacate",        description: "Tenant/landlord move-out notice", emoji: "🏠" },
  scholarship:              { label: "Scholarship Application", description: "Funding request with motivation", emoji: "🎓" },
  internship:               { label: "Internship Application",  description: "Student outreach to employer", emoji: "👔" },
  sponsorship:              { label: "Sponsorship Request",     description: "Event or community funding ask", emoji: "🤲" },
  quotation:                { label: "Quotation",               description: "Itemised price quote for a client", emoji: "🧾" },
  invoice:                  { label: "Invoice",                 description: "Bill for goods or services delivered", emoji: "📤" },
  letterhead:               { label: "Letterhead",              description: "Branded company letter header", emoji: "🏢" },
};

// ─── Document Category ────────────────────────────────────────────────────────

export type DocumentCategory = "cv" | "cover-letter" | "business-card" | "letter";

export const DOCUMENT_CATEGORIES: {
  id: DocumentCategory; label: string; description: string; emoji: string; href: string;
}[] = [
  { id: "cv",            label: "CV / Resume",    description: "160+ professional CV templates",  emoji: "📄", href: "/editor/cv/new" },
  { id: "cover-letter",  label: "Cover Letter",   description: "Matching cover letters",             emoji: "✉️", href: "/editor/cover-letter/new" },
  { id: "business-card", label: "Business Card",  description: "25 business card designs",      emoji: "💼", href: "/editor/business-card/new" },
  { id: "letter",        label: "Letter",         description: "20 formal letters — reference, resignation & more",       emoji: "📋", href: "/editor/letter/new" },
];

// ─── Subscription / Billing ───────────────────────────────────────────────────

export type PlanId = "trial" | "monthly" | "annual";
export type SubscriptionStatus = "active" | "trialing" | "cancelled" | "expired" | "past_due";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  priceKES: number;
  priceTZS: number;
  billingPeriod: "7-day" | "monthly" | "annual";
  description: string;
  popular?: boolean;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "monthly",
    name: "Monthly",
    price: 7.90,
    priceKES: 1030,
    priceTZS: 19500,
    billingPeriod: "monthly",
    description: "Unlimited AI + Word export, billed monthly. Cancel anytime.",
    features: [
      "Unlimited AI \u2014 Sumaiya writes & tailors every section",
      "AI cover letters & job tailoring, no daily limit",
      "Scan an old CV \u2014 AI fills it in for you",
      "Word (.docx) export",
      "ATS score history & tracking",
      "Priority support",
    ],
  },
  {
    id: "trial",
    name: "7-Day Access",
    price: 2.90,
    priceKES: 380,
    priceTZS: 7200,
    billingPeriod: "7-day",
    description: "Unlimited AI for 7 days, then $7.90/month. Cancel anytime.",
    popular: true,
    features: [
      "Unlimited AI \u2014 Sumaiya writes & tailors every section",
      "AI cover letters & job tailoring, no daily limit",
      "Scan an old CV \u2014 AI fills it in for you",
      "Word (.docx) export",
      "ATS score history & tracking",
      "Priority support",
    ],
  },
  {
    id: "annual",
    name: "Annual",
    price: 5.90,
    priceKES: 770,
    priceTZS: 14750,
    billingPeriod: "annual",
    description: "Unlimited AI, billed as $70.80/year. Cancel anytime.",
    features: [
      "Unlimited AI \u2014 Sumaiya writes & tailors every section",
      "AI cover letters & job tailoring, no daily limit",
      "Scan an old CV \u2014 AI fills it in for you",
      "Word (.docx) export",
      "ATS score history & tracking",
      "Priority support",
    ],
  },
];

// ─── API / Record Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CVRecord {
  id: string;
  title: string;
  templateId: TemplateId;
  primaryColor: string;
  fontFamily: string;
  data: CVData;
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface CoverLetterRecord {
  id: string;
  title: string;
  cvId?: string;
  templateId: TemplateId;
  primaryColor: string;
  content: string;
  jobTitle?: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessCardRecord {
  id: string;
  title: string;
  templateId: BusinessCardTemplateId;
  primaryColor: string;
  data: BusinessCardData;
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface LetterRecord {
  id: string;
  title: string;
  letterType: LetterType;
  templateId: LetterTemplateId;
  primaryColor: string;
  data: LetterData;
  status: "draft" | "complete";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  cvCount: number;
  coverLetterCount: number;
  businessCardCount: number;
  letterCount: number;
  downloadsThisMonth: number;
  subscription: SubscriptionStatus | null;
}
