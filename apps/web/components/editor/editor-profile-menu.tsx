"use client";

import { useState, useRef } from "react";
import { User, Upload, FilePlus, Loader2, Save, Check } from "lucide-react";
import { useEditorStore } from "@/lib/stores/editor-store";
import { createEmptyCVData, type CVData } from "@/types";
import { seedCvData } from "@/lib/profile-mappers";
import type { UserProfile } from "@/lib/db/schema";
import { label } from "@/lib/i18n/labels";

// ─── Types ────────────────────────────────────────────────────────────────

interface EditorProfileMenuProps {
  accessToken?: string;
  onDataChanged?: () => void;
  className?: string;
  sw?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function EditorProfileMenu({
  accessToken,
  onDataChanged,
  className = "",
  sw = false,
}: EditorProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<"profile" | "upload" | "sync" | null>(null);
  const [uploadDetail, setUploadDetail] = useState("");
  const [syncDone, setSyncDone] = useState(false);
  const [confirmFresh, setConfirmFresh] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadCvData = useEditorStore((s) => s.loadCvData);

  // ── Sync CV facts back to the Career Profile (non-destructive) ─────────
  // The one-way bridge: this CV's facts fill ONLY empty sections of the
  // profile (never overwrite). Opt-in, reversible (profile can be edited
  // freely), and the CV itself is never modified.
  const handleSyncToProfile = async () => {
    setBusy("sync");
    setSyncDone(false);
    try {
      const cvId = typeof window !== "undefined"
        ? window.location.pathname.split("/").pop()
        : null;
      if (!cvId || cvId === "new") throw new Error("no cv id");
      const res = await fetch("/api/profile/backfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId }),
      });
      const json = await res.json();
      if (json.success) {
        setSyncDone(true);
        setTimeout(() => setSyncDone(false), 2500);
      }
    } catch (e) {
      console.error("[EditorProfileMenu] sync to profile failed:", e);
    } finally {
      setBusy(null);
    }
  };

  // ── Use My Profile ──────────────────────────────────────────────────
  const handleUseProfile = async () => {
    setBusy("profile");
    try {
      const res = await fetch("/api/profile", {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const json = await res.json();
      const prof: UserProfile | null = json.data ?? null;
      const seeded = seedCvData(prof);
      loadCvData(seeded);
      onDataChanged?.();
      setOpen(false);
    } catch (e) {
      console.error("[EditorProfileMenu] profile fetch failed:", e);
    } finally {
      setBusy(null);
    }
  };

  // ── Upload Document ─────────────────────────────────────────────────
  const handleUpload = async (file: File) => {
    setBusy("upload");
    setUploadDetail(sw ? "Inasoma faili…" : "Reading file…");
    try {
      // Step 1 — extract text in the browser
      let text: string;
      const { extractCvTextFromPdf } = await import("@/lib/client-cv-extract");

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const result = await extractCvTextFromPdf(file, (p) => {
          if (p.stage === "ocr") {
            setUploadDetail(`OCR · ${sw ? "ukurasa" : "page"} ${p.page}/${p.total} · ${p.pct}%`);
          }
        });
        text = result.text;
      } else {
        // Plain text, Word, or other — read as text directly
        setUploadDetail(sw ? "Inasoma faili…" : "Reading file…");
        text = await file.text();
      }

      const trimmed = text.replace(/\s/g, "");
      if (trimmed.length < 40) {
        console.error("[EditorProfileMenu] not enough text extracted");
        setBusy(null);
        setUploadDetail("");
        return;
      }

      // Step 2 — AI parsing (same endpoint as import-cv)
      setUploadDetail(sw ? "AI inasoma…" : "AI is reading…");
      const parseRes = await fetch("/api/ai/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 20000) }),
      });
      const parseJson = await parseRes.json().catch(() => ({})) as {
        success?: boolean;
        data?: {
          personal?: Record<string, string>;
          summary?: string;
          experience?: Array<Record<string, unknown>>;
          education?: Array<Record<string, unknown>>;
          skills?: string[];
          languages?: Array<{ name?: string; proficiency?: string }>;
          certifications?: Array<{ name?: string; issuer?: string; date?: string }>;
          hobbies?: string;
        };
        error?: string;
      };

      if (!parseRes.ok || !parseJson.success || !parseJson.data) {
        console.error("[EditorProfileMenu] parse failed:", parseJson.error);
        setBusy(null);
        setUploadDetail("");
        return;
      }

      // Step 3 — convert to CVData and load into editor (SKIP doc creation)
      const { nanoid } = await import("nanoid");
      const p = parseJson.data;
      const empty = createEmptyCVData();
      const cvData: CVData = {
        ...empty,
        personal: {
          ...empty.personal,
          fullName: p.personal?.fullName ?? "",
          jobTitle: p.personal?.jobTitle ?? "",
          email: p.personal?.email ?? "",
          phone: p.personal?.phone ?? "",
          location: p.personal?.location ?? "",
          linkedin: p.personal?.linkedin ?? "",
          website: p.personal?.website ?? "",
        },
        summary: p.summary ?? "",
        experience: (p.experience ?? []).slice(0, 12).map((e) => ({
          id: nanoid(),
          company: String(e.company ?? ""),
          position: String(e.position ?? ""),
          location: String(e.location ?? ""),
          startDate: String(e.startDate ?? ""),
          endDate: String(e.endDate ?? ""),
          current: !!e.current,
          description: String(e.description ?? ""),
        })),
        education: (p.education ?? []).slice(0, 8).map((e) => ({
          id: nanoid(),
          institution: String(e.institution ?? ""),
          degree: String(e.degree ?? ""),
          field: String(e.field ?? ""),
          startDate: String(e.startDate ?? ""),
          endDate: String(e.endDate ?? ""),
        })),
        skills: (p.skills ?? []).slice(0, 24).map((s) => ({
          id: nanoid(),
          name: String(s),
          level: 3 as const,
        })),
        languages: (p.languages ?? [])
          .filter((l) => l?.name?.trim())
          .slice(0, 10)
          .map((l) => {
            const PROFICIENCIES = ["Native", "Fluent", "Advanced", "Intermediate", "Basic"] as const;
            const hit = PROFICIENCIES.find(
              (pf) => pf.toLowerCase() === (l.proficiency ?? "").trim().toLowerCase()
            );
            return { id: nanoid(), name: l.name!.trim(), proficiency: hit ?? "Fluent" };
          }),
        certifications: (p.certifications ?? [])
          .filter((cert) => cert?.name?.trim())
          .slice(0, 12)
          .map((cert) => ({
            id: nanoid(),
            name: cert.name!.trim(),
            issuer: (cert.issuer ?? "").trim(),
            date: (cert.date ?? "").trim(),
          })),
        hobbies: (p.hobbies ?? "").trim(),
      };

      loadCvData(cvData);
      onDataChanged?.();
      setOpen(false);
    } catch (e) {
      console.error("[EditorProfileMenu] upload failed:", e);
    } finally {
      setBusy(null);
      setUploadDetail("");
    }
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleUpload(f);
    if (fileRef.current) fileRef.current.value = "";
  };

  // ── Start Fresh ─────────────────────────────────────────────────────
  // Two-step destructive confirm: first click arms the action, second click
  // executes. No blocking native confirm() dialog.
  const handleStartFresh = () => {
    if (!confirmFresh) {
      setConfirmFresh(true);
      return;
    }
    setConfirmFresh(false);
    loadCvData(createEmptyCVData());
    onDataChanged?.();
    setOpen(false);
  };

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <span className={`relative ${className}`}>
      <button
        onClick={() => { setOpen((v) => !v); setConfirmFresh(false); }}
        disabled={busy !== null}
        title={sw ? "Chaguo za wasifu" : "Profile options"}
        className="flex items-center gap-1.5 text-[11px] font-medium text-cream/80 hover:text-cream bg-espresso-2 hover:bg-espresso-line rounded-lg px-2.5 py-1.5 transition disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline text-[10px]">{uploadDetail || (label(sw, "loading"))}</span>
          </>
        ) : (
          <>
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sw ? "Wasifu" : "Profile"}</span>
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setConfirmFresh(false); }} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-sand/80 rounded-xl shadow-card-hover py-1.5 min-w-[224px] overflow-hidden">
            <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {sw ? "Data ya Wasifu" : "Profile Data"}
            </p>

            <button
              onClick={handleUseProfile}
              disabled={busy !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-sand/60 transition text-left disabled:opacity-50"
            >
              <User size={15} className="text-ember mt-0.5 shrink-0" />
              <span>
                <span className="block text-xs font-semibold text-espresso">{sw ? "Tumia Wasifu Wangu" : "Use My Profile"}</span>
                <span className="block text-[10px] text-text-muted">{sw ? "Jaza kutoka data ya wasifu iliyohifadhiwa" : "Fill from saved profile data"}</span>
              </span>
            </button>

            {/* Sync this CV's facts back into the Career Profile — the
                non-destructive bridge (fills only blank profile sections). */}
            <button
              onClick={handleSyncToProfile}
              disabled={busy !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-sand/60 transition text-left disabled:opacity-50"
            >
              {syncDone ? <Check size={15} className="text-pine mt-0.5 shrink-0" /> : <Save size={15} className="text-pine mt-0.5 shrink-0" />}
              <span>
                <span className="block text-xs font-semibold text-espresso">
                  {syncDone
                    ? (sw ? "Wasifu umejazwa ✓" : "Profile filled ✓")
                    : (sw ? "Hifadhi kwenye Wasifu" : "Save to my Profile")}
                </span>
                <span className="block text-[10px] text-text-muted">
                  {sw ? "Jaza sehemu tupu za wasifu na CV hii" : "Fill blank profile sections from this CV"}
                </span>
              </span>
            </button>

            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy !== null}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-sand/60 transition text-left disabled:opacity-50"
            >
              <Upload size={15} className="text-pine mt-0.5 shrink-0" />
              <span>
                <span className="block text-xs font-semibold text-espresso">{sw ? "Pakia Hati" : "Upload Document"}</span>
                <span className="block text-[10px] text-text-muted">{sw ? "Toa kutoka PDF" : "Extract from PDF"}</span>
              </span>
            </button>

            <button
              onClick={handleStartFresh}
              disabled={busy !== null}
              className={`w-full flex items-center gap-2.5 px-3 py-2 transition text-left disabled:opacity-50 ${
                confirmFresh ? "bg-red-50" : "hover:bg-sand/60"
              }`}
            >
              <FilePlus size={15} className={`mt-0.5 shrink-0 ${confirmFresh ? "text-red-600" : "text-purple-glow"}`} />
              <span>
                <span className={`block text-xs font-semibold ${confirmFresh ? "text-red-600" : "text-espresso"}`}>
                  {confirmFresh
                    ? (sw ? "Bonyeza tena kuthibitisha?" : "Click again to confirm?")
                    : (sw ? "Anza Upya" : "Start Fresh")}
                </span>
                <span className="block text-[10px] text-text-muted">
                  {confirmFresh
                    ? (sw ? "Hii itafuta maudhui yote ya CV" : "This will clear all current CV content")
                    : (sw ? "Futa yote, anza upya" : "Clear all, blank canvas")}
                </span>
              </span>
            </button>
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.txt,.doc,.docx"
        className="hidden"
        onChange={handleFilePick}
      />
    </span>
  );
}
