<!-- PRODUCED BY: nvidia/nemotron-3-ultra-550b-a55b:free (OpenRouter free tier) -->
<!-- Claude CLI was session-limited at 01:40 EAT; this pass ran on OpenRouter. -->

# Sumaiya Rebrand: Operator Analysis

---

## 1. The One Job-to-Be-Done

**JUDGEMENT:** On a TZS 250k phone with a 500MB daily bundle, the user returns for **one thing only: "Send a proper application for the specific vacancy I have right now."**

"CV" is **not** the job-to-be-done. The CV is the artifact. The job is the *application event*—triggered when a vacancy appears in a WhatsApp group, on a friend's status, or a physical notice board. The user opens Sumaiya because the deadline is tomorrow and they need a PDF that looks serious *today*. They do not open it to "build a profile" or "upskill." They open it to close a loop.

**Evidence from your own live QA:** The jobs feed is empty. If "browse jobs" were the JTBD, retention would be zero. But users *do* return—because they have a vacancy in hand and need the document.

---

## 2. Wider Capability Set: Acquisition vs. Retention

**JUDGEMENT:** The wider set **hurts acquisition** and **helps retention only if discovered after first success.**

### First Screen (Home) — ONLY this:
- **Input box:** "Paste job advert / Chapa tangazo la kazi hapa" (text, photo, or link)
- **Primary CTA:** "Tengeneza Maombi" / "Make Application"
- **Secondary (ghost):** "Nina CV tayari — nitakayochagua" / "I have a CV — let me choose template"

Everything else is noise at acquisition. "47 templates" is a liability—choice paralysis on a 5-inch screen.

### Three Taps Deep (After 1+ successful export):
| Capability | Placement | Trigger |
|------------|-----------|---------|
| Application Tracking (My Applications) | Tab 2 / Bottom nav | After 2nd export |
| Interview Prep | Inside "My Applications" → specific app → "Jipange Usaili" | When status = "Shortlisted" |
| CV Check (On-device) | Inside editor → "Angalia CV" | Before export |
| PDF Tools (Merge/Compress) | Separate "Zana" tab | When user has multiple PDFs to submit |
| Business Cards / Formal Letters | "Zana" tab → "Vyeti vingine" | Never on home |
| Learning Lessons | "Zana" tab → "Jifunze" | Dead time (waiting for bundle renewal) |
| Chat Assistant | Floating icon in editor only | Stuck on a field |

**Kill the "Ajira" nav item today.** It is a trust leak. Replace with **"Maombi Yangu" (My Applications)** — empty state says "Huna maombi bado. Chapa tangazo hapa kuanza."

---

## 3. WhatsApp-First / Mobile-Money Mechanics

### Mechanics that APPLY to Sumaiya:
| Mechanic | Status | Notes |
|----------|--------|-------|
| **No download (web-first)** | ✅ Web app exists | But APK is "real product"—web must be *equal* for acquisition |
| **No account** | ✅ "Bila akaunti" in subhead | Keep. Never add login. |
| **Shareable artifact** | ⚠️ Partial | PDF export exists. **Missing: One-tap "Share to WhatsApp" with pre-filled Swahili message.** |
| **Airtime / Mobile money** | ❌ Not needed | Product is free. Monetisation later = templates, not core. |
| **Social proof inside group** | ❌ Absent | Zero visibility of "others like you used this." |

### Single Most Important Mechanic NOT Used Today:
**JUDGEMENT:** **One-tap WhatsApp Share with context.**

Current flow: Build → Export PDF → Open Files → Find PDF → Share → WhatsApp → Select contact/group → Type message → Send. **6+ taps, 2 app switches, bundle burn.**

Required flow: **Export button = "Tuma kwa WhatsApp" → Opens WhatsApp with PDF attached + pre-filled message:**
> *"Shikilia CV yangu kwa ajili ya nafasi ya [Job Title] iliyotangazwa [Source]. Asante. — [Name]"*

This puts the artifact *where the hiring decision happens*: in the recruiter's WhatsApp or the group admin's chat. No other mechanic moves the needle like this.

---

## 4. The Empty Jobs Feed

**Leading with jobs is indefensible now.** An empty "Ajira" tab on a 2GB RAM phone says "this app is broken" or "this app lies." Uninstall follows.

### Honest Middle Path:
**Replace "Ajira" (Jobs) with "Tangazo Lako" (Your Vacancy).**

- **Nav label:** "Tangazo Lako" (icon: clipboard + paste)
- **Screen:** Single large text area + "Picha ya Tangazo" (camera/gallery) + "Linki ya Tangazo"
- **Microcopy:** "Nakala hapa tangazo lilionekana kwenye WhatsApp, Tovuti, au Barua pepe. Sumaiya itachanganya na CV yako."
- **Output:** Tailored CV + Cover letter for *that specific advert*.

**Why this works:**
- User *has* the vacancy (WhatsApp forward, screenshot, link). They don't need you to aggregate jobs.
- You become the **bridge** between the vacancy and the application.
- Application Tracking ("Maombi Yangu") becomes the history of *their* pasted vacancies—automatically populated, never empty.

**If you partner later** (BrighterMonday, ZoomTanzania), add a *secondary* "Tangazo za Wengine" section inside "Tangazo Lako" — labeled clearly. Never lead with it.

---

## 5. Three Candidate Positioning Directions

### Direction A: **The Application Maker** (Recommended — see §6)
| Element | Detail |
|---------|--------|
| **One-line Promise** | Turn any job advert into a ready-to-send application in 2 minutes. |
| **Headline SW** | **Andika Maombi Yako Kwa Dakika 2** |
| **Headline EN** | **Write Your Application in 2 Minutes** |
| **Leads With** | Paste job advert → Get tailored CV + Cover letter → One-tap WhatsApp send |
| **Stops Saying** | "AI CV Maker", "ATS-optimized", "47 templates", "Career interview", "Learning lessons", "PDF tools" on home |
| **Attracts** | Active applicants with a live vacancy (high intent, high bundle willingness) |
| **Loses** | Students building first CV with no target job; passive "career growth" browsers |

---

### Direction B: **Your Professional Document Kit**
| Element | Detail |
|---------|--------|
| **One-line Promise** | Every formal document you need—CV, cover letter, business card, official letter—in your language, offline, free. |
| **Headline SW** | **Vyeti Vako Vya Kitaalamu, Kwenye Simu Yako** |
| **Headline EN** | **Your Professional Documents, On Your Phone** |
| **Leads With** | Template gallery: CV / Barua ya Maombi / Kadiri ya Biashara / Barua Rasmi → Pick → Fill → PDF |
| **Stops Saying** | "AI", "Jobs", "Interview prep", "Application tracking", "ATS" on home |
| **Attracts** | Informal workers, freelancers, small traders, students needing formal letters (internship, government, landlord) |
| **Loses** | High-intent applicants who need *tailored* CV for a specific job tonight |

---

### Direction C: **The Interview Getter**
| Element | Detail |
|---------|--------|
| **One-line Promise** | The CV that gets you called for the interview. |
| **Headline SW** | **CV Inayokuletea Karibu ya Usaili** |
| **Headline EN** | **The CV That Gets You the Interview** |
| **Leads With** | "Kagua CV Yako" — Upload existing CV or build new → Get specific fixes (keywords, gaps, formatting) → Re-export |
| **Stops Saying** | "Free", "No account", "PDF tools", "Business cards", "Learning", "47 templates" on home |
| **Attracts** | Frustrated applicants who applied 10+ times, got zero callbacks, know their CV is the problem |
| **Loses** | First-time CV makers; anyone without an existing CV or