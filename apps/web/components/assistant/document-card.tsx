"use client";

// T5 · The document card, and the shell every rich message uses — the web half
// of §3.2/§3.4.
//
// A produced document used to read as "a rich message bubble": the live client
// rendered `CvReadyCard` straight into the transcript with nothing to say what
// it was, and the editor handoff carried no identity. The card has a **tinted
// header band** (`KADI YA HATI` left, state right) that no bubble has — which is
// what stops it reading as a chat message — the object's name, one sentence
// stating what she used and what she could not find, and a state line in the
// footer.
//
// §3.6b's reconciliation is applied rather than left as a conflict: a static
// content block is white + 1 px border with **no resting shadow** (`shadow.card`
// belongs to the floating layer).
//
// Motion (move 4): 220 with `scale .985→1` and a 6 px rise, transform only, and
// collapsed by the app-wide reduced-motion net.

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { CVData } from "@/types";
import { MOTION } from "@/lib/motion";
import { CHAT_MOTION } from "@/lib/assistant/chat-motion";

export function DocumentCard({
  stateLabel,
  children,
  footer,
  sw = true,
}: {
  stateLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
  sw?: boolean;
}) {
  return (
    <div
      className="w-full mt-2"
      style={{ animation: `chatCardPlace ${CHAT_MOTION.documentCard.enter}ms ${MOTION.ease.out}` }}
    >
      <style>{`@keyframes chatCardPlace { from { opacity: 0; transform: translateY(${CHAT_MOTION.documentCard.distance}px) scale(${CHAT_MOTION.documentCard.scaleFrom}) } to { opacity: 1; transform: none } }`}</style>
      <div className="flex items-center justify-between gap-2 bg-border rounded-t-[18px] px-3.5 py-[7px]">
        <span className="text-[10.5px] font-extrabold tracking-[0.08em] text-text-muted">
          {sw ? "KADI YA HATI" : "DOCUMENT CARD"}
        </span>
        {stateLabel ? (
          <span className="text-[10.5px] font-extrabold tracking-[0.08em] text-text-muted">{stateLabel.toUpperCase()}</span>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="-mt-px border border-t-0 border-border rounded-b-[18px] bg-pine-tint/60 px-3.5 py-2 space-y-1">{footer}</div>
      ) : null}
    </div>
  );
}

export function DocumentStateLine({ saved, sw = true, offlineSafe = true }: { saved: boolean; sw?: boolean; offlineSafe?: boolean }) {
  if (!saved) {
    return (
      <p className="text-[11.5px] text-text-muted">
        {sw ? "Bado hakuna kilichohifadhiwa — pakua, au ingia kuhifadhi." : "Nothing saved yet — download it, or sign in to save it."}
      </p>
    );
  }
  return (
    <>
      <p className="text-[12px] font-bold text-pine flex items-center gap-1.5">
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
        {sw ? "Imehifadhiwa kwenye CV zako" : "Saved to your CVs"}
      </p>
      {offlineSafe ? <p className="text-[11px] text-text-muted">{sw ? "Inatumika bila mtandao" : "Works without internet"}</p> : null}
    </>
  );
}

/**
 * The provenance sentence: **what she used and what she could not find**. It is
 * computed from the CV's own fields, never written by hand — the difference
 * between a document you are handed and one you can check.
 */
export function cvProvenanceSentence(cv: CVData | undefined, sw: boolean): string {
  const p = cv?.personal;
  const experience = cv?.experience ?? [];
  const skills = cv?.skills ?? [];
  const education = cv?.education ?? [];
  const used: string[] = [];
  const missing: string[] = [];

  const L = (en: string, swWord: string) => (sw ? swWord : en);
  if (p?.fullName?.trim()) used.push(L("name", "jina"));
  else missing.push(L("name", "jina"));
  if (cv?.summary?.trim()) used.push(L("summary", "muhtasari"));
  if (experience.length) {
    const sales = experience.some((e) => /mauzo|sales|huduma kwa mteja|customer/i.test(`${e.position ?? ""} ${e.description ?? ""}`));
    used.push(sales ? L("sales experience", "uzoefu wa mauzo") : L("work experience", "uzoefu wa kazi"));
  } else missing.push(L("work experience", "uzoefu wa kazi"));
  if (skills.length) used.push(`${L("skills", "ujuzi")} ${skills.length}`);
  else missing.push(L("skills", "ujuzi"));
  if (education.length) used.push(L("education", "elimu"));
  if (!p?.phone?.trim()) missing.push(L("phone number", "namba ya simu"));
  if (!p?.email?.trim()) missing.push(L("email", "barua pepe"));

  const usedPart = sw ? `Nilichotumia: ${used.join(", ")}.` : `What I used: ${used.join(", ")}.`;
  const missingPart = missing.length
    ? sw
      ? `Nilichokosa: ${missing.join(", ")}.`
      : `What I couldn't find: ${missing.join(", ")}.`
    : sw
      ? "Sikukosa kitu muhimu."
      : "I didn't miss anything important.";
  return `${usedPart} ${missingPart}`;
}
