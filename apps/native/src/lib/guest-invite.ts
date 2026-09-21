/**
 * The account invitation a GUEST sees — and the rule for when they see it.
 *
 * The product principle (owner, standing): "A guest must finish and download
 * before being asked for an account." So this file exists to hold two things
 * in one place:
 *
 *   1. THE COPY, in both languages. Every string below says what signing up
 *      EARNS the person ("keep this CV", "open it on another phone"). None of
 *      them may say "sign in to continue" — a gate that demands an account
 *      before the work is done is the exact failure this whole change fixes.
 *   2. WHEN IT IS ALLOWED TO APPEAR. Once, ever, and only after a deliverable
 *      (a CV saved, or a download taken). `claimGuestInviteOnce()` is the
 *      bookkeeping: it returns true at most one time in the life of the
 *      install, and the flag lives in the same secure store the first-run and
 *      onboarding flags use.
 *
 * Nothing here touches the network: the guest path must work with the phone in
 * aeroplane mode (see lib/local-owner.ts for the same rule on the CV itself).
 *
 * The per-surface gate copy (`GUEST_GATE_COPY`) is the OTHER half of guest mode:
 * the surfaces that genuinely need an account (chat, jobs, applications, file
 * import, invite, courses, the written review). Each one is an honest
 * invitation with a way out — never a dead end, and never a nag: they appear
 * only when the guest actually walks into that surface.
 */
import { getSecureItem, setSecureItem } from "@sumaiya/utils";

/** Secure-store key for "we have already made this offer on this install". */
export const GUEST_INVITE_SEEN_KEY = "guest_account_invite_seen";

/** The same EN/SW pair the whole app's copy is written in. */
export interface GuestCopy {
  en: string;
  sw: string;
}

export type GuestLang = "en" | "sw";

/** Pick the string for the reader's language. Pure — no context needed. */
export function guestText(copy: GuestCopy, lang: GuestLang | string): string {
  return lang === "sw" ? copy.sw : copy.en;
}

/**
 * THE MOMENT: a CV the guest just made, or a download they just took.
 * Title + body + the two buttons, first person for Sumaiya, second person for
 * the reader's own CV (the house voice — see swahili-lint.test.ts).
 */
export const GUEST_DELIVERABLE_INVITE: {
  title: GuestCopy;
  body: GuestCopy;
  accept: GuestCopy;
  later: GuestCopy;
} = {
  title: {
    en: "Keep this CV",
    sw: "Hifadhi CV yako",
  },
  body: {
    en: "Your CV is on this phone only. Create a free account and I'll keep it for you — you can open it on another phone, and it isn't lost if this one breaks.",
    sw: "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika.",
  },
  accept: {
    en: "Create a free account",
    sw: "Fungua akaunti bure",
  },
  later: {
    en: "Not now",
    sw: "Si sasa",
  },
};

/** Shared buttons for the gated surfaces. */
export const GUEST_GATE_ACCEPT: GuestCopy = {
  en: "Create a free account",
  sw: "Fungua akaunti bure",
};

/** The way OUT of a gate: the guest's real work surface, always one tap away. */
export const GUEST_GATE_CONTINUE: GuestCopy = {
  en: "Build my CV instead",
  sw: "Jenga CV yako kwanza",
};

/**
 * The quiet, non-modal offer on the CV list — shown only to a guest who already
 * HAS work worth keeping. It is a standing row, not a prompt: it never
 * interrupts, and the interruption above still happens at most once.
 */
export const GUEST_KEEP_CARD: { body: GuestCopy; cta: GuestCopy } = {
  body: {
    en: "These CVs are on this phone only. A free account keeps them safe and opens them on another phone.",
    sw: "CV zako hizi ziko kwenye simu hii pekee. Akaunti ya bure inazihifadhi salama na kuzifungua kwenye simu nyingine.",
  },
  cta: {
    en: "Keep them safe",
    sw: "Hifadhi kwenye akaunti",
  },
};

/** One id per surface that cannot work without an account. */
export type GuestGateId =
  | "chat"
  | "jobs"
  | "applications"
  | "import"
  | "invite"
  | "courses"
  | "atsVerdict";

/**
 * Why each gated surface needs an account, and what the account EARNS.
 * Every body also names the local path that is still open — that is what makes
 * these invitations rather than walls.
 */
export const GUEST_GATE_COPY: Record<GuestGateId, { title: GuestCopy; body: GuestCopy }> = {
  chat: {
    title: {
      en: "Chat with Sumaiya needs an account",
      sw: "Kuzungumza na Sumaiya kunahitaji akaunti",
    },
    body: {
      en: "Our conversation runs on my servers, against your account. Create a free account and talk to me — the CVs you built on this phone come with you.",
      sw: "Mazungumzo yetu yanafanyika kwenye seva zangu, kwa akaunti yako. Fungua akaunti bure tuzungumze — CV zako ulizotengeneza kwenye simu hii zitakuja nawe.",
    },
  },
  jobs: {
    title: {
      en: "Job matches need an account",
      sw: "Kulinganisha na kazi kunahitaji akaunti",
    },
    body: {
      en: "I search openings and match them to your profile on my servers. Create a free account and I'll start matching — the CVs on this phone come with you.",
      sw: "Natafuta kazi na kuzilinganisha na wasifu wako kwenye seva zangu. Fungua akaunti bure nami nianze kukulinganisha — CV zako zilizo kwenye simu hii zitakuja nawe.",
    },
  },
  applications: {
    title: {
      en: "Applications live in your account",
      sw: "Maombi yako yanaishi kwenye akaunti yako",
    },
    body: {
      en: "The applications you send, their status and the letters you write all live in your account. Create a free account to follow them up — the CVs on this phone come with you.",
      sw: "Maombi uliyotuma, hali yake na barua unazoandika ziko kwenye akaunti yako. Fungua akaunti bure ili kuyafuatilia — CV zako zilizo kwenye simu hii zitakuja nawe.",
    },
  },
  import: {
    title: {
      en: "Reading a file needs an account",
      sw: "Kusoma faili kunahitaji akaunti",
    },
    body: {
      en: "I read photos, PDFs and Word files on my servers so I can rebuild them as a CV. Create a free account to send one over — or build your CV by hand on this phone, no account needed.",
      sw: "Ninasoma picha, PDF na faili za Word kwenye seva zangu ili kuzijenga upya kama CV. Fungua akaunti bure ili kutuma moja — au jenga CV yako kwa mkono kwenye simu hii, bila akaunti.",
    },
  },
  invite: {
    title: {
      en: "Your invite link needs an account",
      sw: "Kiungo chako cha mwaliko kinahitaji akaunti",
    },
    body: {
      en: "The link is tied to your account so I can credit the people you bring. Create a free account to get yours.",
      sw: "Kiungo hicho kimefungwa kwenye akaunti yako ili niweze kuwatambua unaowaleta. Fungua akaunti bure upate chako.",
    },
  },
  courses: {
    title: {
      en: "Courses and progress need an account",
      sw: "Kozi na maendeleo yake yanahitaji akaunti",
    },
    body: {
      en: "The courses, and how far you have got, live in your account so they follow you between phones. Create a free account — the CVs on this phone come with you.",
      sw: "Kozi, na kiwango ulichofikia, ziko kwenye akaunti yako ili zikufuate kwenye simu yoyote. Fungua akaunti bure — CV zako zilizo kwenye simu hii zitakuja nawe.",
    },
  },
  atsVerdict: {
    title: {
      en: "The written review needs an account",
      sw: "Ushauri wa maandishi unahitaji akaunti",
    },
    body: {
      en: "Written advice on your CV is written on my servers, for your account. Create a free account to read it — the score and the checks here are already on this phone.",
      sw: "Ushauri wa maandishi kuhusu CV yako unatengenezwa kwenye seva zangu, kwa akaunti yako. Fungua akaunti bure ili kuusoma — alama na ukaguzi ulio hapa ziko kwenye simu hii tayari.",
    },
  },
};

/** The bit of the secure store this module needs — injectable so the
 *  once-only rule is testable without a device keychain. */
export interface InviteStore {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
}

export const defaultInviteStore: InviteStore = {
  get: getSecureItem,
  set: (key, value) => setSecureItem(key, value),
};

/**
 * True at most ONCE in the life of the install, and it records the offer as
 * made the moment it says yes — the caller shows it immediately after.
 *
 * Two failure modes, both deliberate:
 *   - The store cannot be READ: return false. We cannot tell whether this
 *     person has already been asked, and asking the same question on every
 *     download is worse than never asking.
 *   - The store cannot be WRITTEN: still return true, and show it. The user
 *     gets the offer they have earned; if the write is broken they may see it
 *     once more later. That is the better error for a promise that is about
 *     the user keeping their work.
 */
export async function claimGuestInviteOnce(
  store: InviteStore = defaultInviteStore,
): Promise<boolean> {
  try {
    const seen = await store.get(GUEST_INVITE_SEEN_KEY);
    if (seen === "true") return false;
  } catch {
    return false;
  }
  try {
    await store.set(GUEST_INVITE_SEEN_KEY, "true");
  } catch {
    /* shown anyway — see the doc comment above */
  }
  return true;
}
