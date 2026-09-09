"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { AutoTextarea } from "@/components/ui/auto-textarea";
import type { UserProfile } from "@/lib/db/schema";

interface SharedProfilePanelProps {
  accessToken?: string;
  onProfileChange?: (profile: Partial<UserProfile>) => void;
  lang?: "en" | "sw";
}

export function SharedProfilePanel({ accessToken, onProfileChange, lang = "en" }: SharedProfilePanelProps) {
  const sw = lang === "sw";
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  // Local edit buffer
  const [edit, setEdit] = useState({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      const res = await fetch("/api/profile", { headers });
      const json = await res.json();
      if (json.success && json.data) {
        const p = json.data;
        setProfile(p);
        setEdit({
          fullName: p.fullName ?? "",
          jobTitle: p.jobTitle ?? "",
          email: p.email ?? "",
          phone: p.phone ?? "",
          location: p.location ?? "",
          linkedin: p.linkedin ?? "",
          website: p.website ?? "",
          summary: p.summary ?? "",
        });
      } else {
        // No profile yet — start empty
        setProfile(null);
      }
    } catch {
      // Silently fail — profile is optional
    } finally {
      setLoading(false);
    }
  }

  const markDirty = useCallback((field: string, value: string) => {
    setEdit(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const body = { ...edit };
      // Remove empty optionals
      if (!body.linkedin) delete (body as any).linkedin;
      if (!body.website) delete (body as any).website;

      const res = await fetch("/api/profile", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setDirty(false);
        setEditing(false);
        onProfileChange?.(json.data);
      } else {
        setError(sw ? "Imeshindwa kuhifadhi" : "Failed to save");
      }
    } catch {
      setError(sw ? "Hitilafu ya mtandao" : "Network error");
    } finally {
      setSaving(false);
    }
  }

  const isEmpty = !profile || (!profile.fullName && !profile.jobTitle && !profile.email && !profile.phone);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-pine-tint flex items-center justify-center flex-shrink-0">
            <Icon name="user" size={12} className="text-pine" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-espresso">
            {sw ? "Taarifa za Pamoja" : "Shared Identity"}
          </span>
        </div>
        {!isEmpty && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] font-medium text-ember-hover hover:text-ember/80 underline"
          >
            {sw ? "Hariri" : "Edit"}
          </button>
        )}
      </div>

      {/* Always explain what this does, in a legible size. */}
      <p className="text-[11px] text-text-muted leading-relaxed">
        {sw
          ? "Hifadhi mara moja — hujaza kiotomatiki kila CV, barua ya maombi na kadi mpya."
          : "Save once — it auto-fills every new CV, cover letter and business card."}
      </p>

      {loading ? (
        <div className="text-[10px] text-text-muted animate-pulse">{sw ? "Inapakia wasifu..." : "Loading profile..."}</div>
      ) : editing ? (
        /* Edit mode */
        <div className="space-y-2">
          {(["fullName", "jobTitle", "email", "phone", "location", "linkedin", "website"] as const).map(field => (
            <div key={field}>
              <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-0.5">
                {field === "fullName" ? (sw ? "Jina Kamili" : "Full Name") :
                 field === "jobTitle" ? (sw ? "Cheo cha Kazi" : "Job Title") :
                 field === "linkedin" ? "LinkedIn URL" :
                 field === "email" ? (sw ? "Barua pepe" : "Email") :
                 field === "phone" ? (sw ? "Simu" : "Phone") :
                 field === "location" ? (sw ? "Mahali" : "Location") :
                 (sw ? "Tovuti" : "Website")}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                value={(edit as any)[field]}
                onChange={(e) => markDirty(field, e.target.value)}
                placeholder={field === "fullName" ? (sw ? "mf. James Kariuki" : "e.g. James Kariuki") :
                  field === "jobTitle" ? (sw ? "mf. Mhandisi wa Programu" : "e.g. Software Engineer") :
                  field === "email" ? (sw ? "mf. james@example.com" : "e.g. james@example.com") :
                  field === "phone" ? (sw ? "mf. +254 712 345 678" : "e.g. +254 712 345 678") :
                  field === "location" ? (sw ? "mf. Nairobi, Kenya" : "e.g. Nairobi, Kenya") :
                  field === "linkedin" ? "https://linkedin.com/in/..." :
                  field === "website" ? "https://..." : ""}
                className="w-full px-3 py-2 text-base bg-sand-2 border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember placeholder:text-text-muted/40"
              />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-medium text-text-muted uppercase tracking-wider block mb-0.5">
              {sw ? "Muhtasari" : "Professional Summary"}
            </label>
            <AutoTextarea
              value={edit.summary}
              onChange={(e) => markDirty("summary", e.target.value)}
              rows={3}
              placeholder={sw ? "Muhtasari mfupi wa kikazi..." : "Brief professional summary..."}
              className="w-full px-3 py-2 text-base bg-sand-2 border border-border-input rounded-input focus:outline-none focus:shadow-focus-ember focus:border-ember min-h-[76px] placeholder:text-text-muted/40"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={saveProfile}
              disabled={saving || !dirty}
              className="flex-1"
            >
              {saving ? (sw ? "Inahifadhi..." : "Saving...") : (sw ? "Hifadhi Wasifu" : "Save Profile")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setEditing(false); setDirty(false); }}
              className="flex-shrink-0"
            >
              {sw ? "Ghairi" : "Cancel"}
            </Button>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      ) : isEmpty ? (
        /* Empty state — prompt to create */
        <div>
          <div className="bg-card border border-dashed border-border rounded-card p-3 text-center">
            <Icon name="plus" size={16} className="text-text-muted mx-auto mb-1.5" />
            <p className="text-[11px] text-text-muted leading-relaxed mb-2">
              {sw
                ? "Hifadhi jina, mawasiliano na wasifu wako mara moja — tutajaza kila hati."
                : "Save your name, contact, and bio once — we'll auto-fill every document."}
            </p>
            <Button size="sm" onClick={() => setEditing(true)} className="w-full">
              <Icon name="plus" size={10} /> {sw ? "Tengeneza Wasifu" : "Create Profile"}
            </Button>
          </div>
        </div>
      ) : (
        /* View mode — show profile summary + apply action */
        <div className="space-y-2">
        <div className="bg-card border border-border rounded-card p-3 space-y-1.5">
          {profile?.fullName && (
            <p className="text-[11px] font-bold text-espresso truncate">{profile.fullName}</p>
          )}
          {profile?.jobTitle && (
            <p className="text-[10px] text-text-body truncate">{profile.jobTitle}</p>
          )}
          {profile?.email && (
            <div className="flex items-center gap-1.5">
              <Icon name="mail" size={8} className="text-text-muted" />
              <span className="text-[11px] text-text-muted truncate">{profile.email}</span>
            </div>
          )}
          {profile?.phone && (
            <div className="flex items-center gap-1.5">
              <Icon name="phone" size={8} className="text-text-muted" />
              <span className="text-[11px] text-text-muted truncate">{profile.phone}</span>
            </div>
          )}
          {profile?.location && (
            <div className="flex items-center gap-1.5">
              <Icon name="map-pin" size={8} className="text-text-muted" />
              <span className="text-[11px] text-text-muted truncate">{profile.location}</span>
            </div>
          )}
          {profile?.summary && (
            <p className="text-[11px] text-text-body leading-relaxed mt-1 line-clamp-2">{profile.summary}</p>
          )}
          {profile?.linkedin && (
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-ember-hover hover:underline block truncate">
              LinkedIn →
            </a>
          )}
        </div>
        {/* Pull the saved profile into THIS document on demand. Explicit (not
            auto) so we never overwrite a doc the user has already edited. */}
        {onProfileChange && (
          <Button size="sm" variant="ghost" className="w-full"
            onClick={() => profile && onProfileChange(profile)}>
            <Icon name="download" size={10} /> {sw ? "Tumia kwenye hati hii" : "Apply to this document"}
          </Button>
        )}
        </div>
      )}
    </div>
  );
}
