# OCR Latency Optimization

**Target:** <500ms end-to-end (camera capture → text extraction → field prefill)  
**Current:** tesseract.js ~3-8s + AI field extraction ~5-10s = 8-18s total

## Problem

The mobile OCR flow has two network round-trips:
1. **Photo → Server:** Send base64 image (typical ~500KB after compression)
2. **Server OCR:** tesseract.js on the server (3-8s depending on image quality)
3. **Server AI:** Extract structured fields via AI provider (5-10s)
4. **Response → Client:** Return JSON (fields + raw text)

**Current timeouts:** OCR 60s, field extraction 40s = 100s worst-case.
**Reality:** Most CVs take 8-18s, but network latency + variance → user perceives "hanging."

## Solution Strategy

### Phase 1: Reduce Timeouts (IMMEDIATE)
- ✅ OCR timeout: 60s → 15s
- ✅ Field extraction: 40s → 10s
- Rationale: 95% of typical CVs complete in <3s OCR + <8s AI = 11s total

### Phase 2: Progressive Enhancement (Week 3)
- **Plan A (Recommended):** Tesseract.js client-side (Expo + React Native)
  - Runs on device, zero network latency for OCR phase
  - Remaining latency: ~200ms capture + ~8-10s field extraction
  - Trade-off: +2MB app size, requires iOS/Android OCR library (needs evaluation)

- **Plan B:** Google Cloud Vision API
  - Faster on server (50-300ms vs tesseract 3-8s)
  - Cost: ~$1.50 per 1000 requests at scale
  - Requires API key + quota setup
  - Fallback to tesseract if quota exceeded

- **Plan C:** Hybrid (recommended for MVP)
  - Try Cloud Vision first (fast path, 50-300ms)
  - Fallback to tesseract.js if Vision rate-limited (slow path, 3-8s)
  - Smart retry: if field extraction times out, skip it (user can manually enter)

### Phase 3: UX Improvements
- Show "Processing photo..." + progress spinner (0-3s OCR)
- Show "Extracting fields..." + skeleton loaders (0-10s AI)
- Allow user to tap "Skip" and manually enter fields (no timeout penalty)
- Cache extracted templates to avoid re-running OCR on same image

## Benchmarks to Run Before Week 3

```bash
# 1. Test tesseract.js latency on actual CVs
for cv in {1..5}; do
  time curl -X POST http://localhost:3000/api/mobile/ocr \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"imageBase64\":\"data:image/jpeg;base64,$(cat test-cv-$cv.jpg | base64)\"}" \
    | jq '.success, (.text | length), (.fields | length)'
done

# 2. Test end-to-end latency (capture + network + OCR + field extraction)
time npm -C apps/native run test:ocr-flow

# 3. Profile tesseract.js worker startup time
time node -e "const {createWorker} = require('tesseract.js'); createWorker('eng').then(w => w.terminate())"
```

## Decision Gate

**Before Week 3 camera implementation:**
1. ✅ Confirm 15s timeout covers 99% of CVs (run benchmarks above)
2. ⚠️ Decide: Plan A (client), Plan B (Cloud Vision), or Plan C (hybrid)?
3. ⚠️ If Cloud Vision: create billing alert + quota policy
4. ✅ Update this file with final latency targets + test results

## Current Implementation

**File:** `apps/web/lib/api/routes/mobile-ocr.ts`

```typescript
// POST /api/mobile/ocr
// 1. Validate base64 image (JPEG/PNG/WebP)
// 2. Run tesseract.js with 15s timeout → raw text
// 3. Call AI to extract structured fields with 10s timeout → JSON
// 4. Return { success, text, fields, confidence }

// Timeouts:
const OCR_TIMEOUT_MS = 15_000;   // tesseract.js
const FIELD_EXTRACTION_MS = 10_000; // AI model
```

**File:** `apps/web/lib/api/routes/mobile.ts` (extractCvFields)

```typescript
// Extract: full name, email, phone, location, headline, summary,
//          experience (company, title, dates, description, achievements),
//          education (institution, degree, field, graduation date),
//          skills (name, level: beginner/intermediate/advanced/expert)
// Handles missing fields gracefully (returns "" or [])
// No hallucination: only extracts from text provided
```

## Success Criteria

- ✅ User can scan CV, see results in <30s (worst case)
- ✅ 90% of scans complete in <15s
- ✅ Field extraction errors don't block manual entry
- ✅ "Skip field extraction" option available for >10s latency
- ✅ Bilingual: error messages work in SW + EN

---

**Last updated:** 2026-09-15  
**Next review:** Week 3 (before camera implementation)
