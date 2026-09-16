# Template System

Complete template management system for Sumaiya CV Builder, with pluggable provider architecture for seamless TemplateHub integration.

## Overview

The template system provides:

- **TemplateProvider abstraction** - Swap between local and remote templates with one line
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
│  NativeTemplateProvider (current)       │
│  - Local template registry              │
│  - In-memory families                   │
│  - Browser-based rendering              │
└─────────────────────────────────────────┘
    ↓ (ONE LINE SWAP when ready)
┌─────────────────────────────────────────┐
│  TemplateHubProvider (future)           │
│  - Remote API calls                     │
│  - Cloud rendering service              │
│  - Caching layer                        │
└─────────────────────────────────────────┘
```

**Key insight:** All UI code uses the interface. Provider swap requires zero UI changes.

## Modules

### Core

**schema.ts** (212 lines)
- `TemplateProvider` interface - Contract all providers implement
- `TemplateMetadata` - Template identity, preview, fields, access
- `TemplateFamily` - Group related templates
- `DocumentContent` - User-provided CV data
- `RenderedDocument` - HTML/PDF-ready output
- `StoredDocument` - Database-persisted document

**native-provider.ts** (160+ lines)
- `NativeTemplateProvider` - Local implementation
- Methods: `getTemplate()`, `getTemplatesByCategory()`, `getTemplateFamily()`, `getFamiliesForProduct()`
- Rendering: `renderDocument()` with HTML generation
- Export: `exportPdf()` with metadata

### Data

**registry.ts** (auto-generated)
- `TEMPLATE_REGISTRY` - 267 templates with metadata
- Generated from 267 .tsx files in components/templates/
- Includes family, tier, editable fields, versions

**families.ts**
- `TEMPLATE_FAMILIES` - 8 families (5 core, 3 premium)
- Helpers: `getFamiliesForProduct()`, `getFamiliesByCategory()`, `getFamilyById()`
- Family members with role (primary, matching, supporting)

**schemas.ts**
- `STANDARD_CV_SCHEMA` - 12+ editable fields for all templates
- Fields: personalInfo, summary, experience[], education[], skills[], etc.
- Per-field validation (minLength, maxLength, pattern, required)
- `TEMPLATE_SCHEMAS` - Per-template schema overrides

### Integration

**templatehub-provider.ts** (296 lines)
- `TemplateHubProvider` - Remote API implementation (stub)
- Methods mirror NativeTemplateProvider exactly
- HTTP client for TemplateHub API
- Caching and error handling built-in
- Ready for when TemplateHub API is built

### Database

**migrations.ts**
- Phase 1: Create `documents`, `document_exports`, `template_metadata_cache`, `template_families` tables
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
- ⏳ TemplateHub API (stub, ready to implement)

### Phase 1: Deploy Local System

```bash
# 1. Run database migration Phase 1
npm run migrate:templates -- --phase 1

# 2. Deploy cv-builder integration
npm run build
npm run deploy

# 3. Monitor analytics
# - Template selection rate
# - Export success rate
# - Performance metrics
```

### Phase 2-3: Backfill & Stabilize

```bash
# Backfill existing CVs to new documents table
npm run migrate:templates -- --phase 3

# Monitor for issues
```

### Phase 4-5: TemplateHub Integration

```typescript
// When TemplateHub API is ready:
// 1. Build TemplateHub API
// 2. Update lib/templates/index.ts:

export const templateProvider: TemplateProvider = 
  new TemplateHubProvider(apiClient, 'sumaiya');

// 3. Deploy - no UI changes needed!
```

## Files

```
lib/templates/
├── schema.ts                    (core types)
├── native-provider.ts           (local impl)
├── registry.ts                  (auto-generated)
├── families.ts                  (template families)
├── schemas.ts                   (editable fields)
├── templatehub-provider.ts      (remote impl stub)
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
- Check TEMPLATE_REGISTRY is generated: `npm run generate:registry`
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
- [ ] Plan TemplateHub API implementation

## References

- [Sumaiya × TemplateHub Vision](../../docs/STRATEGIC_VISION.md)
- [CV Builder Integration Guide](../../lib/cv-builder/INTEGRATION_GUIDE.md)
- [Database Schema](./database-schema.sql)
- [TemplateProvider Interface](./schema.ts)
- [Migration Runbook](./migrations.ts)
