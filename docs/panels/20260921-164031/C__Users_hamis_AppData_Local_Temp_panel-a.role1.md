# C:\Users\hamis\AppData\Local/Temp/panel-a — role 1
model: nvidia/nemotron-3-ultra-550b-a55b:free
role: a copy editor whose first language is Swahili (Tanzania), ruthless about ambiguity

The user wants me to review the copy in two files for Swahili quality, adherence to owner rules, and clarity. Let me analyze both files carefully.

Owner rules:
1. Guest must FINISH and DOWNLOAD a CV before being asked for an account
2. Premium gates unlock by SHARING (kwa kualika marafiki), not by paying

Let me go through the strings systematically.

First, guest-invite.ts:

GUEST_DELIVERABLE_INVITE:
- title: "Hifadhi CV yako" - "Save your CV" - this is good, imperative
- body: "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika."
  - "nami nitaifadhi" - "and I will save it" - Sumaiya speaking first person, okay
  - "kwa ajili yako" - "for your sake" - a bit formal, "kwako" more natural
  - "itafungua" should be "uweza kuifungua" - wait, it says "utaweza kuifungua" which is correct
  - "haitapotea ikiwa simu hii itaharibika" - "won't get lost if this phone breaks" - good
- accept: "Fungua akaunti bure" - "Open a free account" - "fungua" for account is odd, usually "fungua" is for opening something physical, "unda" or "tenga" for creating account, or "jiandikishe" register yourself. "Fungua akaunti" is a calque from English "open an account"
- later: "Si sasa" - "Not now" - good

GUEST_GATE_ACCEPT: "Fungua akaunti bure" - same issue

GUEST_GATE_CONTINUE: "Jenga CV yako kwanza" - "Build your CV first" - good, clear

GUEST_KEEP_CARD:
- body: "CV zako hizi ziko kwenye simu hii pekee. Akaunti ya bure inazihifadhi salama na kuzifungua kwenye simu nyingine."
  - "CV zako hizi" - "these your CVs" - redundant, "hizi CV zako" better
  - "inazihifadhi salama" - "saves them safely" - "salama" as adverb is odd, "inazihifadhi vizuri" or just "inazihifadhi"
  - "na kuzifungua" - "and open them" - "fungua" again for digital access
- cta: "Hifadhi kwenye akaunti" - "Save in account" - good

GUEST_GATE_COPY entries:

chat:
- title: "Kuzungumza na Sumaiya kunahitaji akaunti" - good
- body: "Mazungumzo yetu yanafanyika kwenye seva zangu, kwa akaunti yako. Fungua akaunti bure tuzungumze — CV zako ulizotengeneza kwenye simu hii zitakuja nawe."
  - "seva zangu" - "my servers" - Sumaiya speaking, okay
  - "Fungua akaunti bure tuzungumze" - "Open free account let's talk" - subjunctive "tuzungumze" after imperative, awkward. Better: "Fungua akaunti bure ili tuzungumze" or "Jiandikishe bure tuzungumze"
  - "zitakuja nawe" - "will come with you" - good

jobs:
- title: "Kulinganisha na kazi kunahitaji akaunti" - "Matching with jobs needs account" - "kulinganisha na kazi" sounds like "matching with jobs" as activity, okay
- body: "Natafuta kazi na kuzilinganisha na wasifu wako kwenye seva zangu. Fungua akaunti bure nami nianze kukulinganisha — CV zako zilizo kwenye simu hii zitakuja nawe."
  - "nami nianze" - "and I start" - subjunctive after imperative, same issue
  - "kukulinganisha" - "to match you" - okay

applications:
- title: "Maombi yako yanaishi kwenye akaunti yako" - "Your applications live in your account" - good
- body: "Maombi uliyotuma, hali yake na barua unazoandika ziko kwenye akaunti yako. Fungua akaunti bure ili kuyafuatilia — CV zako zilizo kwenye simu hii zitakuja nawe."
  - "hali yake" - "its status" - singular for multiple applications? Should be "hali zake"
  - "ili kuyafuatilia" - "to follow them up" - good

import:
- title: "Kusoma faili kunahitaji akaunti" - "Reading file needs account" - good
- body: "Ninasoma picha, PDF na faili
