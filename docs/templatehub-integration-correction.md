# TemplateHub ↔ Sumaiya — interface correction (from the Sumaiya side)

The TemplateHub integration audit (2026-09-16) inferred Sumaiya's provider interface
("from typical SPA/portfolio gallery systems, Sumaiya *likely* expects…"). It guessed a
`GalleryProvider` / `GalleryTemplate` shape. **Sumaiya does not have that.** Below is the
real contract, so the adapter is built against the actual seam instead of a guess.

## The real Sumaiya interface (source of truth)

**Web — `apps/web/lib/templates/schema.ts`**
```ts
interface TemplateMetadata {
  id: string;
  name: string;                        // NOT `title`
  version: string;
  source: 'native' | 'templatehub' | 'partner';
  category: 'cv' | 'cover-letter' | 'reference-sheet' | 'other';  // strict union
  family?: string;                     // groups related templates
  description?: string;
  preview?: string;                    // NOT `thumbnail`
  editable_fields: EditableFieldSpec[];// the form schema lives here
  tier: 'core' | 'premium';            // NOT `isPremium: boolean`
  accessibleTo: AccessLevel[];         // ['sumaiya'|'templatehub'|'public'|'premium']
  createdAt: string; updatedAt: string;
}

interface TemplateProvider {
  getTemplate(id): Promise<TemplateMetadata | null>;
  getTemplatesByCategory(category, { family?, tier?, source?, limit? }): Promise<TemplateMetadata[]>;
  getTemplateFamily(familyId): Promise<TemplateFamily | null>;
  getFamiliesForProduct('sumaiya', { category?, tier? }): Promise<TemplateFamily[]>;
  renderDocument(templateId, userData, { lang? }): Promise<RenderedDocument>;  // ⚠️ renders
  exportPdf(renderedDocument): Promise<Buffer>;                               // ⚠️ exports
}
```
Plus real concepts the audit missed: **`TemplateFamily`** (CV + cover letter + reference
sheet grouped), **`TemplateFamilyMember`** (`primary | matching | supporting`),
**`AccessLevel`** entitlements, and **`EditableFieldSpec`** (a per-template form schema).

**Native — `apps/native/src/lib/cv-html.ts`**
```ts
interface CvTemplateMeta {
  id: string;
  name: { en: string; sw: string };    // ⚠️ Sumaiya ALREADY tracks Swahili names
  blurb: { en: string; sw: string };
  tier: 'free' | 'premium';            // ⚠️ native says 'free'; web says 'core'
  style: string;                       // the family key (sidebar/minimal/header/…)
}
```

## Corrections to the audit

| Audit said | Reality | Impact |
|---|---|---|
| `GalleryProvider` with `getTemplates/filterTemplates/rankTemplates/canUseTemplate` | `TemplateProvider` with `getTemplate/getTemplatesByCategory/getTemplateFamily/getFamiliesForProduct/renderDocument/exportPdf` | **High** — methods don't exist; ranking is Sumaiya-side (`template-suggestions.ts`), not the provider |
| `title` | `name` | Low (rename) |
| `isPremium: boolean` | `tier: 'core'\|'premium'` (web), `'free'\|'premium'` (native) | Medium — three-way naming must be unified |
| `thumbnail` | `preview` | Low |
| "Sumaiya doesn't track SW names" | **It does** — `name: { en, sw }` on native, bilingual parity tests on web | Low — no adapter work needed |
| `category` free-form ("Professional","Wedding") | strict `'cv'\|'cover-letter'\|'reference-sheet'\|'other'` | Medium — TemplateHub's richer categories need mapping into this union (or the union widens) |
| No mention of families | `TemplateFamily` + `getFamiliesForProduct('sumaiya')` is real | Medium — this is Sumaiya's collection concept; TemplateHub should model it |
| No mention of render/export | `renderDocument` + `exportPdf` are **part of the provider** | **High** — see below |

## The critical architectural gap (biggest risk)

Sumaiya's provider **renders and exports documents** (`renderDocument`, `exportPdf`).
TemplateHub's model is *browse + schema + fill-form + viewer*. **Neither side agrees on who
renders.** Before any adapter:

- Sumaiya today renders **natively** (`cvToHtml` + the engine, 224 templates) and on web via
  the provider's `renderDocument`.
- If TemplateHub is to be the renderer, Sumaiya's `renderDocument`/`exportPdf` must become
  remote calls — a real behavioural change, not a data mapping.
- If Sumaiya keeps rendering, TemplateHub only supplies **template metadata + schema**, and the
  adapter maps `DocumentTemplate` → `TemplateMetadata` + `EditableFieldSpec[]`.

**Decision needed before Phase 1.** Recommended: Sumaiya keeps rendering (its native engine is
what makes templates "come alive"); TemplateHub supplies metadata + schema + designs. That keeps
the adapter to a pure data map (2 days, as the audit estimates) instead of a render migration.

## What the adapter must actually produce

Given `DocumentTemplate` from TemplateHub, Map to Sumaiya's `TemplateMetadata`:
```ts
{
  id: t.id,
  name: t.name,                       // pick EN; native keeps {en,sw}
  version: t.version ?? '1.0.0',
  source: 'templatehub',
  category: mapCategory(t.documentType),   // cv→'cv', cover-letter→'cover-letter', else 'other'
  family: t.category,                      // reuse TemplateHub's category as the family grouping
  description: t.description,
  preview: undefined,                      // until a thumbnail service exists
  editable_fields: mapFieldSchema(t.schema.sections), // <- the real work: TemplateHub FieldSchema → EditableFieldSpec
  tier: t.isPremium ? 'premium' : 'core',
  accessibleTo: t.isPremium ? ['sumaiya','premium'] : ['sumaiya','public'],
  createdAt, updatedAt: now,
}
```

## Still correct in the audit (keep it)
- Adapter/`TemplateProvider` swap is the right pattern (Sumaiya already has `selectProvider()`).
- `hasAiDraft` flag — good idea; add to **both** models.
- Per-document-type provider instances (`new TemplateHubProvider('cv')`) — correct.
- Thumbnails, usage metrics, ratings as Phase 2 — correct; Sumaiya has none of these today.

## Ask back to TemplateHub
1. Confirm the **render decision** (Sumaiya renders) so the adapter stays a data map.
2. Expose `DocumentTemplate` + `DocumentSchema` in one endpoint: `GET /api/templates?documentType=cv`.
3. Model **families** (group a CV + cover letter) — Sumaiya's `TemplateFamily` expects them.
4. Add `hasAiDraft` to `DocumentTemplate.metadata`.
5. Don't ship a gallery UI sumaiya has to call — Sumaiya consumes via the provider, not HTTP from the UI.
