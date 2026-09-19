# CV Builder Integration Guide

This guide shows how to integrate the CV Builder TemplateProvider system into existing CV editor components.

## Quick Start

### 1. Import the Module

```typescript
import { 
  loadCVTemplates, 
  loadTemplateFamilies,
  useCVExport,
  getTemplateComponent,
} from '@/lib/cv-builder';
```

### 2. Use Template Picker Modal

```typescript
import { TemplateSelectionModal } from '@/components/editor/template-selection-modal';
import { useState } from 'react';

function MyEditor() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState('nakuru');

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Change Template
      </button>

      <TemplateSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectTemplate={(id) => setCurrentTemplateId(id)}
        currentTemplateId={currentTemplateId}
      />
    </>
  );
}
```

### 3. Render Template Preview

```typescript
import { DynamicTemplateRenderer } from '@/components/editor/dynamic-template-renderer';
import type { CVData } from '@/types';

function PreviewPane({ templateId, cvData }: { templateId: string; cvData: CVData }) {
  return (
    <DynamicTemplateRenderer 
      templateId={templateId} 
      cvData={cvData}
      lang="en"
    />
  );
}
```

### 4. Export CV

```typescript
import { useCVExport } from '@/lib/cv-builder';

function ExportButtons({ templateId, cvData }: Props) {
  const { exportAsPDF, exportAsHTML, isExporting } = useCVExport();

  return (
    <>
      <button 
        onClick={() => exportAsPDF(templateId, cvData)}
        disabled={isExporting}
      >
        Download PDF
      </button>
      <button 
        onClick={() => exportAsHTML(templateId, cvData)}
        disabled={isExporting}
      >
        Download HTML
      </button>
    </>
  );
}
```

## API Reference

### loadCVTemplates(options)

Load all CV templates with optional filtering.

```typescript
const templates = await loadCVTemplates({
  family: 'ats-optimized',  // optional
  tier: 'core',             // 'core' | 'premium', default 'core'
});
```

### loadTemplateFamilies()

Get all available template families for Sumaiya.

```typescript
const families = await loadTemplateFamilies();
// Returns: { id, name, description, tier, templates[] }[]
```

### renderCVPreview(templateId, cvData, options)

Render a CV template to HTML.

```typescript
const html = await renderCVPreview(
  'apex-ats',
  cvData,
  { lang: 'en' }
);
```

### useCVExport()

Hook for exporting CVs to multiple formats.

```typescript
const { 
  exportAsPDF,    // (templateId, cvData, options?) => Promise<Blob>
  exportAsHTML,   // (templateId, cvData, options?) => Promise<Blob>
  exportAsJSON,   // (cvData, options?) => Promise<Blob>
  isExporting,    // boolean
  error,          // string | null
} = useCVExport();
```

### getTemplateComponent(templateId)

Get the React component for a template (legacy system).

```typescript
const Component = getTemplateComponent('apex-ats');
// Falls back to NakuruTemplate if not found
```

## Integration Steps

### In cv-editor-client.tsx

1. Add template selection button to toolbar:

```typescript
<button 
  onClick={() => setShowTemplateModal(true)}
  className="flex items-center gap-2"
>
  <LayoutGrid className="w-4 h-4" />
  Change Template
</button>
```

2. Add modal to component:

```typescript
<TemplateSelectionModal
  isOpen={showTemplateModal}
  onClose={() => setShowTemplateModal(false)}
  onSelectTemplate={(id) => {
    setTemplate(id as TemplateId);
    setShowTemplateModal(false);
  }}
  currentTemplateId={templateId}
/>
```

3. Wire export button to useCVExport:

```typescript
const { exportAsPDF, isExporting } = useCVExport();

// In download handler:
const blob = await exportAsPDF(templateId, cvData);
triggerBlobDownload(blob, `${title}.pdf`);
```

## Architecture

### TemplateProvider Pattern

All code uses the TemplateProvider abstraction:

```
User Component
    ↓
TemplateProvider Interface
    ↓
NativeTemplateProvider (local, current)
    ↓
TEMPLATE_REGISTRY + TEMPLATE_FAMILIES
```

Provider resolution is a single, unconditional step: `selectProvider()` in
`lib/templates/index.ts` returns `nativeTemplateProvider`. There is no second implementation
to swap in (`docs/DECISIONS.md` D1 — an offline-first APK cannot fetch templates remotely). UI
code depends only on the `TemplateProvider` interface, so the abstraction stays even though it
has exactly one implementation.

## Rendering Pipeline

```
renderCVPreview(templateId, cvData)
    ↓
TemplateProvider.renderDocument()
    ↓
NativeTemplateProvider.buildTemplateHtml()
    ↓
Generate HTML with CV data (name, experience, education, skills, etc.)
    ↓
Return HTML string
```

For PDF export:
```
exportAsPDF(templateId, cvData)
    ↓
renderCVPreview() → HTML
    ↓
renderElementToPdfBlob() → Blob
    ↓
triggerBlobDownload() → Save file
```

## Features

✅ **Load templates by family** - Group related templates together  
✅ **Render to HTML** - Full HTML generation with proper formatting  
✅ **Export to PDF** - Browser-native PDF export  
✅ **Export to HTML/JSON** - Alternative formats  
✅ **Template picker UI** - Browse and select templates  
✅ **Error handling** - Graceful fallbacks  
✅ **TypeScript types** - Full type safety  
✅ **Provider abstraction** - One implementation behind a stable interface  

## Gradual Migration

The system supports running old and new code together:

1. **Phase 1 (now):** New code uses TemplateProvider
   - Old code uses TEMPLATE_COMPONENTS directly
   - Both work side-by-side
   - No breaking changes

2. **Phase 2 (future):** Migrate components gradually
   - Replace direct template imports with template-selection-modal
   - Move rendering to dynamic-template-renderer
   - Switch export to useCVExport hook

3. **Phase 3 (dropped):** there is no remote provider to switch to. `docs/DECISIONS.md` D1
   deleted the TemplateHub path; the native provider is the only implementation.

## Testing

Test the integration:

```typescript
// Test 1: Load templates
const templates = await loadCVTemplates();
expect(templates.length).toBeGreaterThan(0);

// Test 2: Render CV
const html = await renderCVPreview('nakuru', sampleCV);
expect(html).toContain('<div');

// Test 3: Export PDF
const blob = await exportAsPDF('nakuru', sampleCV);
expect(blob.type).toBe('application/pdf');
```

## Troubleshooting

### Templates not loading
- Check that TEMPLATE_REGISTRY is populated
- Verify TemplateProvider is initialized
- Check browser console for errors

### Rendering fails
- Ensure cvData has required fields (personalInfo.fullName)
- Check that templateId exists in registry
- Verify no XSS issues in HTML generation

### PDF export blank
- Make sure HTML is valid before PDF conversion
- Check renderElementToPdfBlob options
- Verify DOM element is properly mounted

## References

- [TemplateProvider Schema](./../../lib/templates/schema.ts)
- [NativeTemplateProvider](./../../lib/templates/native-provider.ts)
- [TEMPLATE_REGISTRY](./../../lib/templates/registry.ts)
- [Database Schema](./../../lib/templates/database-schema.sql)
