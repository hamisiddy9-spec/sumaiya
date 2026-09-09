"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";

/**
 * AI Career Copilot landing page.
 *
 * Ported from the Claude Design exploration
 * ("Landing Page - AI Career Copilot.dc.html") into live React using the app's
 * real Warm Confidence tokens and fonts. The centrepiece is an interactive,
 * AI-led chat demo: the visitor taps a goal and the assistant leads them to a
 * CV, a job match, an ATS score, or interview practice — then a CTA opens the
 * real feature.
 *
 * Copy is intentionally GLOBAL (not region-locked) to match the current brand
 * positioning. The original design's "Built for East Africa" lines are
 * deliberately not reproduced.
 */

// ── Warm Confidence palette (mirrors tailwind.config.ts + the design) ──────────
const C = {
  sand: "#EFE7DA",
  espresso: "#211A15",
  espressoLine: "#3A2E25",
  ember: "#DA4A1C",
  emberDark: "#A8330F",
  emberHover: "#C13E14",
  pine: "#12433D",
  gold: "#F2A93B",
  cream: "#FAF5EE",
  bodyMuted: "#6B5F54",
  faintMuted: "#9C9186",
  border: "#E9E0D4",
  borderStrong: "#DBD1C2",
  emberTint: "#FBE9E1",
  panel: "#F4EEE4",
  green: "#059669",
};

const FONT_DISPLAY = "var(--font-display), 'Bricolage Grotesque', sans-serif";
const FONT_BODY = "var(--font-body), 'Hanken Grotesk', system-ui, sans-serif";
const FONT_MONO = "var(--font-mono), 'JetBrains Mono', monospace";

// ── The interactive demo state machine (ported from the DC Component) ──────────
type CardKind = "ats" | "match" | "interview" | null;

type Msg = { role: "user" | "assistant"; content: string; card?: CardKind };

interface PathDef {
  label: string;
  follow: string | null;
  options?: { id: string; label: string }[];
  resultCard?: CardKind;
  resultText: string;
  cta: string;
  href: string;
}

const PATHS: Record<string, PathDef> = {
  cv: {
    label: "📝 Build my CV",
    follow: "Do you have an old CV to upload, or should we start fresh?",
    options: [
      { id: "upload", label: "Upload my old CV" },
      { id: "fresh", label: "Start from scratch" },
    ],
    resultText: "Perfect — I've opened the CV builder with your details ready to go.",
    cta: "Continue to CV builder →",
    href: "/assistant",
  },
  jobs: {
    label: "🎯 Find matching jobs",
    follow: "Which field are you in?",
    options: [
      { id: "tech", label: "Technology" },
      { id: "finance", label: "Banking & Finance" },
      { id: "ngo", label: "NGOs & Development" },
    ],
    resultCard: "match",
    resultText: "Found one — 82% match on a Software Engineer role at Zuri Fintech.",
    cta: "See all matching jobs →",
    href: "/jobs",
  },
  ats: {
    label: "⚡ Check my ATS score",
    follow: null,
    resultCard: "ats",
    resultText: "Here's your CV's ATS readiness.",
    cta: "Open the fixes →",
    href: "/ats-checker",
  },
  interview: {
    label: "🎤 Practice for an interview",
    follow: "What role are you interviewing for?",
    options: [
      { id: "eng", label: "Software Engineer" },
      { id: "sales", label: "Sales" },
      { id: "support", label: "Customer Support" },
    ],
    resultCard: "interview",
    resultText: "Let's start — here's your first question.",
    cta: "Continue the interview →",
    href: "/interview",
  },
};

const INTRO: Msg = {
  role: "assistant",
  content: "Hey! I'm your AI assistant. What do you want to do today?",
};

function AtsCard() {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginTop: 2 }}>
      <p style={{ fontFamily: FONT_MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: C.faintMuted, margin: "0 0 10px" }}>ATS READINESS</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: `conic-gradient(${C.green} 0% 88%, ${C.sand} 88% 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: C.green }}>88</div>
        </div>
        <div>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: C.green, margin: 0 }}>Ready</p>
          <p style={{ fontSize: 10.5, color: C.faintMuted, margin: "2px 0 0" }}>7/8 checks passed</p>
        </div>
      </div>
    </div>
  );
}

function MatchCard() {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginTop: 2 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 22, color: C.pine }}>82%</span>
        <span style={{ fontSize: 11, color: C.faintMuted }}>match — Software Engineer, Zuri Fintech</span>
      </div>
      <div style={{ width: "100%", height: 6, background: C.sand, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: "82%", height: "100%", background: C.pine, borderRadius: 99 }} />
      </div>
    </div>
  );
}

function InterviewCard() {
  return (
    <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginTop: 2 }}>
      <p style={{ fontFamily: FONT_MONO, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: C.faintMuted, margin: "0 0 8px" }}>FIRST QUESTION</p>
      <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, color: C.espresso }}>&ldquo;Walk me through a time you shipped something under a tight deadline.&rdquo;</p>
    </div>
  );
}

function DemoChat() {
  const [path, setPath] = useState<string | null>(null);
  const [step, setStep] = useState<"start" | "follow" | "result">("start");
  const [messages, setMessages] = useState<Msg[]>([INTRO]);

  const pickPath = (id: string) => {
    const p = PATHS[id];
    const userMsg: Msg = { role: "user", content: p.label };
    if (p.follow) {
      setMessages((m) => [...m, userMsg, { role: "assistant", content: p.follow as string }]);
      setPath(id);
      setStep("follow");
    } else {
      setMessages((m) => [...m, userMsg, { role: "assistant", content: p.resultText, card: p.resultCard }]);
      setPath(id);
      setStep("result");
    }
  };

  const pickOption = (label: string) => {
    if (!path) return;
    const p = PATHS[path];
    setMessages((m) => [
      ...m,
      { role: "user", content: label },
      { role: "assistant", content: p.resultText, card: p.resultCard },
    ]);
    setStep("result");
  };

  const reset = () => {
    setPath(null);
    setStep("start");
    setMessages([INTRO]);
  };

  const p = path ? PATHS[path] : null;
  const chips = useMemo(() => {
    if (!path) return Object.keys(PATHS).map((id) => ({ label: PATHS[id].label, onClick: () => pickPath(id) }));
    if (step === "follow" && p?.options) return p.options.map((o) => ({ label: o.label, onClick: () => pickOption(o.label) }));
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, step, messages]);

  return (
    <div style={{ maxWidth: 380, margin: "0 auto", background: C.espresso, borderRadius: 32, padding: 10, boxShadow: "0 20px 50px rgba(33,26,21,0.28)" }}>
      <div style={{ background: C.panel, borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", height: "min(70vh, 560px)" }}>
        {/* header */}
        <div style={{ background: "#FFFFFF", borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: C.ember, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>✨</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.espresso }}>Assistant</p>
            <p style={{ margin: 0, fontSize: 10.5, color: C.faintMuted }}>Try it — tap a reply below</p>
          </div>
        </div>

        {/* messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {messages.map((msg, i) =>
            msg.role === "user" ? (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: C.ember, color: C.cream, borderRadius: "16px 16px 4px 16px", padding: "10px 14px", fontSize: 13.5, lineHeight: 1.4, maxWidth: "82%" }}>{msg.content}</div>
              </div>
            ) : (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: "16px 16px 16px 4px", padding: "10px 14px", fontSize: 13.5, lineHeight: 1.4, maxWidth: "85%", color: C.espresso }}>{msg.content}</div>
                </div>
                {msg.card === "ats" && <AtsCard />}
                {msg.card === "match" && <MatchCard />}
                {msg.card === "interview" && <InterviewCard />}
              </div>
            )
          )}

          {chips.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 2 }}>
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.onClick}
                  className="copilot-chip"
                  style={{ background: "#FFFFFF", border: `1.5px solid ${C.borderStrong}`, color: C.espresso, fontSize: 12.5, fontWeight: 700, padding: "11px 16px", borderRadius: 999, cursor: "pointer", fontFamily: FONT_BODY }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CTA when a path resolves */}
        {step === "result" && p && (
          <div style={{ padding: "12px 16px 14px", borderTop: `1px solid ${C.border}`, background: "#FFFFFF", flexShrink: 0 }}>
            <Link href={p.href} style={{ display: "block", width: "100%", background: C.ember, color: C.cream, fontSize: 13.5, fontWeight: 700, padding: 13, borderRadius: 10, border: "none", cursor: "pointer", boxShadow: `0 3px 0 ${C.emberDark}`, textAlign: "center", textDecoration: "none", boxSizing: "border-box" }}>
              {p.cta}
            </Link>
            <button onClick={reset} style={{ display: "block", margin: "8px auto 0", background: "none", border: "none", textAlign: "center", fontSize: 10.5, color: C.faintMuted, cursor: "pointer", fontFamily: FONT_BODY }}>
              Live preview — tap to restart the demo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Static content blocks ──────────────────────────────────────────────────────
const JOURNEY = [
  { icon: "📝", tint: C.emberTint, step: "01 · BUILD", title: "Chat it into existence", body: "Talk to the assistant or upload an old CV. It writes your CV, cover letter, business card or formal letter." },
  { icon: "🎯", tint: "#E4EDEA", step: "02 · MATCH", title: "Find jobs that fit", body: "Browse real listings, each scored against your CV, with exactly what's missing." },
  { icon: "⚡", tint: "#FBF3E2", step: "03 · SHARPEN", title: "Fix what's holding you back", body: "A free ATS check, then AI-tailored rewrites you approve before anything saves." },
  { icon: "🎤", tint: "#EDE7F5", step: "04 · PREPARE", title: "Walk in ready", body: "Practice with a coach grounded in your actual CV and the job description." },
];

const SECTORS = ["Banking & Finance", "Telecommunications", "NGOs & Development", "Government", "Technology", "Healthcare"];

const TEMPLATE_SWATCHES = [C.ember, C.gold, C.pine, "#7C3AED"];

export function AiCopilotLanding() {
  return (
    <div style={{ background: C.sand, color: C.espresso, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      {/* NAV */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(239,231,218,0.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size="sm" />
          <Link href="/assistant" style={{ background: C.ember, color: C.cream, fontSize: 12.5, fontWeight: 700, padding: "9px 16px", borderRadius: 999, boxShadow: `0 2px 0 ${C.emberDark}`, whiteSpace: "nowrap", flexShrink: 0, textDecoration: "none" }}>Try free</Link>
        </div>
      </div>

      {/* HERO */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "clamp(32px,8vw,56px) 20px 8px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.emberTint, color: C.ember, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", padding: "6px 12px", borderRadius: 999, marginBottom: 20 }}>
          ⚡ Your AI career copilot
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(32px,8vw,48px)", lineHeight: 1.06, letterSpacing: "-1.5px", margin: "0 0 14px" }}>
          Tell the AI what you need. It leads from there.
        </h1>
        <p style={{ fontSize: "clamp(15px,4vw,17px)", lineHeight: 1.6, color: C.bodyMuted, margin: "0 auto 24px", maxWidth: 460 }}>
          No forms to fill first. Tap what you&rsquo;re trying to do below — the assistant asks the next question, and gets you a CV, a job match, an ATS score, or interview practice.
        </p>
        <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: C.pine, margin: "0 0 8px" }}>
          ✓ Free — no account needed to start
        </p>
      </section>

      {/* INTERACTIVE DEMO */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 8px" }}>
        <DemoChat />
      </section>

      {/* CTAs */}
      <section style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px 48px", display: "flex", flexDirection: "column", gap: 10 }}>
        <Link href="/assistant" style={{ background: C.ember, color: C.cream, fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 10, boxShadow: `0 3px 0 ${C.emberDark}`, textAlign: "center", textDecoration: "none" }}>Chat with AI — Free →</Link>
        <Link href="/templates" style={{ background: "#FFFFFF", color: C.espresso, fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 10, border: `1px solid ${C.borderStrong}`, textAlign: "center", textDecoration: "none" }}>Browse templates instead</Link>
      </section>

      {/* SECTOR MARQUEE */}
      <section style={{ background: C.espresso, borderTop: `1px solid ${C.espressoLine}`, borderBottom: `1px solid ${C.espressoLine}`, padding: "24px 0", overflow: "hidden" }}>
        <p style={{ textAlign: "center", fontFamily: FONT_MONO, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 1.5, color: "rgba(250,245,238,0.5)", margin: "0 0 16px", padding: "0 20px" }}>
          Built for every sector
        </p>
        <div style={{ display: "flex", overflow: "hidden" }}>
          <div className="copilot-marquee" style={{ display: "flex", gap: 44, minWidth: "max-content", flexShrink: 0 }}>
            {[...SECTORS, ...SECTORS].map((s, i) => (
              <span key={i} style={{ fontSize: 15, fontWeight: 700, color: "rgba(250,245,238,0.7)", whiteSpace: "nowrap" }}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(56px,10vw,96px) 20px" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 1.5, color: C.ember, margin: "0 0 14px", textAlign: "center" }}>THE WHOLE JOB SEARCH</p>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(26px,6vw,40px)", letterSpacing: "-1px", margin: "0 auto 40px", maxWidth: 560, textAlign: "center" }}>Not just a CV. A path from blank page to job offer.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
          {JOURNEY.map((j) => (
            <div key={j.step} style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, borderRadius: 16, padding: "26px 22px" }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: j.tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 16 }}>{j.icon}</div>
              <p style={{ fontFamily: FONT_MONO, fontSize: 10, color: C.faintMuted, margin: "0 0 6px" }}>{j.step}</p>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, margin: "0 0 8px" }}>{j.title}</h3>
              <p style={{ fontSize: 13.5, color: C.bodyMuted, lineHeight: 1.55, margin: 0 }}>{j.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* JOBS + INTERVIEW */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px clamp(56px,10vw,96px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
        <div style={{ background: C.espresso, borderRadius: 18, padding: "32px 26px", color: C.cream }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(218,74,28,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 20 }}>🎯</div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 21, margin: "0 0 10px", letterSpacing: "-0.5px" }}>Jobs, scored against your CV</h3>
          <p style={{ fontSize: 14, color: "rgba(250,245,238,0.65)", lineHeight: 1.6, margin: 0 }}>Real listings across tech, finance, NGO and government roles. Track one in a tap — an application is created automatically.</p>
        </div>
        <div style={{ background: C.pine, borderRadius: 18, padding: "32px 26px", color: C.cream }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 20 }}>🎤</div>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 21, margin: "0 0 10px", letterSpacing: "-0.5px" }}>Interview prep, grounded in your CV</h3>
          <p style={{ fontSize: 14, color: "rgba(250,245,238,0.7)", lineHeight: 1.6, margin: 0 }}>Not generic questions. The coach reads your real experience and, if attached, the exact job description.</p>
        </div>
      </section>

      {/* TEMPLATES */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px clamp(56px,10vw,96px)" }}>
        <p style={{ fontFamily: FONT_MONO, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 1.5, color: C.ember, margin: "0 0 14px", textAlign: "center" }}>47+ TEMPLATES</p>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(24px,5vw,34px)", letterSpacing: "-1px", margin: "0 auto 32px", textAlign: "center", maxWidth: 480 }}>Every template is ATS-ready by default</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(90px,1fr))", gap: 10 }}>
          {TEMPLATE_SWATCHES.map((swatch, i) => {
            const dark = swatch === C.gold; // gold swatch sits on the dark card in the design
            return (
              <div key={i} style={{ aspectRatio: "0.72", background: dark ? C.espresso : "#FFFFFF", border: dark ? "none" : `1px solid ${C.border}`, borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ width: "60%", height: 7, background: swatch, borderRadius: 2 }} />
                <div style={{ width: "80%", height: 4, background: dark ? "rgba(255,255,255,0.2)" : C.border, borderRadius: 2, marginTop: 5 }} />
                <div style={{ width: "70%", height: 4, background: dark ? "rgba(255,255,255,0.2)" : C.border, borderRadius: 2 }} />
              </div>
            );
          })}
          <Link href="/templates" style={{ aspectRatio: "0.72", background: "#FFFFFF", border: `1px solid ${C.borderStrong}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: C.bodyMuted, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none" }}>+43 more</Link>
        </div>
      </section>

      {/* DARK CTA */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px clamp(56px,10vw,96px)" }}>
        <div style={{ background: C.espresso, border: `1px solid ${C.espressoLine}`, borderRadius: 20, padding: "clamp(40px,8vw,64px) 28px", textAlign: "center" }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(24px,6vw,34px)", letterSpacing: "-1px", color: C.cream, margin: "0 0 14px" }}>Your next job starts with one conversation.</h2>
          <p style={{ fontSize: 15, color: "rgba(242,169,59,0.8)", margin: "0 auto 28px", maxWidth: 400 }}>Build for free, download when you&rsquo;re ready.</p>
          <Link href="/assistant" style={{ background: C.ember, color: C.cream, fontSize: 15, fontWeight: 700, padding: "15px 28px", borderRadius: 10, boxShadow: `0 3px 0 ${C.emberDark}`, display: "inline-block", textDecoration: "none" }}>Chat with AI — Free →</Link>
        </div>
      </section>

      {/* FOOTER */}
      <section style={{ borderTop: `1px solid ${C.border}`, padding: "40px 20px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: C.faintMuted, margin: 0 }}>Sumaiya — an AI career copilot that helps you get hired.</p>
      </section>
    </div>
  );
}
