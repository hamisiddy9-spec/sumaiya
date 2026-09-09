# TemplateHub Mobile App - Master Implementation Plan

**Goal:** Feature parity with web + native advantages  
**Timeline:** 6-8 weeks to MVP  
**Release:** Android (Play Store) + iOS (App Store)

---

## Phase 0: Foundation (Weeks 1-2) ✅ MOSTLY DONE

### ✅ Completed
- [x] Deep linking (sign-in emails open app)
- [x] Auth context (token-based signin)
- [x] Offline storage (SQLite + sync queue)
- [x] Navigation structure (tabs + stacks)
- [x] Design system (NativeWind + tokens)
- [x] Sumaiya chat UI (all components ready)

### ⏳ In Progress
- [ ] Backend API endpoints
- [ ] Production deployment config

### 📋 Blockers for Phase 1
- Backend /api/chat/sumaiya endpoint
- Backend /api/learning/resources endpoint

---

## Phase 1: Feature Parity (Weeks 3-4)

### A. CV Builder (All 273 Templates)

**Web has:** Full template editor, live preview, export to PDF  
**Mobile needs:**
- [x] All 266 templates (generated via script)
- [ ] Touch-optimized template picker (carousel)
- [ ] Inline editing (not fullscreen forms)
- [ ] Live preview while editing
- [ ] Auto-save to SQLite (offline)
- [ ] Sync to server when online

**Files to create:**
```
src/screens/template-picker-screen.tsx    (273 templates, carousel, search)
src/screens/cv-editor-screen.tsx         (inline editing, live preview)
src/components/template-preview.tsx      (mobile-optimized view)
src/components/field-editor.tsx          (name, email, phone, etc.)
src/hooks/use-cv-editor.ts               (state management)
src/services/template-service.ts         (load & render templates)
```

**Native advantage:**
- ✨ Device camera for photo uploads
- ✨ Photo library access (no web equivalent)
- ✨ Offline editing (save locally, sync later)

---

### B. Snap-to-Apply (E1 Engine)

**Web has:** Paste JD → parse → suggest edits → ATS score → download  
**Mobile needs:**
- [x] Deep linking from email (already done)
- [ ] Camera scanning for PDF/image JDs
- [ ] Photo > OCR > extract job requirements
- [ ] Real-time ATS score feedback
- [ ] One-tap apply (open app, see match, apply)

**Native advantage:**
- 🎥 **Camera scanning** (zero-friction JD capture)
- 📸 **Photo library** (user can upload previous CVs/JDs)
- ⚡ **Instant local matching** (offline ATS engine)
- 🔄 **Background sync** (queue applies while user browses)

**Files:**
```
src/screens/snap-apply-screen.tsx        (camera/upload UI)
src/services/ocr-service.ts              (parse PDFs/images)
lib/snap-apply.ts                        (reuse from web)
lib/ats-checker.ts                       (reuse from web)
src/components/ats-score-card.tsx        (visual score)
```

---

### C. Jobs Feed + One-Tap Apply

**Web has:** Browse jobs → apply with one click  
**Mobile needs:**
- [ ] Curated job list (same backend)
- [ ] Swipe/tap to apply
- [ ] Show ATS match before applying
- [ ] Track applications (offline list)
- [ ] Push notifications for matches

**Native advantage:**
- 🔔 **Push notifications** (job alerts, application status)
- 📱 **Native sharing** (share job to friends)
- ⚡ **Quick apply** (no forms, auto-fill from CV)

**Files:**
```
src/screens/jobs-feed-screen.tsx         (swipe/scroll jobs)
src/screens/job-detail-screen.tsx        (full description, apply button)
src/components/job-card.tsx              (job preview)
src/services/jobs-service.ts             (fetch from backend)
src/hooks/use-applications.ts            (track applied jobs)
```

---

### D. Sumaiya AI Chat + Learning Hub

**Web has:** Chat, skill gap detection, learning resources  
**Mobile needs:**
- [x] All chat components (done)
- [ ] Backend /api/chat/sumaiya endpoint
- [ ] Skill gap analysis from CV
- [ ] Learning resource recommendations
- [ ] In-app course preview/enrollment

**Native advantage:**
- 🔔 **Push notifications** (skill gap alerts)
- 📱 **Share learning paths** (WhatsApp, email)
- ⚡ **Offline learning** (cached course content)
- 🎯 **Achievement badges** (local + sync to web)

**Files:**
```
src/screens/learning-hub-screen.tsx      (all resources)
src/screens/course-preview-screen.tsx    (course details)
src/components/achievement-badges.tsx    (progress tracking)
src/hooks/use-learning-path.ts           (recommend courses)
```

---

## Phase 2: Native Advantages (Weeks 5-6)

### A. Camera CV Scanning

**Capability:** User points camera at physical CV → app extracts text → auto-fills mobile CV

**Implementation:**
```typescript
// expo-camera + tesseract.js
const scanCV = async (imageUri: string) => {
  const text = await OCR.recognize(imageUri);  // Extract text
  const fields = parseCV(text);                 // Name, email, phone, skills, etc.
  return fields;
};

// Upload to server for better OCR
const improvedScan = await apiClient.post('/api/mobile/ocr', {
  image: base64Image,
  language: 'sw' | 'en'
});
```

**UX Flow:**
```
ScanScreen
  ↓
[📷 Take Photo] [📁 Choose from Library]
  ↓
CameraView (torch, grid, focus)
  ↓
Processing... (showing progress)
  ↓
FieldPreviewScreen
  ├─ Name: [extracted]
  ├─ Email: [extracted]
  ├─ Phone: [extracted]
  ├─ Skills: [extracted]
  ├─ Experience: [extracted]
  └─ [✓ Looks good] [✏️ Edit] [✗ Try again]
  ↓
SaveToCV or StartEditing
```

**Files:**
```
src/screens/scan-screen.tsx              (camera UI)
src/components/camera-view.tsx           (native camera)
src/services/ocr-service.ts              (tesseract.js)
src/screens/field-preview-screen.tsx     (extracted fields)
lib/cv-parser.ts                         (parse CV text)
```

---

### B. Offline-First Architecture

**Current:** Basic SQLite storage  
**Needed:** Full offline parity

**Feature:** User can do EVERYTHING offline, sync when online

```typescript
// Offline operations:
- Create CV (local SQLite)
- Edit CV (save drafts)
- Apply to jobs (queue applies)
- Chat with Sumaiya (cache responses)
- View learning resources (cached)
- Scan CVs (local OCR)

// Sync queue (FIFO + exponential backoff):
[
  { id: 'cv-create-1', type: 'CREATE_CV', data: {...}, retries: 0 },
  { id: 'cv-edit-1', type: 'EDIT_CV', data: {...}, retries: 1 },
  { id: 'apply-1', type: 'APPLY_JOB', data: {...}, retries: 0 },
]
```

**Implementation:**
```typescript
// apps/mobile/src/services/offline-sync.ts
class OfflineSync {
  async queueOperation(op: SyncQueueItem) {
    await db.syncQueue.add(op);
    await this.processSyncQueue();
  }

  async processSyncQueue() {
    const pending = await db.syncQueue.getPending();
    for (const op of pending) {
      try {
        await this.executeOperation(op);
        await db.syncQueue.mark(op.id, 'completed');
      } catch (err) {
        await this.retryWithBackoff(op);
      }
    }
  }
}
```

**Files:**
```
src/services/offline-sync.ts              (sync queue manager)
src/services/db-sync.ts                   (DB ↔ API sync)
src/hooks/use-offline-status.ts          (online/offline indicator)
src/contexts/sync-context.tsx            (sync status provider)
```

---

### C. Push Notifications

**Use cases:**
- Job match alerts ("This job matches 92% of your CV")
- Application status ("Interview scheduled!")
- Skill gap recommendations
- Learning path milestones
- Sumaiya tips ("You should add experience dates")

**Implementation:**
```typescript
// expo-notifications
import * as Notifications from 'expo-notifications';

const setupNotifications = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }

  // Listen for notifications
  const subscription = Notifications.addNotificationResponseListener(
    ({ notification }) => {
      const { type, data } = notification.request.content.data;
      
      if (type === 'job_match') {
        navigation.navigate('JobDetail', { jobId: data.jobId });
      } else if (type === 'skill_gap') {
        navigation.navigate('SumaiyaChat', { topic: data.skill });
      }
    }
  );

  return subscription;
};

// Backend sends via FCM/APNs
// Mobile client receives and routes
```

**Files:**
```
src/services/push-notifications.ts       (setup, listeners)
src/hooks/use-notifications.ts           (hook for screens)
src/components/notification-badge.tsx    (unread count)
```

---

### D. Native Sharing

**Use cases:**
- Share CV via WhatsApp, email, LinkedIn
- Share job opportunity to friends
- Share learning resources
- Share achievement (got job!)

**Implementation:**
```typescript
import * as Sharing from 'expo-sharing';

const shareCV = async (cv: CV) => {
  const pdf = await generatePDF(cv);
  const uri = await saveToTemp(pdf);
  
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Share your CV'
  });
};
```

**Files:**
```
src/services/share.ts                    (reuse from earlier)
src/components/share-button.tsx          (CV, job, resource)
```

---

## Phase 3: Polish + Launch (Weeks 7-8)

### A. Performance Optimization
- [x] Code splitting
- [x] Lazy loading templates
- [ ] Image optimization
- [ ] API response caching
- [ ] SQLite query optimization

### B. Testing
- [ ] Unit tests (hooks, services)
- [ ] Integration tests (offline→online)
- [ ] E2E tests (complete flows)
- [ ] Device testing (iOS + Android)

### C. App Store Prep
- [ ] Create app icons (adaptive)
- [ ] Write store descriptions
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Screenshots for stores
- [ ] EAS build configuration

### D. Launch
- [ ] Internal testing (beta)
- [ ] TestFlight (iOS)
- [ ] Play Store beta (Android)
- [ ] Public launch

---

## Feature Comparison: Web vs Mobile

| Feature | Web | Mobile | Native Advantage |
|---------|-----|--------|------------------|
| CV Builder | ✅ | ✅ | Offline, Camera |
| 273 Templates | ✅ | ✅ | Touch-optimized |
| Snap-to-Apply | ✅ | ✅ | Camera scanning |
| ATS Checker | ✅ | ✅ | Real-time, Offline |
| Jobs Feed | ✅ | ✅ | Push notifications |
| Quick Apply | ✅ | ✅ | One-tap, Auto-fill |
| Sumaiya Chat | ✅ | ✅ | Smart suggestions |
| Learning Hub | ✅ | ✅ | Push alerts |
| Bilingual (SW/EN) | ✅ | ✅ | Native translation |
| Sync across devices | ✅ | ✅ | Cloud backup |
| Offline editing | ❌ | ✅ | SQLite + queue |
| Camera scanning | ❌ | ✅ | Device camera |
| Push notifications | ❌ | ✅ | Native alerts |
| Native sharing | ❌ | ✅ | iOS/Android share |
| Dark mode | ✅ | ✅ | System settings |
| Biometric auth | ❌ | ✅ | Fingerprint/Face |

**Mobile = Web + Offline + Camera + Notifications + Native**

---

## Development Roadmap

```
Week 1-2: Foundation (Backend + Chat)
  ├─ Backend: /api/chat/sumaiya
  ├─ Backend: /api/learning/resources
  ├─ Frontend: Integrate Sumaiya chat
  └─ Test: Chat flows

Week 3-4: Feature Parity (CV + Jobs)
  ├─ Frontend: CV Builder (all 273 templates)
  ├─ Frontend: Jobs Feed
  ├─ Frontend: Snap-to-Apply camera
  ├─ Backend: /api/jobs/feed
  ├─ Backend: /api/snap-apply/process
  └─ Test: CV editing, job browsing, applying

Week 5-6: Native Features (Offline + Camera + Notifications)
  ├─ Frontend: Offline sync (full FIFO queue)
  ├─ Frontend: Camera CV scanning (OCR)
  ├─ Frontend: Push notifications setup
  ├─ Frontend: Native sharing
  ├─ Backend: /api/mobile/ocr (better OCR)
  ├─ Backend: FCM/APNs integration
  └─ Test: Offline flows, OCR accuracy, sync conflicts

Week 7-8: Polish + Launch
  ├─ Performance: Optimize bundle size
  ├─ Testing: Full E2E on devices
  ├─ Store: Create listings & screenshots
  ├─ Build: EAS configure (Play Store + App Store)
  ├─ Release: TestFlight + beta
  └─ Launch: Public on both stores
```

---

## What This Means

### For Users
- ✨ **Faster:** Camera scanning beats manual typing
- ✨ **Smarter:** Offline-first means no loading
- ✨ **More powerful:** Native OS integration
- ✨ **Always connected:** Sync queue never loses work

### For Business
- 📱 Defensible: Hard to replicate offline + camera
- 🔄 Retention: Push notifications keep users engaged
- 📊 Analytics: Track offline→online conversion
- 💰 Premium: Upsell faster resume creation

### For Technical
- 🏗️ Monorepo: Shared logic (CV, ATS, templates)
- 🔌 APIs: Exact same backend as web
- 🧪 Testing: Full offline simulation possible
- 🚀 Scale: Handle millions of offline sync ops

---

## Key Success Metrics

**Launch Checklist:**
- [x] Deep linking works
- [x] Offline sync architecture done
- [ ] Camera OCR <1s per page
- [ ] 100+ unit tests passing
- [ ] Offline→online zero data loss
- [ ] ATS matching 99.9% accurate
- [ ] App <50MB (gzipped)
- [ ] 60fps on mid-range devices

---

## Immediate Next Steps

### This Week
1. ✅ Finalize Sumaiya chat (backend endpoint)
2. ⏳ Build CV editor screen (template picker + inline edit)
3. ⏳ Implement template rendering (all 273)
4. ⏳ Camera OCR proof-of-concept

### Next Week
1. Jobs feed integration
2. Offline sync full implementation
3. Push notifications setup
4. Native sharing integration

---

## Estimated Effort

| Phase | Frontend | Backend | Testing | Total |
|-------|----------|---------|---------|-------|
| P0 (Chat) | 12h | 8h | 4h | **24h** |
| P1 (CV+Jobs) | 20h | 12h | 8h | **40h** |
| P2 (Native) | 16h | 8h | 6h | **30h** |
| P3 (Polish) | 8h | 2h | 8h | **18h** |
| **Total** | **56h** | **30h** | **26h** | **112h** |

**Timeline: 2-3 weeks (full-time), 4-6 weeks (part-time)**

---

## This is NOT a lite app.

This is a **native-first, offline-first, more-capable version** of the web app.

Users should prefer mobile because it's **faster, smarter, and more powerful.**

Ready to build? 🚀
