import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail, sendContactAutoReply, sendAiSupportReply } from "@/lib/email";
import { generateSupportReply } from "@/lib/support-ai";
import { rateLimitDurable } from "@/lib/api/rate-limit";
import { reportError } from "@/lib/observability/report-error";

// The AI first-response call can take a while; match the main AI route's budget
// so the function isn't cut off at the platform's short default.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 contact submissions per 10 minutes per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
    const rl = await rateLimitDurable(`contact:${ip}`, { max: 3, windowMs: 600_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json() as { name?: string; email?: string; message?: string };
    const { name, email, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    // AI answers the actual question first (falls back to a static
    // acknowledgement if no AI provider is configured or the call fails).
    let aiReply: string | null = null;
    try {
      aiReply = await generateSupportReply(cleanName, cleanMessage);
    } catch (err) {
      await reportError(err, { scope: "contact:ai-reply" });
    }

    await Promise.all([
      // Owner always gets the message — plus the AI reply, so they can take over.
      sendContactEmail({ name: cleanName, email: cleanEmail, message: cleanMessage, aiReply }),
      // Customer gets the AI reply, or a static acknowledgement as a fallback.
      aiReply
        ? sendAiSupportReply({ name: cleanName, email: cleanEmail, aiReply })
        : sendContactAutoReply({ name: cleanName, email: cleanEmail }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    await reportError(err, { scope: "contact" });
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
