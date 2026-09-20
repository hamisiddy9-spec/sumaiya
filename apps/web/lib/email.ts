import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Sumaiya <noreply@templatehub.pro>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sumaiya.app";

/** Escape user-supplied text before embedding it in an HTML email. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND_COLOR = "#DA4A1C";
const BRAND_BG = "#F0F4FF";

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sumaiya</title>
</head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
      <!-- Header -->
      <tr>
        <td style="background:${BRAND_COLOR};padding:28px 40px;">
          <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Sumaiya</span>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td style="padding:40px;">
          ${content}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
            You received this email because you have an account on
            <a href="${APP_URL}" style="color:${BRAND_COLOR};text-decoration:none;">Sumaiya</a>.
            &nbsp;|&nbsp;
            <a href="${APP_URL}/settings" style="color:${BRAND_COLOR};text-decoration:none;">Manage preferences</a>
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function welcomeHtml(name: string): string {
  const displayName = name || "there";
  return baseLayout(`
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
      Welcome to Sumaiya, ${esc(displayName)}! 👋
    </h1>
    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.7;">
      Your account is ready. You can now create professional CVs and cover letters that stand out —
      with 11 stunning templates, writing help, and one-click PDF export.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td style="background:${BRAND_BG};border-radius:8px;padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">Get started in 3 steps:</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">✦ &nbsp;Create your first CV and pick a template</p>
          <p style="margin:0 0 8px;font-size:14px;color:#4b5563;">✦ &nbsp;Fill in your details — or let me help you</p>
          <p style="margin:0;font-size:14px;color:#4b5563;">✦ &nbsp;Export as a polished PDF and apply with confidence</p>
        </td>
      </tr>
    </table>
    <a href="${APP_URL}/dashboard"
       style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;letter-spacing:0.2px;">
      Go to Dashboard →
    </a>
    <p style="margin:28px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
      If you have any questions, reply to this email or visit our
      <a href="${APP_URL}/contact" style="color:${BRAND_COLOR};text-decoration:none;">contact page</a>.
      We're happy to help!
    </p>
  `);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] Failed to send:", subject, err);
  }
}

export async function sendWelcomeEmail({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<void> {
  await sendEmail(email, "Welcome to Sumaiya! 🎉", welcomeHtml(name));
}

// ── Application follow-up reminder ──────────────────────────────────────────
// The return loop: a job the user applied to has gone quiet for a week, so we
// nudge them to follow up. Sent by the daily cron, at most once per week per job.
function followUpHtml(name: string, apps: { title: string; company: string; days: number }[]): string {
  const displayName = name ? name.split(" ")[0] : "there";
  const rows = apps.map((a) => `
    <tr>
      <td style="padding:12px 16px;border:1px solid #eee;border-radius:8px;">
        <span style="font-size:15px;font-weight:700;color:#111827;">${esc(a.title)}</span>
        ${a.company ? `<span style="font-size:13px;color:#6b7280;"> · ${esc(a.company)}</span>` : ""}
        <br/><span style="font-size:12px;color:#9ca3af;">Applied ${a.days} days ago</span>
      </td>
    </tr>`).join('<tr><td style="height:8px;"></td></tr>');
  return baseLayout(`
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.5px;">
      Time to follow up, ${esc(displayName)} 👋
    </h1>
    <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.7;">
      ${apps.length === 1 ? "One of your applications has" : `${apps.length} of your applications have`}
      been quiet for a week. A short, polite email to the employer asking about your status
      often keeps you top of mind — and it's exactly when many candidates give up.
    </p>
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 26px;">${rows}</table>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="border-radius:10px;background:${BRAND_COLOR};">
        <a href="${APP_URL}/dashboard?tab=applications"
           style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
          Open my applications
        </a>
      </td></tr>
    </table>
    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
      Not job-hunting right now? You can turn these reminders off in
      <a href="${APP_URL}/settings" style="color:${BRAND_COLOR};text-decoration:none;">settings</a>.
    </p>
  `);
}

export async function sendFollowUpReminder({
  name,
  email,
  apps,
}: {
  name: string;
  email: string;
  apps: { title: string; company: string; days: number }[];
}): Promise<void> {
  if (!apps.length) return;
  const subject = apps.length === 1
    ? `Follow up on ${apps[0].title}?`
    : `${apps.length} applications need a follow-up`;
  await sendEmail(email, subject, followUpHtml(name, apps));
}

export async function sendContactEmail({
  name, email, message, aiReply,
}: {
  name: string;
  email: string;
  message: string;
  /** The reply the AI already sent to the user, shown so the owner can decide
   *  whether to follow up or let it stand. */
  aiReply?: string | null;
}): Promise<void> {
  const aiBlock = aiReply
    ? `
      <p style="margin:24px 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">🤖 AI already replied to the customer</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${esc(aiReply)}</p>
      </div>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">Reply to <a href="mailto:${esc(email)}" style="color:#2563EB;">${esc(email)}</a> directly if you want to take over.</p>`
    : `<p style="margin:20px 0 0;font-size:13px;color:#b45309;">⚠️ AI reply was not sent (no AI provider or it failed) — a static acknowledgement went out instead. Please reply personally.</p>`;

  await sendEmail(
    "support@templatehub.pro",
    `New contact message from ${name}`,
    baseLayout(`
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#111827;">New Contact Message</h2>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tr><td style="padding:12px 20px;font-size:13px;font-weight:600;color:#6b7280;background:#f9fafb;border-bottom:1px solid #e5e7eb;" colspan="2">SENDER</td></tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#374151;border-bottom:1px solid #f3f4f6;width:100px;">Name</td>
          <td style="padding:12px 20px;font-size:14px;font-weight:600;color:#111827;border-bottom:1px solid #f3f4f6;">${esc(name)}</td>
        </tr>
        <tr>
          <td style="padding:12px 20px;font-size:14px;color:#374151;">Email</td>
          <td style="padding:12px 20px;font-size:14px;font-weight:600;color:#111827;"><a href="mailto:${esc(email)}" style="color:#2563EB;">${esc(email)}</a></td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">MESSAGE</p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${esc(message)}</p>
      </div>
      ${aiBlock}
    `)
  );
}

/**
 * Sends the AI-generated first response straight to the customer, with a note
 * that a human will follow up if needed.
 */
export async function sendAiSupportReply({
  name, email, aiReply,
}: {
  name: string;
  email: string;
  aiReply: string;
}): Promise<void> {
  const swahili = /\b(habari|asante|tafadhali|naomba|barua|nafanya|nini|vipi|karibu|samahani)\b/i.test(aiReply);
  const followUp = swahili
    ? "Hili ni jibu la haraka. Kama unahitaji msaada zaidi, jibu email hii tu — mtu wa timu yetu atakusaidia."
    : "This is a quick first reply. If you need more help, just reply to this email — a member of our team will assist you.";

  await sendEmail(
    email,
    swahili ? "Jibu kutoka Sumaiya" : "Reply from Sumaiya Support",
    baseLayout(`
      <div style="font-size:16px;color:#374151;line-height:1.7;white-space:pre-wrap;">${esc(aiReply)}</div>
      <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:16px;">${followUp}</p>
    `)
  );
}

export async function sendContactAutoReply({
  name, email,
}: {
  name: string;
  email: string;
}): Promise<void> {
  await sendEmail(
    email,
    "We received your message — Sumaiya Support",
    baseLayout(`
      <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Thanks for reaching out, ${esc(name)}!</h1>
      <p style="margin:0 0 16px;font-size:16px;color:#374151;line-height:1.7;">
        We've received your message and will get back to you within 24 hours.
      </p>
      <p style="margin:0;font-size:14px;color:#6b7280;">
        In the meantime, you can continue building your CV at
        <a href="${APP_URL}/dashboard" style="color:#2563EB;">your dashboard</a>.
      </p>
    `)
  );
}

/**
 * Operational alert to the team — a monitored system is failing. Plain,
 * unbranded, high-signal. Sent to ALERT_EMAIL (falls back to support@).
 */
export async function sendOpsAlert(subject: string, lines: string[]): Promise<void> {
  const to = process.env.ALERT_EMAIL || "support@templatehub.pro";
  const body = lines.map((l) => `<p style="margin:0 0 8px;font-size:14px;color:#111827;font-family:monospace;">${esc(l)}</p>`).join("");
  await sendEmail(
    to,
    `[Sumaiya ALERT] ${subject}`,
    `<div style="padding:24px;background:#fff;font-family:monospace;">
       <h2 style="margin:0 0 16px;font-size:16px;color:#b91c1c;">${esc(subject)}</h2>
       ${body}
       <p style="margin:20px 0 0;font-size:12px;color:#6b7280;">${new Date().toISOString()} · ${APP_URL}</p>
     </div>`,
  );
}
