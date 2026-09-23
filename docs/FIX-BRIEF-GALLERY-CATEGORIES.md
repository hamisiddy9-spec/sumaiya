# Fix brief: the template gallery's categories, and the count it leads with

Repo: `C:\Users\hamis\projects\sumaiya` · branch `release/1.6.25`. HANDS. TWO items. Do NOT bump the
version, do NOT build (I build once after this lands). Full research and reasoning:
`docs/GALLERY-CATEGORIES-RESEARCH-2026-09-23.md` — read it first.

The owner, looking at the real screen: *"the categories names in templates gallery need working on …
language i dont understand"*.

---

## ITEM 1 — two of the five filter chips are the engine talking, not the document

`src/components/cv/template-gallery.tsx:40-44` defines the chips and they are a mixture of two different
kinds of thing:

```ts
{ key: "sidebar",  en: "Sidebar",  sw: "Pembeni" }   // a LAYOUT — "beside"
{ key: "header",   en: "Header",   sw: "Kichwa" }    // a LAYOUT — "head"
{ key: "minimal",  en: "Minimal",  sw: "Sahili" }    // a STYLE
{ key: "creative", en: "Creative", sw: "Ubunifu" }   // a STYLE
{ key: "classic",  en: "Classic",  sw: "Rasmi" }     // a STYLE
```

`sidebar` and `header` are the render engine's internal layout names, shown to users and translated
literally — no job-seeker can tell what "Pembeni" means for their chances. And there is no hidden taxonomy
behind them: all 267 entries in `src/data/templates.json` carry `category: "general"`, `career_stage: "mid"`,
`industry: "tech"` — identical placeholders.

**Do:** reduce the chips to the four that describe what a person can SEE in the design, and drop the two
layout ones:

| chip (sw) | chip (en) | holds |
|---|---|---|
| Rahisi | Simple | the current `minimal` set |
| Rasmi | Formal | the current `classic` set |
| Ubunifu | Creative | the current `creative` set |
| Ya rangi | Colourful | the designs with a coloured band or side panel — today's `sidebar` **and** `header` |

The engine's internal layout keys are NOT to be renamed or removed anywhere else — only the user-facing
labels change, and the filtering must still select the same templates it does today. If one chip has to carry
two engine keys, hold them as an array rather than inventing a new key; say in your report exactly how you
mapped it and quote the before/after counts per chip so the mapping is checkable.

**Do NOT** group the designs by profession or industry (Afya, Elimu, Ufundi…). That was proposed and
**rejected**: the 267 designs are generic and the industry field is the literal placeholder `"tech"` for all
of them, so such a grouping would fabricate a claim that a design suits nurses or teachers. An industry axis
needs real curation first — it is not a rename.

## ITEM 2 — the sheet sells a catalogue to someone who wants one good CV

The header reads "TemplateHub" with the subtitle `Miundo ${ALL_TEMPLATES.length}` → **"Miundo 224"** on the
device. Two problems: a count is not the visitor's question, and the count is not even self-consistent — the
picker computes 224 from its array while `src/data/templates.json` holds 267.

**Do:** drop the count from the header. Keep a short, calm title that says what the sheet is for (propose the
Swahili and English; the sheet's job is "choose the design for your CV", and the user arrives here from the CV
editor). Keep everything else about the header. Do not touch the search box or the two sections.

---

## Gates and report

`cd apps/native && npx tsc --noEmit && npx jest && node scripts/test-release-invariants.js` — quote the
counts. Commit NAMED PATHS ONLY (this clone is shared; another session pushes to `main`, so commit promptly
and never `git add -A`). Report: files changed, the per-chip template counts before and after (so the mapping
is verifiable), the exact commands with pass/fail counts, the commit sha, and what you could NOT establish —
you cannot see a phone, so say the on-screen result is unverified rather than implying you checked it.

BOUNDARIES: no push, no APK build, no deploy, no migration, no dependency upgrade, do not touch other
projects, never read or print `.env` or a secret. Do NOT touch: the engine's layout names, the preview
mechanism, the fonts/type floor, the export path, maombi, or the landing page.
