# Template Asset Migration Plan

**273 Legacy CV Templates → Systematic TemplateHub Conversion**

**Status:** Planning (Phase 0, before TemplateProvider abstraction)  
**Purpose:** Classify assets, identify families, prevent waste  
**Timeline:** Do NOT rush; this is a 12-week systematic project  

---

## Principle

The 273 existing templates are **design assets**, not debt.

They represent years of design work.

Do NOT delete them because you're building a new system.

Instead: **Systematically decide the fate of each template** based on quality, relevance, and fit.

```
273 legacy templates
        ↓
Inventory
        ↓
Classification
        ↓
Family grouping
        ↓
Quality assessment
        ↓
Migration decisions
        ↓
✅ Migrate (TemplateHub premium)
✅ Rebuild (redesign + migrate)
✅ Combine (merge duplicates → variant family)
✅ Deprecate (retire without replacement)
```

---

## Step 0: Current Inventory

**File:** `apps/web/components/templates/`

**Count:** 273 .tsx files

**Examples:**
- aberdare.tsx
- alpine.tsx
- altus.tsx
- apex.tsx
- ascent.tsx
- athens.tsx
- atlanta.tsx
- atlas.tsx
- atlas-v2.tsx
- ...

**Observation:** Some names suggest variants (atlas vs atlas-v2) or duplicates.

---

## Step 1: Audit Template Catalog (Week 1)

### Task 1.1: Extract Metadata

Create a CSV inventory:

```csv
template_name,category,style,complexity,estimated_quality,visual_distinctiveness,has_variant,notes
aberdare,cv,professional,medium,good,high,no,"Clean, minimal"
alpine,cv,professional,simple,good,high,no,"Very similar to aberdare"
altus,cv,modern,medium,good,high,no,"More visual"
apex,cv,ats,simple,excellent,high,no,"ATS-optimized"
atlas,cv,professional,complex,good,medium,yes,"Heavy design"
atlas-v2,cv,professional,complex,good,medium,no,"Updated version"
...
```

### Task 1.2: Categorize by Style

Group templates into design families:

```
PROFESSIONAL
- aberdare
- alpine
- athens
- atlanta
- axis
- ...

MODERN
- altus
- atlas
- azalea
- ...

ATS-OPTIMIZED
- apex
- artemis
- ...

CREATIVE
- aurora
- azura
- ...

MINIMAL
- basics
- ... (if any)
```

### Task 1.3: Identify Duplicates/Variants

Find templates that are very similar:

```
Similar to aberdare:
- alpine (95% match — minor tweaks)
- athens (90% match — color variation)

Similar to atlas:
- atlas-v2 (same as atlas, updated design)

Similar to apex:
- artemis (95% match — same ATS logic)
```

### Task 1.4: Visual Assessment

Rate each template:

```
Visual Quality: 1-5
- 1: Outdated, needs refresh
- 2: Acceptable but dated
- 3: Current, solid
- 4: Modern, polished
- 5: Premium, standout

Distinctiveness: 1-5
- How visually different is it from others?
- 5 = unique look
- 1 = very similar to 3+ others
```

---

## Step 2: Classify Each Template (Week 2-3)

For every template, decide:

### Category A: MIGRATE (High Quality, Unique)

**Criteria:**
- Visual quality ≥ 4
- Distinctiveness ≥ 4
- No near-duplicates
- Serves a specific use case well

**Action:** Minimal changes needed; convert to TemplateHub premium offering.

**Count Target:** ~60-80 templates

**Examples:**
```
✅ apex (ATS-optimized, excellent quality)
✅ altus (modern professional, unique)
✅ aurora (creative, stands out)
```

### Category B: REBUILD (Good Concept, Dated Design)

**Criteria:**
- Visual quality ≤ 2
- Good underlying structure
- Solves a real need
- Worth modernizing

**Action:** Keep the concept; redesign for TemplateHub.

**Count Target:** ~40-60 templates

**Examples:**
```
🔄 athens (good concept, needs visual refresh)
🔄 barcelona (solid layout, dated colors)
```

### Category C: COMBINE (Near-Duplicates)

**Criteria:**
- ≥ 2 templates with ≥ 85% visual similarity
- Different names but same purpose
- One is clearly superior

**Action:** Merge into one template with variants.

**Count Target:** ~30-40 templates

**Example:**
```
BEFORE:
❌ alpine.tsx (professional, minimal)
❌ athens.tsx (professional, minimal, color variant)
❌ atlanta.tsx (professional, minimal, different colors)

AFTER:
✅ professional-minimal-family
  ├── variant-warm (original atlanta)
  ├── variant-cool (original athens)
  └── variant-neutral (original alpine)
```

Result: 3 templates → 1 template with 3 variants

### Category D: DEPRECATE (Poor Quality or Redundant)

**Criteria:**
- Visual quality ≤ 1
- Genuinely poor design
- Multiple better alternatives exist
- No unique value

**Action:** Retire. Do not migrate. No replacement.

**Count Target:** ~30-50 templates

**Example:**
```
❌ old-design-v1 (visually poor, replaced by v2)
❌ template-reject (unused, confusing design)
```

---

## Step 3: Define Template Families (Week 4-5)

Once classified, create families:

```typescript
// lib/templates/families.ts

export const TEMPLATE_FAMILIES = [
  {
    id: 'executive-professional',
    name: 'Executive Professional',
    source_templates: ['apex', 'artemis'], // migrated/rebuilt
    tier: 'core',
    description: 'For senior roles and experienced professionals',
    documents: [
      { type: 'cv', template_id: 'apex-exec' },
      { type: 'cover_letter', template_id: 'apex-cover' }, // to be created
    ],
  },
  {
    id: 'modern-specialist',
    name: 'Modern Specialist',
    source_templates: ['altus', 'azalea'], // migrated/rebuilt
    tier: 'core',
    description: 'Clean, modern presentation for technical roles',
    documents: [
      { type: 'cv', template_id: 'altus-modern' },
      { type: 'cover_letter', template_id: 'altus-cover' }, // to be created
    ],
  },
  {
    id: 'ats-optimized',
    name: 'ATS-Optimized',
    source_templates: ['apex-ats'], // migrated/rebuilt
    tier: 'core',
    description: 'Designed to pass automated resume scanners',
    documents: [
      { type: 'cv', template_id: 'apex-ats-cv' },
      { type: 'cover_letter', template_id: 'apex-ats-cover' }, // to be created
    ],
  },
  {
    id: 'professional-minimal',
    name: 'Professional Minimal',
    source_templates: ['alpine', 'athens', 'atlanta'], // combined from 3
    tier: 'core',
    variants: {
      warm: 'atlanta',
      cool: 'athens',
      neutral: 'alpine',
    },
  },
  // ... more families
];
```

---

## Step 4: Create Migration Manifest (Week 5-6)

Document every template's fate:

```csv
template_name,category,action,new_id,new_family,notes,priority
aberdare,professional,combine,professional-minimal-base,professional-minimal,"Base design for minimal family",high
alpine,professional,combine,professional-minimal-cool,professional-minimal,"Color variant of aberdare",high
altus,modern,migrate,altus-modern,modern-specialist,"High quality, unique",high
apex,ats,migrate,apex-ats,ats-optimized,"Excellent ATS logic, keep as-is",high
atlas,professional,rebuild,atlas-rebuild,pending,"Good layout, dated visuals",medium
atlas-v2,professional,combine,atlas-upgrade,atlas-family,"Use as update to atlas",medium
athens,professional,combine,professional-minimal-warm,professional-minimal,"Color variant of aberdare",high
artemis,ats,combine,apex-ats-variant,ats-optimized,"95% match with apex, use as variant",medium
aurora,creative,migrate,aurora-creative,creative-professional,"Unique, modern, keep",high
azalea,modern,rebuild,azalea-modern,modern-specialist,"Good structure, needs refresh",medium
...
```

---

## Step 5: Extract Template Schemas (Week 6-7)

For each template to migrate/rebuild:

Create a schema definition:

```typescript
// templates/apex-ats.schema.ts

export const ApexATSSchema = {
  id: 'apex-ats',
  category: 'cv',
  name: 'Apex ATS',
  family: 'ats-optimized',
  version: '1.0.0',
  
  editableFields: [
    { path: 'personalInfo.fullName', type: 'text', required: true },
    { path: 'personalInfo.email', type: 'email', required: true },
    { path: 'personalInfo.phone', type: 'phone', required: false },
    { path: 'personalInfo.headline', type: 'text', required: false },
    { path: 'summary', type: 'multiline', required: false },
    { path: 'experience', type: 'array', itemSchema: {
      company: 'text',
      title: 'text',
      startDate: 'date',
      endDate: 'date',
      description: 'multiline',
    }},
    { path: 'education', type: 'array', itemSchema: {
      institution: 'text',
      degree: 'text',
      field: 'text',
    }},
    { path: 'skills', type: 'array', itemSchema: {
      name: 'text',
      level: 'enum(beginner|intermediate|advanced|expert)',
    }},
  ],
  
  metadata: {
    tier: 'core',
    atsOptimized: true,
    minimalDesign: false,
    professionalLevel: 'any',
    industryFocus: 'all',
  },
};
```

---

## Step 6: Create Replacement Cover Letters & Resources (Week 7-9)

For every migrated CV family, create matching cover letter:

```typescript
// templates/apex-ats-cover.schema.ts

export const ApexATSCoverSchema = {
  id: 'apex-ats-cover',
  category: 'cover_letter',
  family: 'ats-optimized',
  
  editableFields: [
    { path: 'letterhead', type: 'text' },
    { path: 'date', type: 'date' },
    { path: 'recipient', type: 'text' },
    { path: 'salutation', type: 'text' },
    { path: 'opening', type: 'multiline' },
    { path: 'body', type: 'multiline' },
    { path: 'closing', type: 'multiline' },
  ],
};
```

**Note:** Cover letters may initially be text-based, not visually complex.

---

## Step 7: Test & Validate (Week 9-11)

### Task 7.1: Rendering Tests

For each migrated template:
- ✅ Renders without errors
- ✅ All fields populate correctly
- ✅ PDF export works
- ✅ Mobile rendering OK

### Task 7.2: Visual Regression

Compare old template (current) vs new template (refactored):
- Should look identical
- Should render identical PDFs
- Should handle all edge cases (long names, many experiences, etc.)

### Task 7.3: Backcompat

Existing CVs created with old templates should:
- Continue to render with old template
- Optionally upgrade to new template family version
- Never break existing exports

---

## Step 8: Publication & Archival (Week 12)

### Migrate Templates

```
current: apps/web/components/templates/apex.tsx
  ↓ (extract + refactor)
new: apps/web/lib/templates/apex-ats.ts (structured)
  ↓
TemplateHub (when ready)
```

### Archive Deprecated

Move to `templates/archive/` for historical reference:

```
apps/web/components/templates/archive/
├── old-design-v1.tsx (deprecated, never used)
├── template-reject.tsx (poor quality, not migrated)
└── _README.md (explanation of what's here and why)
```

Never delete. Just archive.

---

## Expected Outcome

```
273 templates
  ├─ ~80 MIGRATED (high quality, TemplateHub premium)
  ├─ ~50 REBUILT (good concept, modern design)
  ├─ ~40 COMBINED (merged into families with variants)
  └─ ~40 DEPRECATED (archived, not published)

Result:
  ~110 published templates in TemplateHub
  (or fewer if family-based reduction is aggressive)

But more importantly:
  ~30-50 template families (CV + cover letter + resources)
  Each family coherent, polished, monetizable
```

---

## For Sumaiya (Do NOT Do This Year)

Sumaiya core will use tiny subset:

```
SUMAIYA CORE
└── ~5 templates
    ├── Simple CV
    ├── Professional CV
    ├── ATS CV
    ├── Simple Cover Letter
    └── Professional Cover Letter
```

These are COPIES from TemplateHub, not separate.

---

## Timeline Summary

- **Week 1:** Inventory & extraction (273 templates)
- **Week 2-3:** Classification (A/B/C/D)
- **Week 4-5:** Family definition
- **Week 5-6:** Migration manifest
- **Week 6-7:** Schema extraction
- **Week 7-9:** Cover letter creation
- **Week 9-11:** Testing & validation
- **Week 12:** Publication & archival

**Total:** 12 weeks, systematic, zero waste.

---

## Do NOT

❌ Delete templates immediately  
❌ Redesign all 273 at once  
❌ Create TemplateHub database before this  
❌ Publish all templates without curation  
❌ Rush the migration  

## DO

✅ Be systematic  
✅ Assess quality honestly  
✅ Keep what's good  
✅ Fix what's salvageable  
✅ Archive what's not  
✅ Create families, not isolated templates  
✅ Let TemplateProvider abstraction drive structure  

---

**This is a 12-week asset recovery project, not a technical refactor.**

It ensures that valuable design work is preserved, improved, and positioned for the TemplateHub ecosystem.
