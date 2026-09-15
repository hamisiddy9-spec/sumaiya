# Phase 1 Implementation Roadmap

**Sumaiya Repository Only** — TemplateHub stays separate  
**Timeline:** Weeks 1-2 (parallel with native app build)  
**Scope:** Integrate TemplateProvider into CV builder (zero breaking changes)

---

## Critical Principle

**Do NOT create TemplateHub code in Sumaiya repository.**

The TemplateProvider abstraction is designed to:
- Live in Sumaiya
- Work with local templates (NativeTemplateProvider)
- Be replaceable with a remote provider later (TemplateHubProvider)

When TemplateHub repo exists, it will:
- Have its own database
- Have its own API
- Return data via `TemplateHubProvider` in Sumaiya
- Never share code with Sumaiya (except types via npm package)

**Boundary:** Sumaiya calls TemplateProvider interface. Implementation is swappable.

---

## Phase 1a: Generate Template Registry (Week 1)

### Task 1a.1: Create Registry Generation Script

**File:** `apps/web/scripts/generate-template-registry.mjs`

```javascript
#!/usr/bin/env node
/**
 * Extract metadata from 273 .tsx template files
 * Generate apps/web/lib/templates/registry.ts
 */

import fs from 'fs';
import path from 'path';

const TEMPLATES_DIR = 'apps/web/components/templates';

// Scan for .tsx files
const files = fs.readdirSync(TEMPLATES_DIR)
  .filter(f => f.endsWith('.tsx') && f !== 'index.ts');

const registry = {};

files.forEach((file, idx) => {
  const templateId = file.replace('.tsx', '');
  const templateName = templateId
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  registry[templateId] = {
    id: templateId,
    name: templateName,
    version: '1.0.0',
    source: 'native',
    category: 'cv',
    family: 'pending', // TODO: classify during migration audit
    tier: 'core', // TODO: determine during quality assessment
    accessibleTo: ['sumaiya'],
    editable_fields: [], // TODO: extract schema
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
});

// Write registry.ts
const content = `/**
 * AUTO-GENERATED: apps/web/scripts/generate-template-registry.mjs
 * Do not edit manually. Run: node scripts/generate-template-registry.mjs
 */

import { TemplateMetadata } from './schema';

export const TEMPLATE_REGISTRY: Record<string, TemplateMetadata> = ${JSON.stringify(registry, null, 2)};
`;

fs.writeFileSync('apps/web/lib/templates/registry.ts', content);
console.log(\`✅ Generated registry for \${files.length} templates\`);
```

### Task 1a.2: Run Script

```bash
cd apps/web
node scripts/generate-template-registry.mjs
```

**Output:** `apps/web/lib/templates/registry.ts` with all 273 templates

---

## Phase 1b: Integrate TemplateProvider into CV Builder (Week 1-2)

### Task 1b.1: Update CV Builder to Use Provider

**File:** `apps/web/components/cv-builder/index.tsx`

**Current pattern (REMOVE):**
```typescript
import { AberdareCV } from '@/components/templates/aberdare';
import { AlpineCV } from '@/components/templates/alpine';
import { ApexCV } from '@/components/templates/apex';
// ... 270 more imports
```

**New pattern (ADD):**
```typescript
import { templateProvider } from '@/lib/templates';
import { TemplateMetadata } from '@/lib/templates/schema';

export function CVBuilder({ userId }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);
  
  // Load templates from provider
  const loadTemplates = async () => {
    const templates = await templateProvider.getTemplatesByCategory('cv');
    setTemplates(templates);
  };
  
  // Render selected template
  const handleSelect = async (template: TemplateMetadata) => {
    setSelectedTemplate(template);
    // Load template component dynamically (TODO: next task)
  };
}
```

### Task 1b.2: Template Discovery (Template Picker)

**File:** `apps/web/components/cv-builder/template-picker.tsx`

**Show template families:**
```typescript
import { getFamiliesForProduct } from '@/lib/templates';

export function TemplatePicker() {
  const families = getFamiliesForProduct('sumaiya');
  
  return (
    <div>
      <h2>Choose Your CV</h2>
      
      {families.map(family => (
        <TemplateFamily key={family.id} family={family} />
      ))}
    </div>
  );
}
```

### Task 1b.3: Dynamic Template Loading (Stub for Now)

**File:** `apps/web/lib/templates/native-provider.ts`

**Method: `renderDocument()`** — currently returns placeholder

```typescript
async renderDocument(
  templateId: string,
  userData: DocumentContent,
  options?: { lang?: 'en' | 'sw' }
): Promise<RenderedDocument> {
  const template = await this.getTemplate(templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  // TODO: Implement rendering
  // Step 1: Load template component from apps/web/components/templates/
  // Step 2: Render with React/SSR
  // Step 3: Return HTML string
  
  return {
    templateId,
    templateVersion: template.version,
    content: '<div>TODO: Implement</div>',
    metadata: {
      createdAt: new Date().toISOString(),
      exportFormat: 'html',
      documentType: template.category,
    },
  };
}
```

---

## Phase 1c: Add Tests (Week 2)

### Task 1c.1: Unit Tests for TemplateProvider

**File:** `apps/web/lib/templates/__tests__/provider.test.ts`

```typescript
import { nativeTemplateProvider } from '../native-provider';

describe('NativeTemplateProvider', () => {
  it('should load template metadata', async () => {
    const template = await nativeTemplateProvider.getTemplate('simple-cv');
    expect(template).toBeDefined();
    expect(template?.category).toBe('cv');
  });

  it('should filter templates by category', async () => {
    const cvs = await nativeTemplateProvider.getTemplatesByCategory('cv');
    expect(cvs.length).toBeGreaterThan(0);
  });

  it('should return families for sumaiya product', async () => {
    const families = await nativeTemplateProvider.getFamiliesForProduct('sumaiya');
    expect(families.length).toBeGreaterThan(0);
    expect(families.every(f => f.tier === 'core')).toBe(true);
  });
});
```

### Task 1c.2: Integration Tests

**File:** `apps/web/__tests__/cv-builder.test.ts`

```typescript
describe('CV Builder with TemplateProvider', () => {
  it('should load templates on mount', async () => {
    const { getByText } = render(<CVBuilder userId="test-user" />);
    // TODO: Wait for templates to load
    // TODO: Assert templates appear
  });

  it('should select a template without breaking', async () => {
    // TODO: Click template
    // TODO: Assert it's selected
    // TODO: Assert CV content renders
  });

  it('should populate template with user data', async () => {
    // TODO: Fill form
    // TODO: Select template
    // TODO: Assert fields populated correctly
  });
});
```

---

## Phase 1d: Preserve Existing Functionality (Week 2)

### Task 1d.1: Backcompat Tests

**Verify NO breaking changes:**

```bash
npm run web:test        # All tests pass
npm run web:typecheck   # No type errors
npm run web:build       # Builds without errors
```

**Test existing CVs:**
- ✅ Can load an existing CV
- ✅ Can view existing CV in builder
- ✅ Can export existing CV to PDF
- ✅ Can create new CV with template picker
- ✅ Can edit CV fields
- ✅ Can switch templates mid-edit

---

## What NOT to Do in This Phase

❌ Create TemplateHub routes/API in Sumaiya  
❌ Create TemplateHub database schema in Sumaiya  
❌ Modify authentication (still Supabase)  
❌ Change existing CV export routes  
❌ Modify existing database tables (yet)  

---

## What WILL Be Different

✅ CV builder uses TemplateProvider instead of direct component imports  
✅ Template discovery via `getTemplatesByCategory()` + `getFamiliesForProduct()`  
✅ Template metadata (editable_fields, tier, family) is accessible  
✅ Environment variable `NEXT_PUBLIC_TEMPLATE_PROVIDER` is ready (for future provider switch)  

---

## Ready for TemplateHub Integration

Once TemplateHub repo exists and API is ready:

```typescript
// apps/web/lib/templates/templatehub-provider.ts
export class TemplateHubProvider implements TemplateProvider {
  constructor(private apiClient: TemplateHubClient) {}
  
  async getTemplate(id: string) {
    return this.apiClient.get(`/templates/${id}`);
  }
  
  async renderDocument(templateId, data) {
    return this.apiClient.post('/documents/render', {
      templateId,
      data,
    });
  }
}

// apps/web/lib/templates/index.ts
const provider = process.env.NEXT_PUBLIC_TEMPLATE_PROVIDER === 'templatehub'
  ? new TemplateHubProvider(apiClient)
  : new NativeTemplateProvider();
```

**No UI changes needed.** Just a provider swap.

---

## File Changes Summary

### New Files
- `apps/web/scripts/generate-template-registry.mjs`
- `apps/web/lib/templates/schema.ts` ✅ (done)
- `apps/web/lib/templates/provider.ts` ✅ (done)
- `apps/web/lib/templates/native-provider.ts` ✅ (done)
- `apps/web/lib/templates/registry.ts` ✅ (done)
- `apps/web/lib/templates/families.ts` ✅ (done)
- `apps/web/lib/templates/index.ts` ✅ (done)
- `apps/web/lib/templates/__tests__/provider.test.ts`

### Modified Files
- `apps/web/components/cv-builder/index.tsx` — use templateProvider
- `apps/web/components/cv-builder/template-picker.tsx` — list families

### NOT Modified (preserved)
- `apps/web/app/` (routes)
- `apps/web/lib/api/` (API endpoints)
- `apps/web/lib/db/` (database)
- `apps/web/components/templates/` (273 .tsx files, still exist)

---

## Commit Sequence

### ✅ Done
1. `799dc62` — feat(templates): Phase 1 foundation

### Next (Week 1)
2. `feat(scripts): generate-template-registry.mjs`
3. `feat(cv-builder): integrate TemplateProvider`
4. `test(templates): add unit + integration tests`

### Then (Week 2)
5. `docs(phase-1): implementation complete`

---

## Success Criteria

✅ All 273 templates in registry  
✅ CV builder loads templates via TemplateProvider  
✅ Template picker shows families  
✅ Existing CVs still render  
✅ All tests pass (no regressions)  
✅ Zero breaking changes to API  
✅ Zero breaking changes to auth  
✅ templateProvider can be swapped via env var  

---

## Timeline

**Week 1:**
- Day 1-2: Generate registry (Task 1a)
- Day 3-4: Integrate CV builder (Task 1b)
- Day 5: Tests (Task 1c)

**Week 2:**
- Day 1-3: Backcompat verification (Task 1d)
- Day 4-5: Buffer + refinement

---

## Communication Boundary

**Sumaiya Repo:**
- TemplateProvider interface
- NativeTemplateProvider implementation
- Registry (metadata for 273 templates)
- Families (grouping logic)
- CV builder integration

**TemplateHub Repo (future):**
- TemplateHubProvider implementation
- Template definitions
- Template rendering engine
- Template versioning/storage
- TemplateHub API

**Communication:**
- Sumaiya → TemplateHub: Via TemplateProvider interface
- TemplateHub → Sumaiya: Via HTTP API (TemplateHubProvider)
- No shared database tables
- No shared code (except types exported as npm package)

---

**Status:** Phase 1 foundation ✅ complete. Integration roadmap ready.  
**Next:** Execute Week 1 tasks (registry generation + CV builder integration).
