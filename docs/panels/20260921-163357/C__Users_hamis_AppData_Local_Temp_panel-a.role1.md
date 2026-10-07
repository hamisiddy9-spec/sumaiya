# C:\Users\hamis\AppData\Local/Temp/panel-a — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity

The user wants me to review the copy in two files: `account-gate.tsx` and `guest-invite.ts`. I need to check for violations of two owner rules:
1. A guest must be able to FINISH and DOWNLOAD a CV before being asked for an account.
2. Premium gates unlock by SHARING (kwa kualika marafiki), not by paying.

I also need to check Swahili quality: wrong, cold, calque, ambiguous, reads wrong, non-native would reread.

Let me analyze the copy strings.

First, `guest-invite.ts`:

**GUEST_DELIVERABLE_INVITE** (shown after CV saved/downloaded)
- Title: "Keep this CV" / "Hifadhi CV yako" - Good.
- Body EN: "Your CV is on this phone only. Create a free account and I'll keep it for you — you can open it on another phone, and it isn't lost if this one breaks."
- Body SW: "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika."
  - "nami nitaifadhi" - "and I will keep it". Sumaiya is the persona. Okay.
  - "kwa ajili yako" - standard but slightly formal. "Kwa niaba yako" maybe? No, "kwa ajili yako" is fine.
  - "haitapotea ikiwa simu hii itaharibika" - good.
- Accept: "Create a free account" / "Fungua akaunti bure" - Good.
- Later: "Not now" / "Si sasa" - Good.

**GUEST_GATE_ACCEPT**: "Create a free account" / "Fungua akaunti bure" - Consistent.

**GUEST_GATE_CONTINUE**: "Build my CV instead" / "Jenga CV yako kwanza"
- EN: "Build my CV instead" (first person)
- SW: "Jenga CV yako kwanza" (imperative "Build your CV first")
- Mismatch in person. EN is "my", SW is "yako" (your). The user is the one building. "Jenga CV yangu kwanza" would match "my". But "Jenga CV yako kwanza" sounds like instruction to someone else. Actually, the button is for the guest to tap. "Jenga CV yako" = "Build your CV". That's fine for a CTA. "Kwanza" = "first". "Build your CV first" implies sequence. "Instead" implies alternative. "Kwanza" doesn't capture "instead". Better: "Jenga CV yako badala yake" (too long). "Endelea kujenga CV yako" (Continue building your CV). "Jenga CV yako" alone is okay. "Kwanza" feels off. "Build my CV instead" -> "Jenga CV yangu badala yake" (clunky). "Nijenge CV" (Build me a CV - no). "Jenga CV yangu" (Build my CV). The SW says "Jenga CV yako kwanza" (Build your CV first). This is a calque of "Build your CV first" not "Build my CV instead". The meaning shifts.

**GUEST_KEEP_CARD**:
- Body EN: "These CVs are on this phone only. A free account keeps them safe and opens them on another phone."
- Body SW: "CV zako hizi ziko kwenye simu hii pekee. Akaunti ya bure inazihifadhi salama na kuzifungua kwenye simu nyingine."
  - "CV zako hizi" - "These CVs of yours". Good.
  - "inazihifadhi salama" - "keeps them safe". "Salama" is adverb? "Inazihifadhi vizuri" or just "inazihifadhi". "Salama" means safe/peaceful. "Inazihifadhi salama" sounds like "keeps them safely". Acceptable but slightly off. "Inazihifadhi kwa usalama" better. Or "Inazihifadhi, hazipotei".
  - "na kuzifungua kwenye simu nyingine" - "and to open them on another phone". Good.
- CTA: "Keep them safe" / "Hifadhi kwenye akaunti"
  - EN: "Keep them safe"
  - SW: "Hifadhi kwenye akaunti" (Save/Keep in account). Loses "safe". "Hifadhi salama" weird. "Hifadhi kwa usalama". "Hifadhi kwenye akaunti" is functional but loses the benefit word "safe".

**GUEST_GATE_COPY** (per surface):

1. **chat**:
   - Title: "Chat with Sumaiya needs an account" / "Kuzungumza na Sumaiya kunahitaji akaunti" - Good.
   - Body EN: "Our conversation runs on my servers, against your account. Create a free account and talk to me — the CVs you built on this phone come with
