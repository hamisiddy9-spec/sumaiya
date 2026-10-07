# C:\Users\hamis\AppData\Local/Temp/panel-a — role 2
model: nvidia/nemotron-3-ultra-550b-a55b:free (rotated from ling-3.0-flash-vl:free)
role: a tired reader on a cheap phone who reads Swahili as a second language

The user wants me to review the copy in two files: `account-gate.tsx` and `guest-invite.ts`. I need to check for violations of two owner rules:
1. A guest must FINISH and DOWNLOAD a CV before being asked for an account.
2. Premium gates unlock by SHARING (kwa kualika marafiki), not by paying.

I also need to check Swahili quality: wrong, cold, calque, ambiguous, reads wrong for a non-native speaker.

I'll go through the strings in both files.

First, `guest-invite.ts`:

**GUEST_DELIVERABLE_INVITE** (shown after deliverable - CV saved or downloaded)
- Title: "Keep this CV" / "Hifadhi CV yako" - Good. "Hifadhi" is standard.
- Body EN: "Your CV is on this phone only. Create a free account and I'll keep it for you — you can open it on another phone, and it isn't lost if this one breaks."
- Body SW: "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika."
  - "Fungua akaunti bure" - "Open a free account" - okay but "fungua" for account is a bit calque from "open an account". "Jenga akaunti" or "fungua" is used but "fungua" is common in fintech. Acceptable.
  - "nami nitaifadhi kwa ajili yako" - "and I will keep it for you" - "nami" = "and I". A bit colloquial but okay.
  - "haitapotea ikiwa simu hii itaharibika" - "won't get lost if this phone breaks" - good.
- Accept: "Create a free account" / "Fungua akaunti bure" - same as above.
- Later: "Not now" / "Si sasa" - good.

**GUEST_GATE_ACCEPT**: "Create a free account" / "Fungua akaunti bure" - repeated.

**GUEST_GATE_CONTINUE**: "Build my CV instead" / "Jenga CV yako kwanza" - "Build your CV first" - good. "Kwanza" implies priority.

**GUEST_KEEP_CARD**: 
- Body EN: "These CVs are on this phone only. A free account keeps them safe and opens them on another phone."
- Body SW: "CV zako hizi ziko kwenye simu hii pekee. Akaunti ya bure inazihifadhi salama na kuzifungua kwenye simu nyingine."
  - "Akaunti ya bure" - "Account of free" - should be "Akaunti bure" or "Akaunti ya bure" is okay but "Akaunti bure" is more natural.
  - "inazihifadhi salama" - "keeps them safe" - "salama" as adverb? "inazihifadhi kwa usalama" better. "Inazihifadhi" alone implies safety.
  - "na kuzifungua kwenye simu nyingine" - "and to open them on another phone" - good.
- CTA: "Keep them safe" / "Hifadhi kwenye akaunti" - "Keep in account" - a bit terse. "Hifadhi kwa usalama" or "Hifadhi kwenye akaunti" is okay.

**GUEST_GATE_COPY** per surface:

1. **chat**:
   - Title: "Chat with Sumaiya needs an account" / "Kuzungumza na Sumaiya kunahitaji akaunti" - Good.
   - Body EN: "Our conversation runs on my servers, against your account. Create a free account and talk to me — the CVs you built on this phone come with you."
   - Body SW: "Mazungumzo yetu yanafanyika kwenye seva zangu, kwa akaunti yako. Fungua akaunti bure tuzungumze — CV zako ulizotengeneza kwenye simu hii zitakuja nawe."
     - "yanafanyika kwenye seva zangu" - "happen on my servers" - okay.
     - "kwa akaunti yako" - "with/for your account" - a bit dangling. "kwenye akaunti yako" better.
     - "Fungua akaunti bure tuzungumze" - "Open free account let's talk" - subjunctive "tuzungumze" after command. Should be "Fungua akaunti bure uze tuzungumze" or "Fungua akaunti bure, kisha tuzungumze". "Tuzungumze" is subjunctive/imperative plural. "Fungua... uze tuzungumze" (open... so that we talk). Current reads like "Open account [and] we talk" - comma splice.
     - "CV zako ulizotengeneza" - "CVs you built" - "ulizo" is relative past. Good.
     - "zitakuja nawe" - "will come with you" - good
