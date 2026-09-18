/**
 * Email document sending service
 *
 * Purpose: Generate PDF/DOCX from CV and send to recruiter via Resend
 * Includes: tracking pixel for open detection, link tracking for clicks
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendDocumentsParams {
  recipientEmail: string;
  recipientName?: string;
  senderName: string;
  senderEmail: string;
  jobTitle?: string;
  companyName?: string;
  documents: {
    cv?: {
      content: string; // PDF as base64 or buffer
      fileName: string;
    };
    coverLetter?: {
      content: string;
      fileName: string;
    };
  };
  trackingId: string;
  customMessage?: string;
}

interface SendDocumentsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  trackingPixelUrl?: string;
}

/**
 * Send CV + cover letter to recruiter with tracking
 * Returns tracking pixel URL to be included in email (for open tracking)
 */
export async function sendDocumentsToRecruiter({
  recipientEmail,
  recipientName,
  senderName,
  senderEmail,
  jobTitle,
  companyName,
  documents,
  trackingId,
  customMessage,
}: SendDocumentsParams): Promise<SendDocumentsResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      error: "Email service not configured. Contact support.",
    };
  }

  // Validate email
  if (!isValidEmail(recipientEmail)) {
    return {
      success: false,
      error: "Invalid recipient email address",
    };
  }

  // Check disposable email list (prevent abuse)
  if (await isDisposableEmail(recipientEmail)) {
    return {
      success: false,
      error: "Please use a company email, not a temporary email service",
    };
  }

  try {
    // Build email content
    const subject = `Application from ${senderName}${jobTitle ? ` - ${jobTitle}` : ""}`;
    const html = buildEmailHtml({
      senderName,
      recipientName,
      jobTitle,
      companyName,
      customMessage,
      trackingId,
    });

    // Convert documents if they're base64 strings
    const attachments = [];
    if (documents.cv) {
      attachments.push({
        filename: documents.cv.fileName,
        content: Buffer.from(documents.cv.content, "base64"),
      });
    }
    if (documents.coverLetter) {
      attachments.push({
        filename: documents.coverLetter.fileName,
        content: Buffer.from(documents.coverLetter.content, "base64"),
      });
    }

    // Send via Resend
    const response = await resend.emails.send({
      from: `${senderName} via Sumaiya <noreply@sumaiya.app>`,
      to: recipientEmail,
      subject,
      html,
      attachments,
      tags: [
        { name: "application", value: "cv" },
        { name: "tracking_id", value: trackingId },
      ],
    });

    if (!response.data?.id) {
      return {
        success: false,
        error: response.error?.message || "Failed to send email",
      };
    }

    // Return tracking pixel URL for open detection
    const trackingPixelUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://sumaiya.app"}/api/email/track/open?id=${trackingId}`;

    return {
      success: true,
      messageId: response.data.id,
      trackingPixelUrl,
    };
  } catch (error) {
    console.error("Failed to send documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
}

/**
 * Build professional email HTML with tracking pixel
 */
function buildEmailHtml({
  senderName,
  recipientName,
  jobTitle,
  companyName,
  customMessage,
  trackingId,
}: {
  senderName: string;
  recipientName?: string;
  jobTitle?: string;
  companyName?: string;
  customMessage?: string;
  trackingId: string;
}): string {
  const greeting = recipientName ? `Hi ${recipientName}` : "Hi there";
  const jobContext =
    jobTitle || companyName
      ? `I'm applying for the ${jobTitle || "role"}${companyName ? ` at ${companyName}` : ""}.`
      : "";

  const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL || "https://sumaiya.app"}/api/email/track/open?id=${trackingId}" alt="" width="1" height="1" style="display:none;" />`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      ${greeting},
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      ${jobContext}
      ${customMessage ? `<br/><br/>${customMessage}` : ""}
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      I've attached my CV and cover letter for your review. I'm excited about this opportunity and would welcome the chance to discuss how my skills align with your needs.
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Best regards,<br/>
      <strong>${senderName}</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      <em>Sent via <a href="https://sumaiya.app" style="color: #0066cc; text-decoration: none;">Sumaiya</a> — Your AI-powered career companion</em>
    </p>

    <!-- Tracking pixel (hidden) -->
    ${trackingPixel}
  </div>
</body>
</html>
  `;
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email is from a disposable email service (prevent abuse)
 * In production, would call a real service like Disposable Email Domains list
 */
async function isDisposableEmail(email: string): Promise<boolean> {
  const domain = email.split("@")[1].toLowerCase();

  // Common disposable domains (real implementation would use a larger list)
  const disposableDomains = [
    "tempmail.com",
    "throwaway.email",
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "maildrop.cc",
  ];

  return disposableDomains.includes(domain);
}
