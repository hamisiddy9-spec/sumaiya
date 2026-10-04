# Template System

Template system for the Sumaiya CV Builder. There is exactly **one** provider
implementation — the local `NativeTemplateProvider` — because the app must work with no
network (`docs/DECISIONS.md` D1); `selectProvider()` in `index.ts` returns it
unconditionally, with no env-var selection and no remote branch.

## Overview

The template system provides:

- **TemplateProvider abstraction** - A stable interface with exactly one implementation (local)
- **Template families** - Group related templates (CV + cover letter + reference sheet)
- **Dynamic rendering** - Render CVs to HTML/PDF with user data
- **Export pipeline** - PDF, HTML, JSON formats with proper error handling
- **TypeScript safety** - Full type definitions across all modules
- **Database migrations** - Clean schema for document storage

## Architecture

```
Application Layer
    ↓
TemplateProvider Interface (schema.ts)
    ↓
┌─────────────────────────────────────────┐
│  NativeTemplateProvider (the only one)  │
│  - Local template registry              │
│  - In-memory families                   │
│  - Browser-based rendering              │
└─────────────────────────────────────────┘
```

**Key insight:** All UI code uses the interface, so the abstraction outlived the second
implementation that was once planned for it. There is nothing to swap to: the remote path was
deleted (`docs/DECISIONS.md` D1).

## Modules

### Core

**schema.ts** (232 lines)
- `TemplateProvider` interface - Contract all providers implement
- `TemplateMetadata` - Template identity, preview, fields, access
- `TemplateFamily` - Group related templates
- `DocumentContent` - User-provided CV data
- `RenderedDocument` - HTML/PDF-ready output
- `StoredDocument` - Database-persisted document

**native-provider.ts** (318 lines)
- `NativeTemplateProvider` - Local implementation
- Methods: `getTemplate()`, `getTemplatesByCategory()`, `getTemplateFamily()`, `getFamiliesForProduct()`
- Rendering: `renderDocument()` with HTML generation
- Export: `exportPdf()` with metadata

### Data

**registry.ts** (auto-generated)
- `TEMPLATE_REGISTRY` - 266 registry entries with metadata
- Generated from 269 .tsx files (266 template sources + 2 helpers) in components/templates/
- Includes family, tier, editable fields, versions

**families.ts**
- `TEMPLATE_FAMILIES` - 8 families (5 core, 3 premium)
- Helpers: `getFamiliesForProduct()`, `getFamiliesByCategory()`, `getFamilyById()`
- Family members with role (primary, matching, supporting)

**schemas.ts**
- `STANDARD_CV_SCHEMA` - 14 editable fields, shared by all templates
- Fields: personalInfo, summary, experience[], education[], skills[], etc.
- Per-field validation (minLength, maxLength, pattern, required)
- `TEMPLATE_SCHEMAS` - Per-template schema overrides

### Integration

There is no remote provider module. `templatehub-provider.ts` (296 lines, self-labelled a
stub) was **deleted** in commit `aee08ae` under `docs/DECISIONS.md` D1:
`selectProvider()` in `index.ts` returns the local `NativeTemplateProvider`
unconditionally, with no env var and no remote branch.

### Database

**migrations.ts**
- Phase 1: Create `documents`, `document_exports`, `template_metadata_cache`, `template_families` tables - **design only**: the `documents` table is not in the live Drizzle schema (`cv`, `cover_letter` and `letter` are still separate)
- Phase 2: Redirect new writes to new tables
- Phase 3: Backfill existing data
- Phase 4: Deprecate old tables
- Phase 5: Delete old tables (safeguard period)

Helper functions:
- `getMigrationSQL(phase)` - Get SQL for a phase
- `checkMigrationStatus()` - Verify migration state
- `convertCVToDocument()` - Transform old format to new

### Testing

**test-utils.ts**
- `SAMPLE_CV_DATA` - Complete sample CV
- `MockTemplateProvider` - Mock for unit tests
- `testDataFactory` - Create test data with overrides
- `templateAssertions` - Validation helpers

## Usage

### Load Templates

```typescript
import { templateProvider } from '@/lib/templates';

// Get all core CV templates
const templates = await templateProvider.getTemplatesByCategory('cv', {
  tier: 'core',
});

// Get templates in a family
const familyTemplates = await templateProvider.getTemplatesByCategory('cv', {
  family: 'ats-optimized',
});

// Get families for a product
const families = await templateProvider.getFamiliesForProduct('sumaiya', {
  category: 'cv',
});
```

### Render CV

```typescript
import { templateProvider } from '@/lib/templates';
import type { CVData } from '@/types';

const cvData: CVData = { /* user CV */ };

const rendered = await templateProvider.renderDocument(
  'apex-ats',    // template ID
  cvData,
  { lang: 'en' } // options
);

// rendered.content is HTML string
```

### Export to PDF

```typescript
import { useCVExport } from '@/lib/cv-builder';

function ExportButtons() {
  const { exportAsPDF } = useCVExport();

  const handleExport = async () => {
    const blob = await exportAsPDF('apex-ats', cvData);
    // blob is Blob with type 'application/pdf'
  };
}
```

### Use in Components

```typescript
import { TemplateSelectionModal } from '@/components/editor/template-selection-modal';
import { DynamicTemplateRenderer } from '@/components/editor/dynamic-template-renderer';

function Editor() {
  const [templateId, setTemplateId] = useState('nakuru');

  return (
    <>
      <TemplateSelectionModal
        isOpen={showPicker}
        onSelectTemplate={setTemplateId}
        onClose={() => setShowPicker(false)}
      />

      <DynamicTemplateRenderer
        templateId={templateId}
        cvData={cvData}
        lang="en"
      />
    </>
  );
}
```

## Gradual Migration Path

### Current State (Now)

- ✅ Local NativeTemplateProvider fully functional
- ✅ Template families defined
- ✅ Schema validation working
- ✅ Dynamic rendering implemented
- ✅ CV Builder integration complete
- ⏳ Database migrations ready (Phase 1-5 defined)
- ❌ TemplateHub API - dropped (`docs/DECISIONS.md` D1); the client was deleted in `aee08ae`

### Phase 1: Deploy Local System

```bash
# 1. Run database migration Phase 1
#    There is NO npm script for this (`migrate:templates` does not exist).
#    The SQL lives in lib/templates/migrations.ts (MIGRATIONS / getMigrationSQL).

# 2. Build (deployment is the Vercel flow - there is no "npm run deploy" script)
npm run build

# 3. Monitor analytics
# - Template selection rate
# - Export success rate
# - Performance metrics
```

### Phase 2-3: Backfill & Stabilize

```bash
# Backfill existing CVs to the new tables (Phase 3)
#    Same as above: SQL from lib/templates/migrations.ts, no npm script exists.

# Monitor for issues
```

### Phase 4-5: dropped

The remote-provider phases were dropped by `docs/DECISIONS.md` D1, and the client was deleted
in `aee08ae`. There is no TemplateHub API to integrate with and no provider swap to make.

## Files

```
lib/templates/
├── schema.ts                    (core types)
├── native-provider.ts           (local impl)
├── registry.ts                  (auto-generated)
├── families.ts                  (template families)
├── schemas.ts                   (editable fields)
├── migrations.ts                (database)
├── test-utils.ts                (testing)
├── index.ts                     (main exports)
├── database-schema.sql          (SQL DDL)
└── README.md                    (this file)

components/editor/
├── template-picker.tsx          (UI grid)
├── template-selection-modal.tsx (modal workflow)
└── dynamic-template-renderer.tsx (live preview)

lib/cv-builder/
├── template-integration.ts      (utilities)
├── use-template-provider.ts     (React hook)
├── use-cv-export.ts             (export hook)
├── template-adapter.ts          (legacy bridge)
├── index.ts                     (exports)
└── INTEGRATION_GUIDE.md         (how-to)
```

## Testing

### Unit Tests

```typescript
import { NativeTemplateProvider } from '@/lib/templates';
import { templateAssertions, testDataFactory } from '@/lib/templates/test-utils';

test('renderDocument produces valid HTML', async () => {
  const provider = new NativeTemplateProvider();
  const cvData = testDataFactory.createCVData();

  const rendered = await provider.renderDocument('nakuru', cvData);

  templateAssertions.assertValidHTML(rendered.content);
  expect(rendered.content).toContain('John Doe');
});
```

### Integration Tests

```typescript
test('full export pipeline', async () => {
  const { exportAsPDF } = useCVExport();
  const cvData = testDataFactory.createCVData();

  const blob = await exportAsPDF('nakuru', cvData);

  expect(blob.type).toBe('application/pdf');
  expect(blob.size).toBeGreaterThan(0);
});
```

## Performance

- Template loading: O(1) lookup in registry
- Rendering: ~200ms for single-page CV
- PDF export: ~800ms (browser-based)
- Memory: ~2MB for entire registry + families

## Troubleshooting

**Templates not loading**
- Check TEMPLATE_REGISTRY is generated: `node scripts/generate-template-registry.mjs`
- Verify templateProvider is initialized
- Check browser console for errors

**Rendering fails**
- Ensure CVData has required fields (personalInfo.fullName)
- Verify templateId exists in registry
- Check for XSS issues in HTML generation

**PDF export blank**
- Verify HTML renders correctly first
- Check DOM element is properly mounted
- Verify renderElementToPdfBlob options

## Migration Checklist

Before deploying to production:

- [ ] Run Phase 1 database migration
- [ ] Deploy cv-builder integration
- [ ] Test template selection in editor
- [ ] Test PDF export
- [ ] Monitor error rates for 1 week
- [ ] Run Phase 2-3 migrations
- [ ] Test rollback procedures
- [ ] Re-measure the counts in this file against `apps/web/CLAUDE.md` (they drift)

## References

- [Verified template-system reference](../../CLAUDE.md) - counts, provider rule, what is a stub
- [CV Builder Integration Guide](../../lib/cv-builder/INTEGRATION_GUIDE.md)
- [Database Schema](./database-schema.sql)
- [TemplateProvider Interface](./schema.ts)
- [Migration Runbook](./migrations.ts)
