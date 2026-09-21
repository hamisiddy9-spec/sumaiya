# C:\Users\hamis\AppData\Local/Temp/panel-a — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity

The user wants me to review the copy in two files: `account-gate.tsx` and `guest-invite.ts`. I need to check for violations of two owner rules:
1. Guest must finish/download CV before being asked for account.
2. Premium gates unlock by sharing (kwa kualika marafiki), not by paying.

Also need to check Swahili quality: wrong, cold, calque, ambiguous, reads wrong.

Let me analyze the copy strings.

First, `guest-invite.ts` has the main copy.

**GUEST_DELIVERABLE_INVITE** - shown after CV saved/downloaded
- Title: "Keep this CV" / "Hifadhi CV yako" - Good.
- Body EN: "Your CV is on this phone only. Create a free account and I'll keep it for you — you can open it on another phone, and it isn't lost if this one breaks."
- Body SW: "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika."
  - "nami nitaifadhi" - "and I will keep it". Sumaiya is the AI persona. "nami" = and me. A bit clunky. Better: "fungua akaunti bure, nitaifadhi kwa ajili yako"
  - "kwa ajili yako" - formal, okay.
  - "haitapotea ikiwa simu hii itaharibika" - good.
- Accept: "Create a free account" / "Fungua akaunti bure" - Good.
- Later: "Not now" / "Si sasa" - Good.

**GUEST_GATE_ACCEPT** - shared button
- "Create a free account" / "Fungua akaunti bure" - Good.

**GUEST_GATE_CONTINUE** - way out
- "Build my CV instead" / "Jenga CV yako kwanza" - "Jenga CV yako kwanza" means "Build your CV first". Good, clear.

**GUEST_KEEP_CARD** - quiet card on CV list
- Body EN: "These CVs are on this phone only. A free account keeps them safe and opens them on another phone."
- Body SW: "CV zako hizi ziko kwenye simu hii pekee. Akaunti ya bure inazihifadhi salama na kuzifungua kwenye simu nyingine."
  - "CV zako hizi" - "these CVs of yours". "hizi" agrees with "CV" (N-class plural). Good.
  - "inazihifadhi salama" - "keeps them safe". "salama" as adverb? Usually "inazihifadhi kwa usalama" or just "inazihifadhi". "Salama" is adjective. Slight calque from "keeps them safe". Better: "inazihifadhi vizuri" or just "inazihifadhi".
  - "na kuzifungua" - "and open them". Good.
- CTA: "Keep them safe" / "Hifadhi kwenye akaunti" - "Hifadhi kwenye akaunti" = "Save in account". Not "Keep them safe". Mismatch. EN says "Keep them safe", SW says "Save in account". Different meaning.

**GUEST_GATE_COPY** - per surface gates

1. **chat**
   - Title: "Chat with Sumaiya needs an account" / "Kuzungumza na Sumaiya kunahitaji akaunti" - Good.
   - Body EN: "Our conversation runs on my servers, against your account. Create a free account and talk to me — the CVs you built on this phone come with you."
   - Body SW: "Mazungumzo yetu yanafanyika kwenye seva zangu, kwa akaunti yako. Fungua akaunti bure tuzungumze — CV zako ulizotengeneza kwenye simu hii zitakuja nawe."
     - "yanafanyika" - "happen/take place". Okay.
     - "kwa akaunti yako" - "on/with your account". Okay.
     - "tuzungumze" - subjunctive "let's talk". But it's a command context: "Create account [so that] we talk". Should be "uziungumzie" (you talk to me) or "tuzungumze" (let's talk). "Fungua akaunti bure tuzungumze" reads as "Open free account let's talk". A bit off. Better: "Fungua akaunti bure uziungumzie" or "Fungua akaunti bure ili tuzungumze".
     - "CV zako ulizotengeneza" - "CVs you built". "ulizo-" is relative past. Good.
     - "zitakuja nawe" - "will come with you". Good.

2. **jobs**
   - Title: "Job matches need an account" / "Kulinganisha na kazi kunahitaji akaunti" - "Matching with jobs needs account". Good.
   - Body EN: "I search openings and match
