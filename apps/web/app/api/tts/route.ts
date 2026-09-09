// Server-side cloud TTS proxy (P4) — the ElevenLabs API key NEVER leaves the
// server. The client provider hits this route; without a key the route answers
// 501 and the client falls back to the browser's speechSynthesis. With a key it
// streams the neural MP3 through (the SpeechQueue chunks text client-side, so
// each request is a short utterance).

import { NextRequest, NextResponse } from "next/server";
import { TTS_CLOUD_MODEL, clampTtsRate, ttsCloudConfigured, ttsVoiceForLang } from "@/lib/tts/cloud-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT = 5000;

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";
  const lang = req.nextUrl.searchParams.get("lang") ?? "en-US";
  const rate = clampTtsRate(Number(req.nextUrl.searchParams.get("rate") ?? "1"));

  if (!text.trim() || text.length > MAX_TEXT) {
    return NextResponse.json({ error: "invalid_text" }, { status: 400 });
  }
  if (!ttsCloudConfigured()) {
    // No key → graceful: client falls back to the browser provider.
    return NextResponse.json({ error: "not_configured" }, { status: 501 });
  }

  const voiceId = ttsVoiceForLang(lang);
  try {
    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: TTS_CLOUD_MODEL,
        voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
        stream: true,
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      return NextResponse.json({ error: "upstream", detail: detail.slice(0, 300) }, { status: 502 });
    }

    const headers = new Headers();
    headers.set("Content-Type", upstream.headers.get("content-type") ?? "audio/mpeg");
    headers.set("Cache-Control", "public, max-age=3600");
    headers.set("X-TTS-Cloud", "elevenlabs");
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
