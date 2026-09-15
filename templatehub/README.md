# TemplateHub API

Remote template service for Sumaiya CV Builder.

**Status:** API stubs ready. Implementation guide at `/TEMPLATEHUB_REFACTOR_SESSION.md` in main repo.

## Quick Start

```bash
# 1. Setup development environment
./scripts/setup.sh

# 2. Start services
docker-compose up

# 3. Run dev server
npm run dev

# 4. Visit http://localhost:3001
```

## API Endpoints

- `GET /api/templates` — List templates with filtering
- `GET /api/templates/{id}` — Get single template
- `GET /api/families` — List template families
- `POST /api/documents/render` — Render document to HTML
- `POST /api/exports/pdf` — Export to PDF

**Authentication:** All requests require `Authorization: Bearer {API_KEY}` header

## Architecture

```
Sumaiya (web/mobile)
    ↓ (when ready)
TemplateHub API (this repo)
    ↓
PostgreSQL + Redis
```

## Integration with Sumaiya

One-line provider swap in Sumaiya's `lib/templates/index.ts`:

```typescript
export const templateProvider = new TemplateHubProvider(apiClient);
```

## Files

- `src/api/` — API routes (stubs ready for implementation)
- `src/lib/` — Business logic layer
- `src/types/` — TypeScript types
- `scripts/` — Setup and migration scripts
- `tests/` — Integration test framework
- `docker-compose.yml` — Local development setup

## Implementation

Follow the 8-phase plan in the main Sumaiya repo:
`TEMPLATEHUB_REFACTOR_SESSION.md`

## Environment Variables

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret
TEMPLATEHUB_API_KEY=dev-key
```

See `.env.example` for full list.

---

**Next:** Complete implementation following the refactor plan.
