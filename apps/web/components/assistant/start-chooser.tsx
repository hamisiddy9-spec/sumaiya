"use client";

// The first thing a fresh visitor sees in the assistant — "Unataka nini leo?"
// Four big, tappable cards instead of a blank composer (research: a blank field
// asks a new user to invent the product; low-literacy users freeze). One
// decision, big targets, icon + label, warm not minimal.
//
// It scrolls away with Sumaiya's greeting once the user picks or types.

import { FileText, Mail, Target, MessageCircleQuestion } from "lucide-react";

export type StartChoice = "cv" | "cover-letter" | "apply" | "ask";

const CARDS: {
  choice: StartChoice;
  Icon: typeof FileText;
  tint: string;
  title: { en: string; sw: string };
  desc: { en: string; sw: string };
}[] = [
  {
    choice: "cv",
    Icon: FileText,
    tint: "text-ember bg-ember-tint",
    title: { en: "Make my CV", sw: "Nataka CV" },
    desc: { en: "Answer a few questions or just talk to me", sw: "Jibu maswali machache au sema tu nami" },
  },
  {
    choice: "apply",
    Icon: Target,
    tint: "text-pine bg-pine-tint",
    title: { en: "I found a job — help me apply", sw: "Nina kazi — nisaidie kuomba" },
    desc: { en: "Paste the job, I tailor your CV + write the letter", sw: "Bandika kazi, nalenga CV + naandika barua" },
  },
  {
    choice: "cover-letter",
    Icon: Mail,
    tint: "text-gold-text bg-gold-tint",
    title: { en: "Write a cover letter", sw: "Barua ya kazi" },
    desc: { en: "A strong application letter, from your CV", sw: "Barua ya maombi yenye nguvu, kutoka CV yako" },
  },
  {
    choice: "ask",
    Icon: MessageCircleQuestion,
    tint: "text-espresso bg-sand-2",
    title: { en: "I have a question", sw: "Nina swali" },
    desc: { en: "Career advice, interview help, anything", sw: "Ushauri wa kazi, msaada wa usaili, chochote" },
  },
];

export function StartChooser({
  sw,
  onPick,
}: {
  sw: boolean;
  onPick: (choice: StartChoice) => void;
}) {
  return (
    <div className="pt-1">
      <p className="text-sm font-semibold text-text-muted mb-2.5 px-0.5">
        {sw ? "Unataka nini leo?" : "What do you want today?"}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CARDS.map(({ choice, Icon, tint, title, desc }) => (
          <button
            key={choice}
            onClick={() => onPick(choice)}
            className="group flex items-center gap-3 text-left bg-card border border-border-input rounded-card-lg p-3.5 hover:border-ember hover:bg-ember-tint/20 active:scale-[0.99] transition shadow-sm"
          >
            <span className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${tint}`}>
              <Icon className="w-5 h-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-bold text-espresso leading-tight">
                {sw ? title.sw : title.en}
              </span>
              <span className="block text-xs text-text-body mt-0.5 leading-snug">
                {sw ? desc.sw : desc.en}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
