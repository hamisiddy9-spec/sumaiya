# Task 1 — Career Profile as source of truth (design note)

Branch: `hermes/career-profile` (from `origin/master` @ 65bb07d)
Task scope: architecture only — no branding/copy. Provenance tagging itself is Task 2; Task 1 leaves clean seams.

## 1. Current architecture map (verified against 65bb07d)

### Data model
- `cv` table (`lib/db/schema.ts`): one row per CV, `data` is a **jsonb blob of the entire CV** (`CVData`), including every career fact (experience, education, skills, certifications, languages, projects, referees). Styling lives in columns (`template_id`, `primary_color`, `font_family`); content lives in JSON.
- `user_profile` table: **personal info + summary only** (fullName, jobTitle, email, phone, location, linkedin, website, photo, summary, emailNotifications). No career sections. `profile` (auth) table is the parent FK.
- `CVData` type + entry types + `cvDataSchema` (Zod) live in `types/index.ts`. `parseCVData()` is strict — a loose wire shape falls back to an EMPTY CV (that's why `lib/cv/from-parsed.ts` (`toCvData`) exists as the forgiving adapter for imports/assistant).
- Every career fact is **duplicated inside each CV's JSON** — no single source of truth.

### APIs (Hono catch-all at `app/api/[[...route]]/route.ts`)
- `/api/cv` — create (POST, idempotent via clientId), list, get, patch (full `data` replace), delete, duplicate, download, share. Auth via `getUserId(c)` (Bearer or Supabase cookie).
- `/api/profile` — GET (single row or null), POST (upsert), POST `/seed` (fill-only-blanks — never overwrites existing), PATCH. Schema: scalar fields only.
- `/api/applications` — application kits (cv_id, cover_letter_id, jd, matchScore).
- `/api/ai/assistant-turn` — the ONE agentic AI path, backed by `lib/assistant/tools.ts` tool registry (ats.check, jobs.match, cv.tailor, etc.). **Do not build a second AI orchestration path.**

### Engines (pure, deterministic — one source of truth)
- `lib/ats-score.ts` — `analyzeCv(data: CVData, sw)` → 12 weighted checks → `atsScore`. Takes **CVData**.
- `lib/job-match.ts` — `matchCvToJd(data: CVData, jd)` → `{score, matched, missing}`. Takes **CVData**.
- Both consume `CVData` → a Career Profile must be convertible to `CVData` cheaply so these engines (and tailoring `/api/ai/tailor-cv`) keep working off the same shape.

### Anti-fabrication
- `lib/api/ai-guardrails.ts` — `TRUTH_CONSTRAINT` is the single source of truth; asserted in tests. Any provenance layer must build on top of it, not beside it.

### Editor / create flows
- New CV (`app/(dashboard)/editor/cv/[id]/page.tsx` with `id === "new"`): server reads `user_profile`, calls `seedCvData(prof)` → `cv.data`. Existing CVs: untouched.
- Editor autosave: `lib/stores/editor-store.ts` `saveCv()` → PATCH `/api/cv/:id` with full `data`.
- "Use My Profile" (`components/editor/editor-profile-menu.tsx`): GET `/api/profile` → `seedCvData(prof)` → `loadCvData`.
- Profile mappers: `lib/profile-mappers.ts` — `seedCvData`, `seedBusinessCardData`, `seedLetterSender` (truthy-spread).
- Assistant learns user facts via `/api/profile/seed` (fill-only-blanks).

### Migrations
- Manual SQL in `drizzle/migrations/000N_*.sql` + runner scripts `scripts/migrate-*.mjs` (no drizzle meta journal). Latest: 0005. DB is Supabase Postgres pooler via `DATABASE_URL`.

## 2. Design chosen

**Extend `user_profile` with a single jsonb column `career_profile`** holding the full structured Career Profile. No parallel identity system, no new table — it's the same row, grown up.

```ts
interface CareerProfile {
  personal: PersonalInfo;            // mirrors CVData.personal
  summary: string;
  experience: ExperienceEntry[];     // same entry types as CVData (mechanical mapping)
  education: EducationEntry[];
  skills: SkillEntry[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  projects: ProjectEntry[];
  achievements: AchievementEntry[];  // NEW — not in CVData (profile-only fact-set)
  volunteer: VolunteerEntry[];       // NEW — not in CVData
  references: RefereeEntry[];        // CVData calls it "referees"
  preferences: CareerPreferences;    // NEW — target roles, locations, remote, salary...
  // Provenance seam (Task 2 fills this in; Task 1 only defines it):
  factMeta?: Record<string, FactMeta>;
}
```

Why this shape:
- **Section types are reused from CVData** → `cvDataToProfile()` / `profileToCvData()` are mechanical, and `ats-score` / `job-match` / tailor can keep consuming `CVData` built from the profile. Zero engine changes.
- **One column, nullable, additive** → existing rows unaffected; migration is `ADD COLUMN IF NOT EXISTS` (reversible, no data rewrite).
- **CVs stay views/versions**: a CV is a snapshot rendered from the profile + target-job tailoring. We do NOT force-migrate or duplicate — we add a backfill path and a sync path, both opt-in and fill-only-blanks.

## 3. Non-destructive rules (hard constraints)
1. Migration is additive + `IF NOT EXISTS`; never rewrites `cv.data`.
2. `profileToCvData` only spreads truthy/non-empty sections — a blank profile never wipes a template default.
3. `mergeProfileFromCv` (backfill/sync) **never overwrites** a non-empty existing section; fills only empty sections + blank scalar fields (same philosophy as `/api/profile/seed`).
4. Existing routes (`/api/cv`, `/api/profile` scalar fields, `/api/ai/*`) keep their exact contracts.
5. Claude-owned files (assistant/ATS/match): only additive import-level touches if unavoidable, flagged in report. Primary implementation lives in NEW files (`lib/career-profile/mapper.ts`) + the existing profile route.

## 4. Files
New:
- `types/index.ts` — CareerProfile types + `careerProfileSchema` (additive block)
- `lib/career-profile/mapper.ts` — cvDataToProfile / profileToCvData / mergeProfileFromCv / pickMostCompleteCv / completeness
- `lib/career-profile/mapper.test.ts` — vitest (deterministic, no DB)
- `drizzle/migrations/0006_career_profile.sql` — additive column
- `scripts/migrate-career-profile.mjs` — runner (pattern from migrate-recommendations.mjs)

Modified:
- `lib/db/schema.ts` — `careerProfile: jsonb("career_profile")` on `userProfile`
- `lib/api/routes/profile.ts` — accept `careerProfile` in POST/PATCH; new `POST /backfill` (pick most complete CV or explicit cvId)
- `lib/profile-mappers.ts` — `seedCvData` now prefers profile career sections when present
- `components/editor/editor-profile-menu.tsx` — "Save this CV to my profile" (sync path)
- `components/settings/settings-form.tsx` — Career Profile card: status + "Build from my most complete CV" (EN + SW)

## 5. Verification plan
- `npx vitest run` (existing 30 + new mapper tests)
- `npx tsc --noEmit`, `npx next lint`, `npx next build`
- Real-behavior check: apply additive migration to the project DB (repo's established runner pattern), then exercise `/api/profile` + `/api/profile/backfill` against a test user and assert row contents (not just "renders")
- Manual: existing CV opens/edits/saves unchanged; incomplete data; EN + SW; long CV (mapper is pure — bounded loops, no recursion)

## 6. Task 2 recommended scope (seams left)
- Fact-tagging layer: `factMeta` per entry (`confirmed` / `needs-confirmation` / `ai-suggested`) — types + seam exist; populate from AI-draft sources using `TRUTH_CONSTRAINT` provenance.
- Profile-driven tailoring: `profileToCvData` + tailor → per-application CV snapshots.
- Profile completeness UI + ATS-style feedback on the profile itself.
