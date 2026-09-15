# End-to-End Test Plan

Complete testing checklist for web and mobile deployments.

## 🌐 WEB APP TESTING

### Pre-Test Checklist
- [ ] Vercel deployment successful
- [ ] Production URL accessible
- [ ] All environment variables loaded
- [ ] Database connection working

### Test 1: Authentication
**Steps:**
1. Open https://sumaiya.app (or your deployment URL)
2. Click "Sign In"
3. Try Google OAuth login
4. Verify dashboard loads
5. Check user profile displays correctly
6. Logout successfully

**Expected:**
- ✅ Google sign-in works
- ✅ Dashboard loads without errors
- ✅ User data displays (name, email)
- ✅ Logout redirects to home

### Test 2: Template System
**Steps:**
1. Navigate to CV Editor
2. Click "Change Template" button
3. Browse template families
4. Select different templates (core tier)
5. Verify CV renders with new template
6. Check template preview updates live

**Expected:**
- ✅ Template picker modal opens
- ✅ All 8 families display
- ✅ 267 templates load without error
- ✅ Template selection switches immediately
- ✅ No console errors

### Test 3: CV Data Entry & Editing
**Steps:**
1. In CV editor, fill in personal info:
   - Full Name: "Test User"
   - Email: "test@example.com"
   - Phone: "+255712345678"
   - Location: "Dar es Salaam"
   - Job Title: "Software Engineer"

2. Add experience entry:
   - Company: "Tech Corp"
   - Title: "Senior Developer"
   - Description: "Led development of features"

3. Add education:
   - Institution: "University"
   - Degree: "BS Computer Science"
   - Field: "CS"

4. Add 3 skills

5. Save (auto-save should trigger)

**Expected:**
- ✅ Data saves without error
- ✅ Auto-save indicator shows "Saving..."
- ✅ No data loss on page refresh
- ✅ All fields editable and persistent

### Test 4: PDF Export
**Steps:**
1. With CV data filled, click "Download PDF"
2. Wait for export overlay
3. See progress steps: Preparing → Rendering → Done
4. File downloads to default location
5. Open downloaded PDF
6. Verify all content renders correctly
7. Check formatting is clean
8. Verify no missing data

**Expected:**
- ✅ Export completes in <5 seconds
- ✅ PDF contains all CV data
- ✅ Formatting is professional
- ✅ No rendering errors
- ✅ File size ~200-500KB

### Test 5: HTML Export
**Steps:**
1. Click export menu → "Export as HTML"
2. File downloads
3. Open in browser
4. Verify all content displays

**Expected:**
- ✅ HTML exports successfully
- ✅ Opens in browser without errors
- ✅ All text readable
- ✅ Images display

### Test 6: Dynamic Rendering
**Steps:**
1. In preview pane, change template
2. Observe preview updates live (no full page reload)
3. Edit CV data (name, title, experience)
4. Preview updates in real-time
5. Try 3 different templates

**Expected:**
- ✅ Preview updates instantly
- ✅ No lag or flickering
- ✅ All templates render correctly
- ✅ Changes reflect immediately

### Test 7: Mobile Responsiveness
**Steps:**
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Test viewport: 375px (iPhone SE)
4. Test viewport: 768px (iPad)
5. Test viewport: 1024px (desktop)

**Responsive Checks:**
- [ ] Template picker works on all sizes
- [ ] Export button accessible on mobile
- [ ] CV editor panels stack correctly
- [ ] Text is readable (no overflow)
- [ ] Buttons are tap-friendly (48px+)
- [ ] Scrolling works smoothly

**Expected:**
- ✅ Mobile: 375px works perfectly
- ✅ Tablet: 768px responsive layout
- ✅ Desktop: 1024px+ full width
- ✅ No horizontal scrolling
- ✅ Touch targets 48px minimum

### Test 8: Error Handling
**Steps:**
1. Trigger network error:
   - Open DevTools → Network tab
   - Throttle to "Offline"
   - Try to save CV
   - Verify error message shows
   - Go online
   - Verify auto-retry works

2. Test invalid data:
   - Try to save with no name
   - Verify validation error

3. Test browser compatibility:
   - Chrome: ✅
   - Firefox: ✅
   - Safari: ✅

**Expected:**
- ✅ Network errors handled gracefully
- ✅ User sees clear error messages
- ✅ Auto-retry works
- ✅ No silent failures
- ✅ Works in all major browsers

### Test 9: Performance
**Steps:**
1. Open DevTools → Lighthouse
2. Run audit for Performance
3. Check:
   - First Contentful Paint (FCP) < 2s
   - Largest Contentful Paint (LCP) < 2.5s
   - Template load time < 500ms
   - PDF export < 5s

**Expected:**
- ✅ Lighthouse score > 80
- ✅ No performance warnings
- ✅ Fast page transitions

### Test 10: Security
**Steps:**
1. Open DevTools → Console
2. Check for console errors/warnings
3. Check for XSS vulnerabilities:
   - Try entering `<script>alert('xss')</script>` in name field
   - Verify it doesn't execute
4. Check HTTPS:
   - Verify green lock icon
   - Check certificate is valid
5. Check for CSP headers:
   - DevTools → Network → any request → Response Headers
   - Verify `Content-Security-Policy` header present

**Expected:**
- ✅ No console errors
- ✅ HTTPS enforced
- ✅ Valid certificate
- ✅ No XSS vulnerabilities
- ✅ CSP headers present

---

## 📱 MOBILE APP TESTING (ADB)

### Prerequisites
```bash
# Connect Android device via USB
adb devices  # Should show your device

# Install app from built APK
adb install apps/native/dist/app.apk
```

### Test 1: App Launch
**Steps:**
1. Tap Sumaiya app icon
2. Wait for splash screen
3. See onboarding carousel
4. Swipe through 3 onboarding screens
5. Tap "Get Started"

**Expected:**
- ✅ App launches without crash
- ✅ Splash screen displays 1-2 seconds
- ✅ Onboarding carousel smooth
- ✅ All text readable

### Test 2: Authentication
**Steps:**
1. See login screen
2. Tap "Continue with Google"
3. Complete Google authentication
4. Return to app
5. See home screen

**Expected:**
- ✅ Google sign-in flow works
- ✅ Returns to app after auth
- ✅ User data loaded
- ✅ No crashes

### Test 3: Camera Scan (HIGH PRIORITY)
**Steps:**
1. Tap "Scan CV" button
2. Grant camera permission
3. Point camera at printed CV
4. Hold steady for 2 seconds
5. See extraction progress
6. Review extracted data
7. Tap "Use This"

**Expected:**
- ✅ Camera opens
- ✅ Can capture image
- ✅ OCR processes (<2s)
- ✅ Data extracted to fields
- ✅ Accuracy reasonable
- ✅ Can edit extracted data

### Test 4: Template Picker (Mobile)
**Steps:**
1. Tap "Change Template"
2. See template families
3. Tap family → see templates
4. Tap template to preview
5. Tap "Select"

**Expected:**
- ✅ Modal opens full-screen
- ✅ Families scroll horizontally
- ✅ Templates show with previews
- ✅ Selection changes immediately
- ✅ No lag or stuttering

### Test 5: CV List
**Steps:**
1. See "My CVs" tab
2. View list of saved CVs
3. Tap to edit one
4. Make a change
5. Save
6. Return to list

**Expected:**
- ✅ All CVs load with thumbnails
- ✅ Can edit without crashes
- ✅ Changes persist
- ✅ List updates after save

### Test 6: PDF Export (Mobile)
**Steps:**
1. Tap "Download PDF"
2. See progress overlay
3. Wait for completion
4. Tap "Open" or "Share"
5. PDF opens in viewer
6. Swipe through pages

**Expected:**
- ✅ Export completes < 3 seconds
- ✅ PDF renders correctly
- ✅ Can open in native viewer
- ✅ Can share via native share sheet

### Test 7: Offline Mode
**Steps:**
1. Airplane mode ON
2. Create/edit CV
3. Make changes
4. Tap save
5. See offline badge
6. Airplane mode OFF
7. See sync indicator
8. Verify changes synced

**Expected:**
- ✅ Can work offline
- ✅ Sync queue persists
- ✅ Auto-syncs when online
- ✅ No data loss
- ✅ Conflict resolution works

### Test 8: Dark Mode
**Steps:**
1. Go to Settings
2. Toggle Dark Mode ON
3. Verify all screens render correctly
4. Toggle OFF
5. Verify light mode

**Expected:**
- ✅ Dark mode applies instantly
- ✅ All text readable
- ✅ Colors appropriate
- ✅ No UI glitches

### Test 9: Language Toggle
**Steps:**
1. Settings → Language
2. Change to Swahili
3. Verify all UI translates
4. Check CV data still correct
5. Change back to English

**Expected:**
- ✅ Language switches instantly
- ✅ All text in new language
- ✅ Data preserved
- ✅ No corrupted characters

### Test 10: Native Share
**Steps:**
1. Export PDF
2. Tap "Share"
3. See native share sheet
4. Options: Email, WhatsApp, Drive, etc.
5. Try sharing via email
6. Verify recipient receives PDF

**Expected:**
- ✅ Native share sheet opens
- ✅ All apps available
- ✅ PDF sends successfully
- ✅ No app crashes

### Test 11: Performance
**Steps:**
1. Monitor app performance:
   - Launch time: < 2 seconds
   - Template load: < 500ms
   - Camera capture: < 3 seconds
   - PDF export: < 2 seconds
2. Check for janky scrolling
3. Check for memory leaks (leave app open 5+ min)

**Expected:**
- ✅ Smooth 60 FPS
- ✅ No stuttering
- ✅ No memory issues
- ✅ Fast operations

### Test 12: Edge Cases
**Steps:**
1. Very long CV (20+ entries)
2. Try to export
3. Very short CV (just name)
4. Export should work
5. Special characters in name (José, Müller)
6. Verify display correctly

**Expected:**
- ✅ Handles long CVs
- ✅ Handles short CVs
- ✅ Special characters work
- ✅ No crashes on edge cases

---

## 🧪 Real User Workflow Test

**Scenario:** New user creates, edits, and exports CV

### Timeline: ~10 minutes

**Step 1: Sign Up** (2 min)
```
Sign in → Grant permissions → See dashboard
```

**Step 2: Create CV** (3 min)
```
1. New CV
2. Fill: Name, Email, Phone, Location, Title
3. Add: 1 experience, 1 education, 3 skills
4. Save
```

**Step 3: Pick Template** (2 min)
```
1. View in template picker
2. Try 3 different templates
3. Settle on one
4. See live preview update
```

**Step 4: Export** (2 min)
```
1. Click Download PDF
2. See progress
3. File downloads
4. Open and verify
```

**Step 5: Share** (1 min)
```
1. Share PDF via email
2. Or share via native share sheet (mobile)
```

**Expected:**
- ✅ Zero crashes
- ✅ All data persists
- ✅ Smooth UI
- ✅ Fast operations

---

## ✅ Sign-Off Checklist

**Web:**
- [ ] Authentication works
- [ ] Template system works (267 templates load)
- [ ] CV rendering works
- [ ] PDF export works
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance good
- [ ] Security verified

**Mobile:**
- [ ] App launches without crash
- [ ] Authentication works
- [ ] Camera scan works (extracts data)
- [ ] Template picker works
- [ ] PDF export works
- [ ] Offline mode works
- [ ] Sync works
- [ ] Native share works
- [ ] Performance acceptable

---

## 🚨 Critical Issues Found?

If ANY critical issue found:
1. Document exact steps to reproduce
2. Take screenshot/video
3. Check browser console for errors
4. Create GitHub issue with reproduction steps
5. Halt deployment until fixed

---

## 📊 Results Template

```
## Web Testing Results

Date: 2026-09-15
Tester: [Your Name]
Environment: [URL]

### Summary
- Total Tests: 10
- Passed: ✅
- Failed: 
- Blocked: 

### Issues Found
1. [Title] - [Severity: Critical/High/Medium/Low]
   - Reproduction: [Steps]
   - Expected: [What should happen]
   - Actual: [What happened]

### Sign-Off
- [ ] All critical tests pass
- [ ] Approved for production
- [ ] Approved by: [Name]
```

---

**Next Step:** Run these tests on deployed web and mobile apps.  
**Time Estimate:** 30-45 minutes for full suite.  
**Retry Failed Tests:** Once issues fixed, re-test to confirm fix.
