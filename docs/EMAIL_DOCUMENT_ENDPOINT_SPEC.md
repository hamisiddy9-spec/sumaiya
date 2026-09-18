# Email Document Endpoint Specification

**Feature:** Generate & Email Documents (CV, Cover Letter, etc.) with Pre-filled User Data

**Date:** 2026-09-18  
**Status:** Specification (Ready for Phase 4.3 Implementation)  
**Priority:** High (Direct job application, friction reduction)

---

## Overview

A new endpoint that lets users generate a complete document (CV, cover letter, etc.), auto-fill it with their data, and send it directly to a recruiter's email in one action.

**Use Case:**
```
User sees job posting → clicks "Apply" 
→ System generates CV + cover letter from their profile
→ Auto-fills user's name, contact, experience
→ Generates cover letter tailored to job description
→ Sends to recruiter email with pre-formatted attachments
→ User gets confirmation + tracking link
```

---

## Endpoints

### 1. Generate & Email Document

**Route:** `POST /api/ai/email-document`

**Purpose:** Generate one or more documents, fill with user data, email to recipient.

**Request:**
```typescript
{
  // Which documents to generate/send
  documentTypes: ("cv" | "cover-letter" | "both")[];  // e.g., ["cv", "cover-letter"]
  
  // Email recipient
  recipientEmail: string;            // e.g., "recruiter@company.com"
  recipientName?: string;            // e.g., "Jane Smith" (personalized in subject/body)
  
  // Job/context for tailoring
  jobTitle?: string;                 // e.g., "Senior Backend Engineer"
  jobDescription?: string;           // e.g., full JD text
  companyName?: string;              // e.g., "Acme Corp"
  
  // Cover letter customization (if generating cover-letter)
  coverLetterTone?: "formal" | "casual" | "enthusiastic";
  includeKeywords?: boolean;         // true = weave job keywords into letter (default: true)
  
  // Export format for attachments
  exportFormat: ("pdf" | "docx" | "both");  // default: "pdf"
  
  // Email customization
  emailSubject?: string;             // default: "Application from [Name]: [Job Title]"
  emailBody?: string;                // default: professional template
  includeTrackingPixel?: boolean;    // track if email was opened (default: false)
  
  // Backup/save options
  saveToUserProfile?: boolean;       // save generated documents to user's profile (default: true)
  createApplicationRecord?: boolean; // log as formal application (default: true)
  
  // Metadata
  sourceJobId?: string;              // link to job in database (optional)
  campaignId?: string;               // UTM/tracking ID (optional)
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    applicationId: string;           // unique tracking ID for this application
    emailSentAt: number;             // timestamp (ms since epoch)
    recipientEmail: string;
    documentsGenerated: {
      cv?: {
        id: string;
        fileName: string;            // e.g., "Jane_Doe_CV.pdf"
        format: "pdf" | "docx";
        size: number;                // bytes
        previewUrl?: string;          // temporary URL to view before sending (30 min expiry)
      };
      coverLetter?: {
        id: string;
        fileName: string;
        format: "pdf" | "docx";
        size: number;
        previewUrl?: string;
      };
    };
    emailDetails: {
      subject: string;
      bodyPreview: string;           // first 200 chars
      estimatedDelivery?: number;    // ms (if scheduled)
    };
    tracking: {
      trackingId: string;            // for email open/click tracking
      trackingUrl?: string;          // public link to view status
      openedAt?: null;               // populated later when email is opened
      clickedAt?: null;              // populated later when link clicked
    };
  };
}
```

**Errors:**
```typescript
{
  error: string;
  code: "INVALID_EMAIL" | "NO_JOB_DESCRIPTION" | "GENERATION_FAILED" | "RATE_LIMITED" | "QUOTA_EXCEEDED";
  retryAfter?: number;
  details?: string;
}
```

---

### 2. Get Pre-send Preview

**Route:** `POST /api/ai/email-document/preview`

**Purpose:** Generate documents and show preview before sending (no email sent).

**Request:**
```typescript
{
  // Same as email-document, but email fields optional
  documentTypes: ("cv" | "cover-letter")[];
  jobTitle?: string;
  jobDescription?: string;
  companyName?: string;
  coverLetterTone?: "formal" | "casual" | "enthusiastic";
  exportFormat?: "pdf" | "docx" | "both";
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    documents: {
      cv?: {
        previewHtml: string;        // HTML preview (ready to render)
        fileName: string;
        format: "pdf" | "docx";
        downloadUrl: string;        // temp URL valid for 1 hour
      };
      coverLetter?: {
        previewHtml: string;
        fileName: string;
        format: "pdf" | "docx";
        downloadUrl: string;
      };
    };
    stats: {
      cvWordCount?: number;
      cvPageCount?: number;
      coverLetterWordCount?: number;
    };
  };
}
```

---

### 3. Get Application Status & Tracking

**Route:** `GET /api/ai/email-document/:applicationId`

**Purpose:** Check if email was opened, links clicked, etc.

**Response:**
```typescript
{
  success: boolean;
  data: {
    applicationId: string;
    status: "sent" | "delivered" | "opened" | "bounced" | "failed";
    recipientEmail: string;
    documentTypes: string[];
    sentAt: number;
    openedAt?: number;
    firstClickAt?: number;
    clicks: number;
    opens: number;
    metadata: {
      jobTitle?: string;
      companyName?: string;
      sourceJobId?: string;
    };
  };
}
```

---

### 4. Resend Document

**Route:** `POST /api/ai/email-document/:applicationId/resend`

**Purpose:** Resend the same generated documents to a different email.

**Request:**
```typescript
{
  newRecipientEmail: string;
  newRecipientName?: string;
  customEmailBody?: string;  // optional override
}
```

**Response:** Same as email-document endpoint

---

## Implementation Details

### Document Generation

**CV Generation:**
```
1. Fetch user's full CV from database
2. Extract relevant sections based on job description
3. Tailor content: emphasize matching skills, keywords from JD
4. Generate PDF/DOCX with professional template
5. Embed metadata: user name, email, phone, job title target
```

**Cover Letter Generation:**
```
1. Generate from scratch using AI (lib/api/routes/ai.ts POST /cover-letter)
2. Tailor to job description + company (weave keywords naturally)
3. Personalize with recruiter name (if provided)
4. Match tone: formal/casual/enthusiastic
5. Keep to 3-4 paragraphs, concise
6. Export as PDF/DOCX with same branding as CV
```

### Email Sending

**Service:** Resend.com (or existing email provider)

**Template:**
```
Subject: Application from [FirstName] [LastName]: [JobTitle]

Dear [RecruiterName],

I am writing to express my interest in the [JobTitle] position at [CompanyName].

[Auto-generated cover letter body - 3-4 paragraphs]

I have attached my resume and cover letter for your review. I would welcome the opportunity to discuss how my background in [SkillArea] aligns with your team's needs.

Best regards,
[UserName]
[Phone]
[LinkedIn URL]

---
Attachments:
- [FirstName]_[LastName]_CV.pdf
- [FirstName]_[LastName]_CoverLetter.pdf

---
Sent via Sumaiya | sumaiya.app
Track your application: [tracking URL]
```

### Pre-filling User Data

**Automatic Fields:**
- ✅ Full name, email, phone (from profile)
- ✅ Professional summary (from CV)
- ✅ Experience entries (last 3-5, ordered by recency)
- ✅ Top skills (from CV or skill assessment)
- ✅ Education (most recent degree)
- ✅ LinkedIn URL (from profile)

**Smart Matching:**
- Filter skills to match job description (TF-IDF + keyword matching)
- Highlight achievements that align with job requirements
- Weave in job keywords naturally into cover letter
- Emphasize relevant experience, minimize unrelated items

---

## Quota & Rate Limiting

### Limits
- **Free tier:** 3 emails/day, 15/month
- **Pro tier:** 50 emails/day, unlimited/month
- **Business tier:** Unlimited

### Rate Limiting
- **Global:** 10 requests/minute per user
- **Per recipient:** Max 5 emails/month to same address (prevent spam)

### Quota Responses
```typescript
{
  error: "QUOTA_EXCEEDED",
  data: {
    used: 3,
    limit: 3,
    resetAt: 1726754400000,  // Unix timestamp
    upgradeUrl: "https://sumaiya.app/upgrade"
  }
}
```

---

## Tracking & Analytics

### Email Tracking
- **Open tracking:** Pixel in email body (1x1 transparent image)
- **Click tracking:** Rewrite links to capture clicks
- **Delivery:** Webhook from email provider
- **Bounce:** Webhook from email provider

### Database Schema
```sql
CREATE TABLE email_applications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  job_title VARCHAR(255),
  company_name VARCHAR(255),
  source_job_id VARCHAR(255),
  document_types TEXT[],  -- ["cv", "cover-letter"]
  export_format TEXT,     -- "pdf" or "docx"
  
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  first_click_at TIMESTAMP,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  
  status VARCHAR(50),     -- "sent", "delivered", "opened", "bounced"
  tracking_id VARCHAR(255) UNIQUE,
  
  documents JSONB,        -- {cv: {id, size, format}, coverLetter: {...}}
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_email_applications_user_id ON email_applications(user_id);
CREATE INDEX idx_email_applications_tracking_id ON email_applications(tracking_id);
```

---

## Security Considerations

### Email Validation
- ✅ Verify recipient email format (RFC 5322)
- ✅ Check against disposable email lists (tempmail, 10minutemail, etc.)
- ✅ Rate limit per recipient (max 5/month to same address)

### Document Security
- ✅ Temp download URLs expire after 1 hour
- ✅ PDF/DOCX files scanned for malware before sending
- ✅ No sensitive data in email subject line
- ✅ Cover letter doesn't include phone/personal contact in body (only in footer)

### Abuse Prevention
- ✅ Per-user daily quota enforced
- ✅ Per-recipient monthly limit (prevent email bombing)
- ✅ User email must be verified before sending
- ✅ Monitor for unusual patterns (e.g., 100 emails in 1 minute)

---

## Error Handling

### Graceful Degradation
```typescript
// If cover letter generation fails, send CV only + note
if (coverLetterGeneration.failed) {
  return {
    success: true,
    warning: "Cover letter could not be generated. Sent CV only.",
    documentsGenerated: { cv: {...} },  // CV sent
  };
}

// If PDF export fails, try DOCX
if (pdfExport.failed && docxExport.succeeded) {
  return {
    success: true,
    warning: "PDF export failed. Sent DOCX instead.",
    documentsGenerated: { cv: {..., format: "docx"} },
  };
}
```

### Retry Logic
- **Transient errors (network, timeout):** Retry 3x with exponential backoff
- **Permanent errors (invalid email):** Fail immediately, return error
- **Quota exceeded:** Return error with reset time

---

## User Experience Flow

### Happy Path
```
1. User views job posting in Sumaiya
2. Clicks "Apply via Email" button
3. System shows preview of CV + generated cover letter
4. User can edit cover letter (optional)
5. User enters recruiter email or selects from contacts
6. System generates PDFs
7. System sends email
8. Confirmation: "Email sent! Track status [here]"
9. User sees tracking dashboard (opened/clicked)
```

### With Customization
```
1. User clicks "Generate & Email"
2. Preview dialog shows CV + cover letter
3. User can:
   - Edit cover letter tone (formal/casual/enthusiastic)
   - Customize email subject/body
   - Change export format (PDF/DOCX)
4. Review email before sending
5. Send with one click
```

### Tracking Dashboard
```
User dashboard shows:
- [Application #1] Sent to jane@acme.com - Opened ✓ Clicked ✓
- [Application #2] Sent to john@techco.com - Opened ✓ Clicked ✗
- [Application #3] Sent to hr@startup.io - Not opened (sent 2h ago)
```

---

## Frontend Component

### Email Document Modal

```typescript
export const EmailDocumentModal = ({
  jobTitle,
  jobDescription,
  companyName,
  onSend,
}: EmailDocumentModalProps) => {
  const [step, setStep] = useState<"preview" | "recipient" | "confirm">("preview");
  const [documentsPreview, setDocumentsPreview] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx">("pdf");
  const [tone, setTone] = useState<"formal" | "casual">("formal");

  return (
    <Dialog open>
      {step === "preview" && (
        <PreviewStep
          cv={documentsPreview?.cv}
          coverLetter={documentsPreview?.coverLetter}
          onNext={() => setStep("recipient")}
        />
      )}

      {step === "recipient" && (
        <RecipientStep
          onEmailChange={setRecipientEmail}
          onNameChange={setRecipientName}
          onNext={() => setStep("confirm")}
        />
      )}

      {step === "confirm" && (
        <ConfirmStep
          email={recipientEmail}
          onSend={() => onSend({ recipientEmail, recipientName, exportFormat, tone })}
        />
      )}
    </Dialog>
  );
};
```

---

## Success Metrics

### Key Metrics to Track
- **Conversion:** % of users who generate + send documents
- **Application completion:** % of sent emails that receive response
- **Open rate:** % of emails opened by recruiters
- **Click rate:** % of tracking links clicked
- **Time to hire:** Did email → sent → response → offer?
- **Quota upgrade:** % of free users upgrading for higher limits

### Target Metrics
- ✅ Open rate ≥ 30% (industry avg for recruiting is 20%)
- ✅ Application completion within 2 weeks
- ✅ 10% of sent applications → interviews
- ✅ 80% user satisfaction (NPS ≥ 50)

---

## Implementation Roadmap

### Phase 4.3 (Week 1-2)
- [ ] Design database schema
- [ ] Build endpoint POST /email-document
- [ ] Integrate with Resend email service
- [ ] Add pre-send preview (POST /email-document/preview)
- [ ] Basic error handling

### Phase 4.4 (Week 2-3)
- [ ] Email tracking (open, click)
- [ ] Build tracking dashboard
- [ ] GET /email-document/:applicationId endpoint
- [ ] Quota management per tier
- [ ] Security review (email validation, abuse prevention)

### Phase 4.5 (Week 3-4)
- [ ] Frontend modal + UX flow
- [ ] Contact suggestions (auto-fill recruiter emails)
- [ ] Email template customization UI
- [ ] Analytics dashboard
- [ ] A/B testing framework

### Phase 5 (Post-MVP)
- [ ] Schedule emails (send later)
- [ ] A/B test different cover letters
- [ ] Auto-follow-up emails (send after 1 week if no response)
- [ ] Integration with ATS systems (auto-apply)
- [ ] Multi-language support (EN/SW email templates)

---

## Alternatives Considered

### Alternative 1: Download Only (No Email)
- ✅ Pro: Simpler, fewer legal/privacy issues
- ❌ Con: Friction (user must attach manually), can't track opens

### Alternative 2: Email via Chat
- ✅ Pro: Keeps everything in conversation
- ❌ Con: Feels less formal, hard to separate from other messages

### Alternative 3: LinkedIn/ATS Integration
- ✅ Pro: Applies directly without email
- ❌ Con: Requires OAuth, major platform coordination, privacy concerns

**Chosen:** Email endpoint (good balance of simplicity, trackability, user control)

---

## Rollout Plan

### Alpha (Internal Testing)
- [ ] Test with 20 internal users
- [ ] Measure open/click rates
- [ ] Gather feedback on UX
- [ ] Check email deliverability

### Beta (Limited Rollout)
- [ ] 1% of free tier users
- [ ] Monitor quota, rate limits
- [ ] Collect user feedback
- [ ] Watch for abuse/spam patterns

### General Availability
- [ ] All free/pro/business users
- [ ] Marketing campaign: "Apply in one click"
- [ ] Docs + video tutorial
- [ ] Monitor analytics, iterate

---

## Success Criteria

- ✅ Endpoint live and tested
- ✅ Email deliverability ≥ 95%
- ✅ Open rate ≥ 25% (initial)
- ✅ Zero false positives in spam detection
- ✅ <100ms response time for document generation
- ✅ 99.9% uptime
- ✅ User satisfaction NPS ≥ 40

---

## Open Questions

1. **Email provider:** Resend.com vs. SendGrid vs. AWS SES?
2. **Storage:** Store generated PDFs/DOCX? For how long? (cost vs. compliance)
3. **Scheduling:** Should users be able to schedule emails for later?
4. **Follow-ups:** Auto-send follow-up emails after 1 week if no response?
5. **ATS integration:** Direct integration with LinkedIn/Indeed apply?

---

## References

- Resend.com API: https://resend.com/docs/api-reference/emails/send
- Email deliverability best practices: RFC 7231, SPF/DKIM/DMARC setup
- Open rate tracking: https://en.wikipedia.org/wiki/Email_tracking#Open_tracking
- Rate limiting strategy: Token bucket algorithm (lib/rate-limit/rate-limiter.ts)

---

**Spec prepared by:** Claude Haiku 4.5  
**Date:** 2026-09-18  
**Status:** Ready for engineering review and Phase 4.3 implementation
