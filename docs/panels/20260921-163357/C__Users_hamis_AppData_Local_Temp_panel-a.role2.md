# C:\Users\hamis\AppData\Local/Temp/panel-a — role 2
model: nvidia/nemotron-3-ultra-550b-a55b:free (rotated from ling-3.0-flash-vl:free)
role: a tired reader on a cheap phone who reads Swahili as a second language

The user wants me to review the copy in two files (account-gate.tsx and guest-invite.ts) for violations of two owner rules:
1. A guest must be able to FINISH and DOWNLOAD a CV before being asked for an account
2. Premium gates unlock by SHARING (kwa kualika marafiki), not by paying

And also check for Swahili that is wrong, cold, or a calque (literal translation that doesn't sound natural).

Let me analyze the copy strings in both files.

First, account-gate.tsx has:
- "Account needed" / "Inahitaji akaunti" - title for GuestAccountScreen
- GUEST_GATE_ACCEPT: "Create a free account" / "Fungua akaunti bure"
- GUEST_GATE_CONTINUE: "Build my CV instead" / "Jenga CV yako kwanza"

guest-invite.ts has:
- GUEST_DELIVERABLE_INVITE (after CV saved/downloaded):
  - title: "Keep this CV" / "Hifadhi CV yako"
  - body: "Your CV is on this phone only. Create a free account and I'll keep it for you — you can open it on another phone, and it isn't lost if this one breaks." / "CV yako iko kwenye simu hii pekee. Fungua akaunti bure nami nitaifadhi kwa ajili yako — utaweza kuifungua kwenye simu nyingine, na haitapotea ikiwa simu hii itaharibika."
  - accept: "Create a free account" / "Fungua akaunti bure"
  - later: "Not now" / "Si sasa"

- GUEST_KEEP_CARD (quiet card on CV list):
  - body: "These CVs are on this phone only. A free account keeps them safe and opens them on another phone." / "CV zako hizi ziko kwenye simu hii pekee. Akaunti ya bure inazihifadhi salama na kuzifungua kwenye simu nyingine."
  - cta: "Keep them safe" / "Hifadhi kwenye akaunti"

- GUEST_GATE_COPY for various gates:
  - chat: "Chat with Sumaiya needs an account" / "Kuzungumza na Sumaiya kunahitaji akaunti"
    body: "Our conversation runs on my servers, against your account. Create a free account and talk to me — the CVs you built on this phone come with you." / "Mazungumzo yetu yanafanyika kwenye seva zangu, kwa akaunti yako. Fungua akaunti bure tuzungumze — CV zako ulizotengeneza kwenye simu hii zitakuja nawe."
  
  - jobs: "Job matches need an account" / "Kulinganisha na kazi kunahitaji akaunti"
    body: "I search openings and match them to your profile on my servers. Create a free account and I'll start matching — the CVs on this phone come with you." / "Natafuta kazi na kuzilinganisha na wasifu wako kwenye seva zangu. Fungua akaunti bure nami nianze kukulinganisha — CV zako zilizo kwenye simu hii zitakuja nawe."
  
  - applications: "Applications live in your account" / "Maombi yako yanaishi kwenye akaunti yako"
    body: "The applications you send, their status and the letters you write all live in your account. Create a free account to follow them up — the CVs on this phone come with you." / "Maombi uliyotuma, hali yake na barua unazoandika ziko kwenye akaunti yako. Fungua akaunti bure ili kuyafuatilia — CV zako zilizo kwenye simu hii zitakuja nawe."
  
  - import: "Reading a file needs an account" / "Kusoma faili kunahitaji akaunti"
    body: "I read photos, PDFs and Word files on my servers so I can rebuild them as a CV. Create a free account to send one over — or build your CV by hand on this phone, no account needed." / "Ninasoma picha, PDF na faili za Word kwenye seva zangu ili kuzijenga upya kama CV. Fungua akaunti bure ili kutuma moja — au jenga CV yako kwa mkono kwenye simu hii, bila akaunti."
  
  - invite: "Your invite link needs an account" / "Kiungo chako cha mwaliko kinahitaji akaunti"
    body: "The link is tied to your account so I can credit the people you bring. Create a free account to get yours." / "Kiungo hicho kimefungwa kwenye akaunti yako ili niweze kuwatambua unaowaleta. Fungua akaunti bure upate chako."
  
  - courses: "Courses and progress need an account" / "Kozi na maendeleo yake yanahitaji akaunti"
    body: "The courses, and how far you have got, live in your account so they follow you between phones. Create a free account — the CVs on this phone come with you
