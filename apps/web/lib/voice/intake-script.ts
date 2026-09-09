// The guided voice-intake script — the questions Sumaiya asks, out loud, to
// build a first CV hands-free. Pure data. Ordered; `optional` questions can be
// skipped with one tap. Mirrors the conversational gather in the assistant
// (role first, then experience/education/skills, contact last) but as discrete
// prompts so a spoken flow stays on rails.

export interface IntakeQuestion {
  id: string;
  /** Spoken + shown. */
  prompt: { en: string; sw: string };
  /** A one-line hint under the prompt. */
  hint?: { en: string; sw: string };
  optional?: boolean;
}

export const VOICE_INTAKE: IntakeQuestion[] = [
  {
    id: "role",
    prompt: {
      en: "What kind of job or role are you aiming for?",
      sw: "Unalenga kazi au nafasi gani?",
    },
  },
  {
    id: "experience",
    prompt: {
      en: "Tell me about your work so far — where you worked, your role, and one thing you did.",
      sw: "Nieleze kazi zako hadi sasa — ulikofanya kazi, nafasi yako, na jambo moja ulilofanya.",
    },
    hint: {
      en: "Student or fresh graduate? Talk about an attachment, internship, project or volunteering.",
      sw: "Mwanafunzi au umehitimu karibuni? Zungumzia mafunzo kwa vitendo, kujitolea au mradi.",
    },
  },
  {
    id: "education",
    prompt: {
      en: "What did you study, and where?",
      sw: "Ulisoma nini, na wapi?",
    },
  },
  {
    id: "skills",
    prompt: {
      en: "What are you good at? List your main skills.",
      sw: "Una ujuzi gani? Taja ujuzi wako mkuu.",
    },
  },
  {
    id: "achievements",
    prompt: {
      en: "Anything you're proud of — an award, a result, something you improved?",
      sw: "Kuna kitu unajivunia — tuzo, matokeo, kitu ulichoboresha?",
    },
    optional: true,
  },
  {
    id: "name",
    prompt: {
      en: "What's your full name?",
      sw: "Jina lako kamili ni nani?",
    },
  },
  {
    id: "contact",
    prompt: {
      en: "Your phone number, email, and the town or city you're in.",
      sw: "Namba yako ya simu, barua pepe, na mji unaoishi.",
    },
  },
];

/** Assemble the answers into the transcript /api/ai/build-cv expects. */
export function buildTranscript(
  answers: Record<string, string>,
  lang: "en" | "sw",
): string {
  const lines: string[] = [];
  for (const q of VOICE_INTAKE) {
    const a = answers[q.id]?.trim();
    if (!a) continue;
    lines.push(`${q.prompt[lang]}\n${a}`);
  }
  return lines.join("\n\n");
}
