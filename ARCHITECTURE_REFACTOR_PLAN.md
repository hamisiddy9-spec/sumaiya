# Sumaiya × TemplateHub — Architecture Refactoring Plan

**Strategic Direction:** Separate Sumaiya (Career Intelligence) from TemplateHub (Template Infrastructure)  
**Current State:** Monolithic (273 CV templates as React components)  
**Target State:** Clean separation with TemplateProvider abstraction

---

## AUDIT FINDINGS

### Current Implementation
- **Templates:** 273 CV templates as React .tsx files (~16K lines total)
- **Structure:** Name-based discovery (no metadata, no families, no versioning)
- **Schema:** None (each template is a presentational component)
- **Database:** Monolithic Sumaiya DB (no TemplateHub separation)
- **API:** No template endpoint (components loaded client-side)
- **Families:** None (no pairing of CV + Cover Letter + Reference Sheet)
- **Versioning:** None
- **Access Control:** None (all templates available to all users)

### Issues This Creates
1. **For Native App:** Dumping 267 templates into mobile = bloat, no intelligent recommendation
2. **For Business:** No way to monetize premium design families separately
3. **For Scaling:** Can't eventually let creators/partners add templates
4. **For Specialization:** Sumaiya becomes a template browser, not a career AI
5. **For TemplateHub:** No way to exist as independent product

---

## STRATEGIC REFACTORING PHASES

### Phase 0: Classify Existing Features (THIS AUDIT)

**Before any refactoring, audit every existing feature:**

**SUMAIYA CORE** — Keep exactly as-is
- Profile builder (career history, skills)
- Job analysis & matching
- CV tailor + ATS analysis
- Cover letter generation
- Application tracking
- AI career assistant
- Learning resource KB
- Skill gap detection

**TEMPLATEHUB INFRASTRUCTURE** — Move/refactor
- All 273 CV templates
- Cover letter templates (if any exist)
- Business card templates (if any)
- Reference sheet templates
- Template rendering
- Document generation
- Template preview system

**DEPRECATE** — Remove/never build for native
- Generic business documents unrelated to careers
- Flyers, posters, invitations, certificates (out of scope)
- Features added "because TemplateHub existed" but don't serve Sumaiya

**FUTURE** — Document but don't build now
- Template marketplace
- Creator tools
- Multi-product distribution
- Template analytics dashboard

---

## PHASE 1: TEMPLATE PROVIDER ABSTRACTION (Weeks 1-2)

### Goal
Create a pluggable template system so Sumaiya can work with:
1. Local/native templates (today)
2. TemplateHub API (tomorrow)
3. Multiple providers (future)

### Architecture

```typescript
// lib/templates/provider.ts

export interface TemplateMetadata {
  id: string;
  name: string;
  source: 'native' | 'templatehub' | 'partner';
  category: 'cv' | 'cover-letter' | 'reference-sheet';
  family?: string; // e.g., "executive-professional"
  version: string;
  premium: boolean;
  accessibleTo: ('sumaiya' | 'templatehub' | string)[];
  preview: string; // URL or base64
  editable_fields: string[];
  createdAt: ISO8601;
}

export interface TemplateFamily {
  id: string;
  name: string;
  description: string;
  tier: 'core' | 'premium';
  templates: TemplateMetadata[]; // CV, cover letter, reference sheet, etc.
  previewAssets: Record<string, string>;
}

export interface TemplateProvider {
  // Load a single template
  getTemplate(id: string): Promise<TemplateMetadata>;
  
  // List templates by category
  getTemplatesByCategory(category: string, options?: {
    family?: string;
    tier?: 'core' | 'premium';
  }): Promise<TemplateMetadata[]>;
  
  // Load a template family (CV + matching cover letter + etc)
  getTemplateFamily(familyId: string): Promise<TemplateFamily>;
  
  // Get available families for Sumaiya (curated, not all)
  getFamiliesForProduct(product: 'sumaiya', options?: {
    category?: string;
    tier?: 'core' | 'premium';
  }): Promise<TemplateFamily[]>;
  
  // Render a document from template + user data
  renderDocument(templateId: string, userData: Record<string, any>): Promise<RenderedDocument>;
  
  // Export to PDF
  exportPdf(renderedDocument: RenderedDocument): Promise<Buffer>;
}

export interface RenderedDocument {
  templateId: string;
  templateVersion: string;
  content: string; // HTML or PDF ready
  metadata: {
    createdAt: ISO8601;
    exportFormat: 'pdf' | 'docx' | 'html';
  };
}

// Usage:
const provider: TemplateProvider = new NativeTemplateProvider(); // today
// const provider = new TemplateHubProvider(apiClient); // tomorrow

const family = await provider.getTemplateFamily('executive-professional');
// Returns: CV + matching cover letter + reference sheet
```

### Implementation (Today)

**Create:** `apps/web/lib/templates/`
```
templates/
├── provider.ts (interface)
├── native-provider.ts (implementation for 273 local templates)
├── schema.ts (TemplateMetadata, TemplateFamily types)
├── registry.ts (metadata for all 273 templates)
└── __tests__/
    └── provider.test.ts
```

**Key Work:**
1. Extract template metadata from existing .tsx components
2. Define which templates belong in which families
3. Create a registry file (JSON or TS) with metadata
4. Implement NativeTemplateProvider using the registry
5. Update CV builder to use provider instead of direct component imports

### Files to Modify
- `apps/web/app/cv/page.tsx` — Use provider.getTemplatesByCategory() instead of importing components
- `apps/web/components/cv-builder.tsx` — Use provider.renderDocument() instead of component
- `apps/web/lib/documents/export.ts` — Use provider.exportPdf() instead of direct PDF generation

### Files to Create
- `apps/web/lib/templates/provider.ts` (interface)
- `apps/web/lib/templates/native-provider.ts` (impl)
- `apps/web/lib/templates/registry.ts` (metadata)
- `apps/web/lib/templates/schema.ts` (types)

### Zero Breaking Changes
- All existing URLs remain the same
- Existing CVs continue to render
- Existing export routes work
- Authentication unchanged
- API endpoints unchanged

---

## PHASE 2: TEMPLATE FAMILIES (Weeks 3-4)

### Goal
Group related templates into cohesive families (CV + Cover Letter + Reference Sheet).

### Architecture

Define template families explicitly:

```typescript
// lib/templates/families.ts

export const TEMPLATE_FAMILIES: TemplateFamily[] = [
  {
    id: 'executive-professional',
    name: 'Executive Professional',
    description: 'Premium family for senior roles',
    tier: 'core', // available in Sumaiya
    templates: [
      { id: 'aberdare', category: 'cv', role: 'primary' },
      { id: 'aberdare-cover', category: 'cover-letter', role: 'matching' },
      { id: 'aberdare-reference', category: 'reference-sheet', role: 'supporting' },
    ],
  },
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    tier: 'core',
    templates: [
      { id: 'alpine', category: 'cv' },
      { id: 'alpine-cover', category: 'cover-letter' },
    ],
  },
  {
    id: 'ats-focused',
    name: 'ATS-Optimized',
    tier: 'core',
    templates: [
      { id: 'apex', category: 'cv' },
      { id: 'apex-cover', category: 'cover-letter' },
    ],
  },
];
```

### Implication for Current Templates
- 273 CV templates → 80-100 families (some CVs get matching cover letters, some don't)
- Create stub cover letters for major CV families
- Mark non-family templates as "legacy" or deprecate them

### Files to Create/Modify
- `apps/web/lib/templates/families.ts` (family definitions)
- `apps/web/lib/templates/cover-letters.ts` (new cover letter templates)
- `apps/web/lib/templates/registry.ts` (update with family references)

### UX Impact (Sumaiya)
```
Choose Your CV

Quick Start
[ Simple ] [ Professional ]

CV Families
[ Executive Professional ]    ← CV + matching cover letter + reference sheet
[ Modern Minimal ]
[ ATS-Optimized ]

[Explore TemplateHub Offerings]
```

---

## PHASE 3: STRUCTURED TEMPLATE SCHEMA (Weeks 5-6)

### Goal
Templates are not just React components or static designs.

They have:
- Editable fields (name, email, phone, etc.)
- Schema (what data fits where)
- Rendering logic (template + data → document)
- Versioning (template_v1, template_v2)

### Example Schema

```typescript
// templates/aberdare.schema.ts

export const AberdareCVSchema = {
  id: 'aberdare',
  category: 'cv',
  name: 'Aberdare',
  version: '1.0.0',
  
  editableFields: [
    { name: 'personalInfo.fullName', type: 'text', required: true },
    { name: 'personalInfo.email', type: 'email', required: true },
    { name: 'personalInfo.phone', type: 'phone', required: false },
    { name: 'personalInfo.location', type: 'text', required: false },
    { name: 'personalInfo.headline', type: 'text', required: false },
    { name: 'summary', type: 'multiline', required: false },
    { name: 'experience[]', type: 'array', itemSchema: {
      company: 'text',
      title: 'text',
      startDate: 'date',
      endDate: 'date',
      description: 'multiline',
      keyAchievements: 'array<text>',
    }},
    { name: 'education[]', type: 'array', itemSchema: {
      institution: 'text',
      degree: 'text',
      field: 'text',
      graduationDate: 'date',
    }},
    { name: 'skills[]', type: 'array', itemSchema: {
      name: 'text',
      level: 'enum(beginner|intermediate|advanced|expert)',
    }},
  ],
  
  renderFn: async (data: CVData) => {
    // Render React component or HTML string
    return <AberdareCVComponent data={data} />;
  },
};
```

### Impact
- AI can intelligently populate fields
- Mobile app can prefill from scanned CV + user profile
- Documents can be versioned (template_id + template_version)
- Existing documents won't break when template updates

---

## PHASE 4: SEPARATE SUMAIYA DATABASE TABLES (Weeks 7-8)

### Current
```
sumaiya_db
├── users
├── profiles
├── cvs (document content)
├── cover_letters
├── applications
└── ... (career data)
```

### Refactored
```
sumaiya_db
├── users
├── profiles
├── documents (CV, cover letter, reference sheet, etc.)
│   ├── document_id
│   ├── user_id
│   ├── template_id
│   ├── template_version
│   ├── content_data (raw fields as JSON)
│   ├── created_at
│   ├── updated_at
│   └── exported_at (track exports)
├── applications
├── jobs
└── career_data

templatehub_db (CREATED LATER)
├── templates
├── template_families
├── template_versions
├── template_assets
├── template_schemas
└── template_access_rules
```

**Today:** Use `documents` table in Sumaiya DB, leave structure flexible for TemplateHub schema later.

### Files to Modify
- `apps/web/lib/db/schema.ts` — Add `documents` table, deprecate separate `cvs`/`cover_letters`

---

## PHASE 5: PREPARE SUMAIYA FOR TEMPLATEHUB API (Future, Not Now)

**Do not build yet.** But structure code so that later:

```typescript
// lib/templates/provider.ts — no changes needed

// lib/templates/native-provider.ts → stays for offline/fallback
class NativeTemplateProvider implements TemplateProvider { ... }

// lib/templates/templatehub-provider.ts → ready to add
class TemplateHubProvider implements TemplateProvider {
  constructor(private apiClient: TemplateHubClient) {}
  
  async getTemplate(id: string) {
    return this.apiClient.get(`/templates/${id}`);
  }
  
  async getFamiliesForProduct(product: string) {
    return this.apiClient.get(`/products/${product}/families`);
  }
  
  async renderDocument(templateId: string, data: any) {
    // Call TemplateHub rendering API
    return this.apiClient.post('/documents/render', {
      templateId,
      data,
    });
  }
}

// lib/templates/index.ts — switch providers when ready
export const templateProvider = process.env.TEMPLATE_PROVIDER === 'templatehub'
  ? new TemplateHubProvider(apiClient)
  : new NativeTemplateProvider();
```

---

## PHASE 6: NATIVE APP IMPLICATIONS

### Current Plan (Blocked)
- Copy all 273 templates to native
- No intelligent recommendation
- No offline support for templates
- Bloats app size

### Revised Plan
1. **Native uses NativeTemplateProvider** (same as web)
2. **Small curated subset** (maybe 10-15 families, not 273)
3. **TemplateHub Offerings shown online-only** (separate tab/section)
4. **Template metadata cached locally** (200KB JSON, not 267 full templates)
5. **Later:** Can add TemplateHub provider to native when API ready

```typescript
// apps/native/src/hooks/useTemplates.ts
const { templateProvider } = useTemplates();

const families = await templateProvider.getFamiliesForProduct('sumaiya', {
  tier: 'core', // only core templates on native
  offline: true, // only locally available
});

// User sees: Quick Start families
// Plus: "View more on web" link to TemplateHub offerings
```

---

## IMPLEMENTATION PRIORITY

### MUST DO (Before Native App MVP)
1. ✅ Fix OTP validation (DONE)
2. ✅ Generate template metadata (DONE)
3. ⚠️ Create TemplateProvider abstraction (Phase 1)
4. ⚠️ Update CV builder to use provider (Phase 1)
5. ⚠️ Define template families (Phase 2)

### SHOULD DO (Before Production)
6. Create template schemas (Phase 3)
7. Refactor documents table (Phase 4)
8. Unit tests for provider
9. Update native app to use provider

### CAN DO LATER
10. Prepare TemplateHub API integration (Phase 5)
11. Create TemplateHub database
12. Build TemplateHub website
13. Implement premium tier/monetization
14. Creator marketplace

---

## RISK ASSESSMENT

### CRITICAL RISKS
1. **Large refactor breaks production** → Mitigation: Phase approach, zero breaking changes
2. **Native app waits for refactor** → Mitigation: Can start native with local templates, refactor in parallel
3. **Existing CVs can't be read** → Mitigation: New `documents` table with backward compatibility

### MODERATE RISKS
1. **Template family definitions are wrong** → Mitigation: Start small, easy to adjust
2. **Provider abstraction is incomplete** → Mitigation: Phase-by-phase refinement

---

## NOT RECOMMENDED

❌ **DO NOT:**
- Wait for TemplateHub database to start refactoring
- Implement TemplateHub API before understanding Sumaiya needs
- Break existing production routes/APIs
- Create 100+ new cover letter templates immediately (stub + pair later)
- Dump entire TemplateHub offering into Sumaiya native (curate)
- Force monetization before features are ready

---

## TIMELINE

**Ideal:** 8 weeks of careful refactoring in parallel with native app development.

```
Week 1-2:  Phase 1 (TemplateProvider) + Native Week 1 (Setup)
Week 3-4:  Phase 2 (Template Families) + Native Week 2 (Navigation)
Week 5-6:  Phase 3 (Schemas) + Native Week 3 (Camera/OCR)
Week 7-8:  Phase 4 (DB Refactor) + Native Week 4 (Export/EAS)
Week 9+:   Phase 5 (TemplateHub API) when database is ready
```

---

## SUCCESS CRITERIA

✅ Sumaiya remains production-stable
✅ CV builder uses TemplateProvider abstraction
✅ Native app has curated template experience (not 273 templates)
✅ Template families work (CV + matching cover letter)
✅ Zero breaking changes to existing APIs
✅ Clear path to TemplateHub integration (no tight coupling)
✅ Sumaiya branded as "Career AI" (not "Template Browser")
✅ TemplateHub positioned as separate infrastructure

---

## NEXT STEPS

1. **Confirm strategy** with stakeholders
2. **Audit existing features** (classify: SUMAIYA / TEMPLATEHUB / DEPRECATE)
3. **Start Phase 1** (TemplateProvider abstraction)
4. **Continue native app development** in parallel (weeks 1-2 don't block)
5. **Review after Phase 1** before committing to Phases 2+

This is a 2-3 month refactoring that positions both products for long-term success.
