# TemplateHub Refactor & Alignment Session

> **Superseded (2026-09-15).** TemplateHub already lives in its own repo
> (`hamisiddy9-spec/TemplateHub`). Sumaiya no longer contains any TemplateHub
> code — only the `TemplateProvider` abstraction + `TemplateHubProvider` HTTP
> client. **No Docker** is used for this. This doc is kept for historical
> reference of the original plan.

Complete guide for creating TemplateHub repo and aligning with Sumaiya project.

## 🎯 Session Goal

Create separate TemplateHub repository with:
- Remote API for template management
- Document rendering service  
- Template storage & versioning
- Seamless integration with Sumaiya (one-line provider swap)

**Timeline:** 3-4 sessions of 2-3 hours each  
**Outcome:** Production-ready TemplateHub API ready for Sumaiya integration

---

## 📋 Phase 1: TemplateHub Repository Setup

### 1.1 Repository Structure

```
templatehub/
├── src/
│   ├── api/                    # Next.js API routes
│   │   ├── templates/          # Template endpoints
│   │   │   ├── route.ts        # GET /templates
│   │   │   └── [id]/route.ts   # GET /templates/{id}
│   │   ├── families/           # Family endpoints
│   │   │   ├── route.ts        # GET /families
│   │   │   └── [id]/route.ts   # GET /families/{id}
│   │   ├── documents/          # Document endpoints
│   │   │   └── render/route.ts # POST /documents/render
│   │   └── exports/            # Export endpoints
│   │       └── pdf/route.ts    # POST /exports/pdf
│   │
│   ├── lib/
│   │   ├── templates/          # Template logic
│   │   │   ├── store.ts        # Template storage (DB)
│   │   │   ├── renderer.ts     # HTML/PDF rendering
│   │   │   └── validator.ts    # Schema validation
│   │   │
│   │   ├── auth/               # API authentication
│   │   │   ├── verify-token.ts # JWT verification
│   │   │   └── rate-limit.ts   # Rate limiting
│   │   │
│   │   ├── rendering/          # Document rendering engine
│   │   │   ├── html-render.ts  # React → HTML
│   │   │   ├── pdf-convert.ts  # HTML → PDF (Puppeteer/wkhtmltopdf)
│   │   │   └── fonts.ts        # Font loading
│   │   │
│   │   └── db/
│   │       ├── schema.ts       # Database types
│   │       └── migrations.ts   # Schema migrations
│   │
│   └── types/
│       ├── api.ts             # API request/response types
│       ├── template.ts        # Template types
│       └── document.ts        # Document types
│
├── tests/
│   ├── integration/           # API integration tests
│   └── unit/                  # Unit tests
│
├── docs/
│   ├── API.md                # Complete API documentation
│   ├── ARCHITECTURE.md       # System design
│   └── DEPLOYMENT.md         # Production deployment
│
├── docker/
│   ├── Dockerfile            # Production Docker image
│   └── docker-compose.yml    # Local development
│
├── .env.example
├── .github/workflows/        # CI/CD pipelines
│   ├── test.yml
│   ├── build.yml
│   └── deploy.yml
│
├── package.json
├── tsconfig.json
├── next.config.js
├── jest.config.js
└── README.md

# Separate resources repo (for template assets)
templatehub-resources/
├── templates/                # 267+ template component files
│   ├── cv/
│   │   ├── apex.tsx
│   │   ├── nakuru.tsx
│   │   └── ... (260+ more)
│   ├── cover-letters/
│   └── reference-sheets/
│
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── previews/             # Template preview images
│
└── README.md
```

### 1.2 Tech Stack

**API:**
- Framework: Next.js 15 (App Router)
- Runtime: Node.js 22+
- Database: PostgreSQL (or Supabase)
- Cache: Redis (optional, for performance)

**Rendering:**
- React: 19.2.3 (for component rendering)
- Puppeteer: PDF generation
- Sharp: Image optimization
- Noto fonts: Multi-language support

**DevOps:**
- Docker: Containerization
- GitHub Actions: CI/CD
- Vercel: Deployment (or self-hosted)

### 1.3 Create Repository

```bash
# Create new repo
git init templatehub
cd templatehub

# Initialize Next.js
npx create-next-app@latest . --typescript --tailwind

# Add dependencies
npm install puppeteer sharp redis axios
npm install -D jest @testing-library/react

# Create directory structure
mkdir -p src/api src/lib src/types tests/{unit,integration} docs docker
```

### 1.4 Environment Setup

**.env.example:**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/templatehub
REDIS_URL=redis://localhost:6379

# API
API_PORT=3001
API_BASE_URL=https://templatehub.sumaiya.co
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
SUMAIYA_API_KEY=sumaiya-key-from-supabase

# Rendering
PUPPETEER_HEADLESS=true
FONT_CACHE_DIR=/tmp/fonts

# Storage (S3 or similar)
STORAGE_BUCKET=templatehub-exports
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
```

---

## 📡 Phase 2: API Implementation

### 2.1 Core Endpoints

**GET /templates**
```typescript
// Query parameters
?category=cv&family=ats-optimized&tier=core&limit=50&offset=0

// Response
{
  "data": [
    {
      "id": "apex-ats",
      "name": "Apex ATS",
      "version": "1.0.0",
      "source": "templatehub",
      "category": "cv",
      "family": "ats-optimized",
      "tier": "core",
      "description": "...",
      "preview_url": "https://...",
      "editable_fields": [...],
      "created_at": "2026-09-15T...",
      "updated_at": "2026-09-15T..."
    }
  ],
  "total": 267,
  "limit": 50,
  "offset": 0
}
```

**GET /templates/{id}**
```typescript
// Returns single template with full metadata
{
  "id": "apex-ats",
  "name": "Apex ATS",
  // ... full template object
}
```

**GET /families**
```typescript
// Query parameters
?product=sumaiya&category=cv&tier=core

// Response
{
  "data": [
    {
      "id": "core-simple",
      "name": "Core Simple",
      "tier": "core",
      "templates": [
        {
          "templateId": "apex-ats",
          "category": "cv",
          "role": "primary"
        }
      ]
    }
  ]
}
```

**POST /documents/render**
```typescript
// Request
{
  "templateId": "apex-ats",
  "userData": {
    "personalInfo": { /* ... */ },
    "experience": [ /* ... */ ]
  },
  "options": {
    "lang": "en",
    "format": "html"  // or "pdf"
  }
}

// Response
{
  "documentId": "doc-uuid",
  "content": "<html>...</html>",  // or PDF buffer
  "format": "html",
  "previewUrl": "https://...",
  "renderTime": "234ms"
}
```

**POST /exports/pdf**
```typescript
// Request
{
  "templateId": "apex-ats",
  "html": "<html>...</html>",
  "options": {
    "format": "A4",
    "margin": { "top": "20mm", ... }
  }
}

// Response
{
  "buffer": Buffer,  // PDF bytes
  "contentType": "application/pdf",
  "size": "245KB",
  "downloadUrl": "https://storage.../file.pdf"
}
```

### 2.2 Implementation Pattern

**Template Store (database access):**
```typescript
// src/lib/templates/store.ts
export class TemplateStore {
  async getTemplate(id: string): Promise<TemplateMetadata> {
    const row = await db.query(
      'SELECT * FROM templates WHERE id = $1',
      [id]
    );
    return row.rows[0];
  }

  async getByCategory(
    category: string,
    filters?: QueryFilters
  ): Promise<TemplateMetadata[]> {
    const query = `
      SELECT * FROM templates
      WHERE category = $1
      ${filters?.family ? 'AND family = $2' : ''}
      ${filters?.tier ? `AND tier = ${filters.tier === 'core' ? '$3' : '$4'}` : ''}
    `;
    const result = await db.query(query, [category, ...Object.values(filters || {})]);
    return result.rows;
  }
}
```

**Renderer Service:**
```typescript
// src/lib/rendering/html-render.ts
export class HTMLRenderer {
  async render(
    templateId: string,
    userData: DocumentContent
  ): Promise<string> {
    // Load template component
    const Component = await loadTemplateComponent(templateId);
    
    // Render to HTML string
    const html = renderToString(
      <Component data={userData} />
    );
    
    return html;
  }
}
```

**PDF Service:**
```typescript
// src/lib/rendering/pdf-convert.ts
export class PDFRenderer {
  async render(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setContent(html);
    const pdf = await page.pdf({ format: 'A4' });
    
    await browser.close();
    return pdf;
  }
}
```

### 2.3 API Routes

**src/api/templates/route.ts:**
```typescript
import { TemplateStore } from '@/lib/templates/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  const store = new TemplateStore();
  const templates = await store.getByCategory(category);
  
  return Response.json({ data: templates });
}
```

---

## 🔐 Phase 3: Authentication & Security

### 3.1 API Key Authentication

**Request Header:**
```
Authorization: Bearer YOUR_API_KEY
```

**Key Generation:**
```sql
INSERT INTO api_keys (product_id, key_hash, name, created_at)
VALUES ('sumaiya', hash('key-uuid'), 'Sumaiya Web', NOW());
```

### 3.2 Rate Limiting

```typescript
// Middleware
export async function rateLimitMiddleware(request: Request) {
  const key = request.headers.get('Authorization');
  const limit = await redis.incr(`rate:${key}`);
  
  if (limit > 100) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  await redis.expire(`rate:${key}`, 3600);
}
```

### 3.3 CORS Setup

```typescript
// Allow Sumaiya origin
const ALLOWED_ORIGINS = [
  'https://sumaiya.app',
  'https://staging.sumaiya.app',
  'http://localhost:3000', // dev
];

export function corsHeaders(origin: string) {
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
}
```

---

## 🧪 Phase 4: Testing & Documentation

### 4.1 Integration Tests

```typescript
// tests/integration/templates.test.ts
describe('Templates API', () => {
  it('GET /templates returns all templates', async () => {
    const res = await fetch(`${API_URL}/templates`);
    const data = await res.json();
    
    expect(data.data.length).toBe(267);
    expect(data.data[0]).toHaveProperty('id');
  });

  it('POST /documents/render creates valid HTML', async () => {
    const res = await fetch(`${API_URL}/documents/render`, {
      method: 'POST',
      body: JSON.stringify({
        templateId: 'apex-ats',
        userData: sampleCV,
      }),
    });
    
    const { content } = await res.json();
    expect(content).toContain('<html>');
  });
});
```

### 4.2 API Documentation

**docs/API.md:**
```markdown
# TemplateHub API Documentation

## Base URL
https://templatehub.sumaiya.co

## Authentication
All requests require `Authorization: Bearer API_KEY` header

## Endpoints

### GET /templates
Lists all available templates

**Query Parameters:**
- category: 'cv' | 'cover-letter' | 'reference-sheet'
- family: string (e.g., 'ats-optimized')
- tier: 'core' | 'premium'
- limit: number (default 50)
- offset: number (default 0)

**Response:** 200 OK
{ "data": [...], "total": 267, ... }

### POST /documents/render
Renders a document to HTML

**Request:**
{
  "templateId": "string",
  "userData": { /* CVData */ },
  "options": { "lang": "en" }
}

**Response:** 200 OK
{
  "documentId": "uuid",
  "content": "<html>...</html>",
  "format": "html"
}

[... more endpoints ...]
```

---

## 🔗 Phase 5: Sumaiya Integration

### 5.1 Provider Implementation

**Update Sumaiya's lib/templates/templatehub-provider.ts:**

```typescript
export class TemplateHubProvider implements TemplateProvider {
  constructor(
    private baseUrl: string = 'https://templatehub.sumaiya.co',
    private apiKey: string,
  ) {}

  async getTemplate(id: string): Promise<TemplateMetadata | null> {
    const res = await fetch(`${this.baseUrl}/templates/${id}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    
    if (!res.ok) return null;
    return res.json();
  }

  async renderDocument(
    templateId: string,
    userData: DocumentContent,
    options?: { lang?: 'en' | 'sw' }
  ): Promise<RenderedDocument> {
    const res = await fetch(`${this.baseUrl}/documents/render`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        userData,
        options,
      }),
    });

    const data = await res.json();
    return {
      templateId,
      templateVersion: '1.0.0',
      content: data.content,
      metadata: {
        createdAt: new Date().toISOString(),
        exportFormat: 'html',
        documentType: 'cv',
      },
    };
  }
}
```

### 5.2 One-Line Provider Swap

**In Sumaiya's lib/templates/index.ts:**

```typescript
// Switch from local to remote
export const templateProvider: TemplateProvider = 
  new TemplateHubProvider(
    process.env.NEXT_PUBLIC_TEMPLATEHUB_URL,
    process.env.TEMPLATEHUB_API_KEY
  );
```

**Environment variables (.env.local in Sumaiya):**
```env
NEXT_PUBLIC_TEMPLATEHUB_URL=https://templatehub.sumaiya.co
TEMPLATEHUB_API_KEY=your-api-key-here
```

### 5.3 Two-Repo Architecture

```
User Browser
     ↓
Sumaiya Web (sumaiya.app)
     ↓
TemplateProvider Interface
     ↓
NativeTemplateProvider (fallback, local)
     ↓
TemplateHubProvider (production)
     ↓
TemplateHub API (templatehub.sumaiya.co)
     ↓
PostgreSQL + S3 Storage
```

---

## 🚀 Deployment Strategy

### 6.1 Docker Setup

**docker/Dockerfile:**
```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY public ./public

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "-r", "tsx", "src/server.ts"]
```

**docker/docker-compose.yml:**
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/templatehub
      REDIS_URL: redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: templatehub
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

### 6.2 CI/CD Pipeline

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        run: npm run test
      
      - name: Build Docker image
        run: docker build -t templatehub:latest .
      
      - name: Push to registry
        run: docker push registry.example.com/templatehub:latest
      
      - name: Deploy to production
        run: |
          kubectl set image deployment/templatehub \
            templatehub=registry.example.com/templatehub:latest
```

---

## 📋 Implementation Checklist

### Phase 1: Setup (Day 1)
- [ ] Create GitHub repo
- [ ] Initialize Next.js project
- [ ] Set up TypeScript + testing
- [ ] Create directory structure
- [ ] Set up environment variables

### Phase 2: API (Days 2-3)
- [ ] Implement GET /templates
- [ ] Implement GET /templates/{id}
- [ ] Implement GET /families
- [ ] Implement POST /documents/render
- [ ] Implement POST /exports/pdf
- [ ] Add request/response types
- [ ] Add error handling

### Phase 3: Database (Day 3)
- [ ] Create schema migrations
- [ ] Set up PostgreSQL
- [ ] Seed 267 templates
- [ ] Add indexing for performance

### Phase 4: Auth & Security (Day 4)
- [ ] Implement API key auth
- [ ] Add rate limiting
- [ ] Add CORS headers
- [ ] Add request validation
- [ ] Add logging/monitoring

### Phase 5: Testing (Day 4)
- [ ] Write integration tests
- [ ] Test all endpoints
- [ ] Load testing (100+ req/s)
- [ ] Security testing (OWASP)

### Phase 6: Documentation (Day 5)
- [ ] Write API docs
- [ ] Write architecture docs
- [ ] Write deployment guide
- [ ] Create postman collection

### Phase 7: Deployment (Day 5)
- [ ] Set up Docker
- [ ] Configure CI/CD
- [ ] Deploy to staging
- [ ] Deploy to production
- [ ] Monitor and verify

### Phase 8: Integration (Day 6)
- [ ] Update Sumaiya provider
- [ ] One-line provider swap
- [ ] Test full E2E
- [ ] Update documentation

---

## 🎯 Success Criteria

✅ **All endpoints working**
- GET /templates returns 267 templates
- All CRUD operations work
- Rendering produces valid HTML/PDF

✅ **Performance**
- Template list: < 200ms
- Document render: < 2s
- PDF export: < 3s
- 99.9% uptime

✅ **Security**
- API key authentication working
- Rate limiting enforced
- CORS properly configured
- Input validation strict
- No SQL injection vulnerabilities

✅ **Integration with Sumaiya**
- One-line provider swap works
- No UI changes needed
- Fallback to NativeProvider works
- Full E2E test passes

✅ **Documentation**
- Complete API docs
- Deployment runbook
- Architecture diagrams
- Code examples

---

## 🔄 Fallback Strategy

If TemplateHub API fails:
1. Sumaiya automatically falls back to NativeTemplateProvider
2. User continues with local templates
3. No service disruption
4. TemplateHub can be debugged without affecting users

---

## 📞 Next Steps

1. **Review this plan** with team
2. **Create TemplateHub repo** on GitHub
3. **Start Session 1** with Phase 1 & 2
4. **Complete by** end of week
5. **Deploy to staging** for testing
6. **Production rollout** when ready

---

**Ready for detailed implementation?** Start with Phase 1 in next session.
