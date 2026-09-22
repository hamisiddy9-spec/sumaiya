# apps/native/src/lib/guest-invite.ts — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity

The user wants me to act as a Swahili (Tanzania) copy editor and evaluate the copy in the provided TypeScript file against the owner's rule: "A guest must finish and download before being asked for an account."

I need to check:
1. Where the copy breaks that rule (asks for account before finish/download)
2. Whether the same button reads the same way every time
3. Wording issues: ambiguity, wrong reads, non-native rereads
4. Quote exact strings

I must answer in the exact format specified.

Let me analyze the copy:

**GUEST_DELIVERABLE_INVITE** - This appears after a CV is made or download taken. This seems correct per the rule.

Title: "Keep this CV" / "Hifadhi CV yako"
Body: "Your CV is on this phone only. Create a free account and I'll keep it for you — you can open it on another phone, and it isn't lost if this one breaks." / "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika."
Accept: "Create a free account" / "Fungua akaunti bure"
Later: "Not now" / "Si sasa"

**GUEST_GATE_ACCEPT** - Shared buttons for gated surfaces: "Create a free account" / "Fungua akaunti bure"

**GUEST_GATE_CONTINUE** - Way out: "Build my CV instead" / "Jenga CV yako kwanza"

**GUEST_KEEP_CARD** - Quiet offer on CV list for guests who have work worth keeping.

**GUEST_GATE_COPY** - For surfaces that genuinely need an account (chat, jobs, applications, import, invite, courses, atsVerdict). These appear when guest walks into that surface.

Now, checking the rule: "A guest must finish and download before being asked for an account."

The GUEST_DELIVERABLE_INVITE is shown after a deliverable (CV saved or download taken) - this follows the rule.

The GUEST_GATE_COPY surfaces are for features that genuinely need an account (chat, jobs, etc.) - these appear when the guest "actually walks into that surface." This seems to follow the rule - they're not blocked from finishing/downloading a CV, they're blocked from features that require an account.

But wait - the question asks: "Where does the copy break that rule?" I need to find if any copy implies account needed before finish/download.

Looking at GUEST_GATE_COPY for "import": "Reading a file needs an account" / "Kusoma faili kunahitaji akaunti" - but the body says "or build your CV by hand on this phone, no account needed." So there's an alternative.

For "chat": "Chat with Sumaiya needs an account" - but this is a separate feature, not CV building.

The rule is about the CV creation flow. The gates are for other features.

But the question says: "A first-time user with no account meets these strings." So I need to see if any string appears before finish/download.

The code comment says: "THE MOMENT: a CV the guest just made, or a download they just took." So GUEST_DELIVERABLE_INVITE is after.

The GUEST_GATE_COPY appears when guest "actually walks into that surface" - so if they try to use chat before finishing CV, they'd see it. But the rule is "must be able to FINISH and DOWNLOAD before being asked for an account." So if they can finish and download CV without hitting these gates, it's fine.

But the copy itself - does any string say "sign in to continue" or similar? The comment says: "None of them may say 'sign in to continue' — a gate that demands an account before the work is done is the exact failure this whole change fixes."

Let me check each string for that pattern.

GUEST_DELIVERABLE_INVITE accept: "Create a free account" - not "sign in to continue"
GUEST_GATE_ACCEPT: "Create a free account" - same
GUEST_GATE_CONTINUE: "Build my CV instead" / "Jenga CV yako kwanza" - this is the escape hatch

GUEST_GATE_COPY bodies all mention the alternative or what comes with account.

Now, Swahili wording issues:

1. "Fungua akaunti bure" - "Open a free account" - "Fungua" means "open", but for account creation, "fungua" is used but "unda" (create) or "fungua" is common. "Fungua akaunti" is standard for "open an account". But "bure" means free. Okay.

2. "Hifadhi CV yako" - "Hifadhi" is imperative "Save/Keep". Good.

3. "Jenga CV yako kwanza" - "Build your CV first". "Kwanza" means first. Good.

4. In GUEST_DELIVERABLE_INVITE body Swahili: "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua k
