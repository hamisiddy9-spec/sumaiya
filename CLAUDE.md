# CLAUDE.md — Project Architecture & Context

## Project Overview

**Sumaiya × TemplateHub**: Two-repo separation of Career Intelligence platform.

- **Sumaiya**: Main web/mobile app (Next.js/React Native) with pluggable template system
- **TemplateHub**: Remote template service (Node.js + Next.js) serving 267+ templates via API

## Architecture

### Template System Pattern

**TemplateProvider** abstraction enables one-line provider swap:

```typescript
// lib/templates/index.ts
export const templateProvider = 
  process.env.NEXT_PUBLIC_TEMPLATE_PROVIDER === 'remote'
    ? new TemplateHubProvider(baseUrl, apiKey)
    : new NativeTemplateProvider();
```

### Two-Repo Boundary

**Sumaiya contains NO TemplateHub code**:
- Only abstract `TemplateProvider` interface
- Only `TemplateHubProvider` HTTP client for remote calls
- All 267 templates + rendering logic in native provider (local)

**TemplateHub is autonomous**:
- Complete API server with template registry
- Database (PostgreSQL) + caching (Redis)
- HTML/PDF rendering pipeline
- Independent deployment

### Template Organization

**8 Template Families** (267 total):
1. core-simple (basic resume)
2. core-professional (formatted resume)
3. core-ats (ATS-optimized)
4. professional-minimal (clean design)
5. ats-optimized (auto-parsing)
6. executive-professional (C-suite)
7. modern-specialist (modern design)
8. creative-professional (creative fields)

**Per-Template Schema Overrides**: 12+ CV fields with per-template validation rules.

**Document Versioning**: `content_snapshot` field preserves rendering compatibility on template updates.

## Implementation Status

### Completed Phases (All ✅)

**Phase 1: Template System Core**
- [x] `lib/templates/schema.ts` — TemplateProvider interface contract
- [x] `lib/templates/native-provider.ts` — 267 templates + rendering (HTML/PDF)
- [x] `lib/templates/registry.ts` — Auto-generated template metadata
- [x] `lib/templates/families.ts` — 8 families + classification
- [x] `lib/templates/schemas.ts` — Editable field definitions
- [x] `lib/templates/migrations.ts` — Phase 1-5 SQL + helpers

**Phase 2: CV Builder Integration**
- [x] `lib/cv-builder/template-integration.ts` — Wrapper utilities
- [x] `lib/cv-builder/use-template-provider.ts` — React hooks
- [x] `lib/cv-builder/use-cv-export.ts` — PDF/HTML/JSON export
- [x] `components/editor/template-picker.tsx` — UI component
- [x] `components/editor/template-selection-modal.tsx` — Modal selector

**Phase 3: Database Schema**
- [x] `documents` table (id, user_id, template_id, content_data jsonb, content_snapshot)
- [x] Consolidation of cv/letter/reference tables into unified documents
- [x] Index optimization + foreign keys

**Phase 4: Documentation**
- [x] README.md (system guide, usage examples, migration path)
- [x] TEMPLATE_IMPLEMENTATION_CHECKLIST.md (7 phases, 20 files)
- [x] E2E_TEST_PLAN.md (10 web + 12 mobile scenarios)
- [x] DEPLOYMENT_GUIDE.md (web + mobile + post-launch)
- [x] TEMPLATEHUB_REFACTOR_SESSION.md (8-phase refactor plan)

**Phase 5: TemplateHub API (Complete)**
- [x] `templatehub/src/api/templates/route.ts` — GET /api/templates
- [x] `templatehub/src/api/documents/render/route.ts` — POST /api/documents/render
- [x] `templatehub/src/api/families/route.ts` — GET /api/families
- [x] `templatehub/src/api/exports/pdf/route.ts` — POST /api/exports/pdf
- [x] Type definitions (template.ts, document.ts)
- [x] Auth validation (validate-key.ts)
- [x] Database schema (migrate.sql)
- [x] Docker setup (docker-compose.yml, scripts)
- [x] CI/CD pipelines (test.yml, build.yml, deploy.yml)
- [x] Environment config (.env.example)

## Key Files Reference

### Sumaiya (Main Repo)

| File | Purpose |
|------|---------|
| `lib/templates/schema.ts` | TemplateProvider + types |
| `lib/templates/native-provider.ts` | Local template implementation (267 templates) |
| `lib/templates/registry.ts` | Template metadata auto-generated |
| `lib/templates/families.ts` | Template classification (8 families) |
| `lib/templates/templatehub-provider.ts` | Remote API HTTP client |
| `lib/cv-builder/template-integration.ts` | UI wrapper utilities |
| `components/editor/template-picker.tsx` | Template selection UI |
| `TEMPLATE_IMPLEMENTATION_CHECKLIST.md` | Completion status |

### TemplateHub (Separate Repo)

TemplateHub lives in its own repository (`hamisiddy9-spec/TemplateHub`). Sumaiya
talks to it only through `TemplateHubProvider` (the HTTP client in
`lib/templates/templatehub-provider.ts`). No TemplateHub server code, SQL, or
Docker config belongs in this repo.

## Implementation Details

### TemplateProvider Interface

```typescript
interface TemplateProvider {
  getTemplate(id: string): Promise<TemplateMetadata>;
  getTemplatesByCategory(category: string): Promise<TemplateMetadata[]>;
  getTemplateFamily(familyId: string): Promise<TemplateFamily>;
  getFamiliesForProduct(product: string): Promise<TemplateFamily[]>;
  renderDocument(templateId: string, userData: any): Promise<string>;
  exportPdf(html: string): Promise<Buffer>;
}
```

### Database Schema (Phase 1)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id VARCHAR(255) NOT NULL,
  template_version INT NOT NULL,
  category VARCHAR(50),
  content_data JSONB NOT NULL,
  content_snapshot TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_exported_at TIMESTAMP,
  version BIGINT DEFAULT 1
);
```

## Authentication Pattern

**API Key-Based Auth** (TemplateHub):
- Bearer token in Authorization header
- Validate against api_keys table
- Hash comparison (JWT secret not needed for simple auth)

## Provider Swap

**Local (Default - Sumaiya)**:
```javascript
NEXT_PUBLIC_TEMPLATE_PROVIDER=native
```

**Remote (TemplateHub)**:
```javascript
NEXT_PUBLIC_TEMPLATE_PROVIDER=remote
TEMPLATE_HUB_API_URL=https://templatehub.example.com
TEMPLATE_HUB_API_KEY=sk_prod_...
```

## Build & Deployment Status

✅ Web build: `npm run build` → success  
✅ Mobile build: `npm run build:android` → APK generated  
✅ E2E tests: Prepared (manual + automated scenarios)  
✅ TemplateHub infrastructure: Complete (stubs ready)  
⏳ Production deployment: Requires Vercel authentication  
⏳ TemplateHub backend logic: Ready for implementation  

## Recent Commits

- `531e3bf` feat: Complete TemplateHub infrastructure + CI/CD pipelines
- `8a689c2` feat: TemplateHub API stubs + CLAUDE.md architecture update
- `79307fa` docs: Complete E2E testing, deployment, and TemplateHub refactor guides
- `74bcb50` docs: launch ready status
- `a264d23` docs(checklist): Complete template implementation status and deployment guide

## Next Steps

1. **TemplateHub Backend Implementation** (Phase 6):
   - Implement `TemplateStore` database layer
   - Implement `HTMLRenderer` with template component rendering
   - Implement `PDFRenderer` with Puppeteer
   - Seed database with 267 templates

2. **Database Migrations**:
   - Apply Phase 1 SQL (documents table)
   - Run backfill if migrating existing data

3. **Production Deployment**:
   - Sumaiya: Vercel deploy with environment config
   - TemplateHub: Docker deployment with PostgreSQL + Redis
   - Set up API key rotation, monitoring, alerting

4. **Integration Testing**:
   - E2E tests with both providers
   - Fallback to native if TemplateHub unavailable
   - Performance benchmarks (remote vs local)

## Known Issues & Workarounds

**OTP Validation**: Supabase production uses 8-digit codes; auth-code.ts handles it.  
**Template Count**: 267 total (6 excluded by extension/naming rules).  
**OCR Performance**: Reduced timeouts (tesseract 15s, extraction 10s).

## Environment Variables

See `.env.example` for complete list. Key vars:

```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_TEMPLATE_PROVIDER=native|remote
TEMPLATE_HUB_API_URL=https://...
TEMPLATE_HUB_API_KEY=sk_...
```

---

**Last Updated**: 2026-09-15  
**Architecture**: Two-repo separation with pluggable TemplateProvider  
**Status**: All phases complete. Ready for TemplateHub backend implementation.
