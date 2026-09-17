# AI memory — disclosure requirements (Tanzania PDPA 2022 + Google Play)

Research, 2026-09-16. Nothing built. Not legal advice — this is what the statute says,
so it can be given to a lawyer as a brief.

## Who governs this
Sumaiya's users are in Tanzania, so **the Personal Data Protection Act No. 11 of 2022**
(PDPA, in force 1 May 2023) is the governing law — not the GDPR. The regulator is the
Personal Data Protection Commission (PDPC).

Under the PDPA, Sumaiya is a **data controller**: it determines the purposes and means of
processing. That brings obligations that are *organisational*, not just copy:

| Obligation | PDPA | Status |
|---|---|---|
| Register as a data controller/processor with the PDPC | Part III | ❌ not done |
| Appoint a Data Protection Officer | s.27(3) | ❌ not done |
| Keep records of processing activities | s.5 | ❌ not done |
| Breach notification within 72 hours | regs | ⚠️ no process |
| Cross-border transfer compliance | Part V | ⚠️ **we send data to DeepSeek abroad** |

## What the memory feature specifically triggers

**1. Notice BEFORE collection (s.23(2))**
> *"Before collecting data, a data controller shall ensure that the data subject is aware of
> (a) the purposes for which the personal data is collected; (b) the fact that collection of
> the personal data is for authorised purposes; and (c) any intended recipients."*

So the disclosure must exist **before** the first episode is recorded — not buried in a policy
nobody opens after the fact. This needs an in-app notice at the moment the coach starts
learning, not only a document.

**2. Disclosure of the LOGIC (s.33(1)(c))**
> *"...where the processing of personal data by automatic means for the purpose of evaluating
> matters relating to him has constituted or is likely to constitute the sole basis for any
> decision significantly affecting him, to be informed ... of the logic involved."*

Career coaching is evaluating matters relating to the person. Whether it is "significantly
affecting" is arguable (no legal or financial effect) — **but the safe and honest reading is to
disclose the logic anyway.** That means explaining, in plain language: what she notices, what
she turns it into, and what she does with it.

**3. Automated decisions (s.36)**
A subject may require that a decision significantly affecting them is not based *solely* on
automated processing, and may require reconsideration. Today the AI only *advises* — it does
not decide anything for the user. That distinction should be **stated explicitly**, because it
is what keeps the app outside the strictest part of s.36.

**4. Access and erasure (s.33, s.38)**
Rights of access, rectification, blocking and **erasure** are statutory. This confirms the gap
I flagged: **a way to see and delete what she knows is legally required, not a nice-to-have.**
`forget()` and `setFact()` already exist in `ai-memory.ts`; they need a surface.

**5. Cross-border transfer (Part V)**
Every message goes to DeepSeek, i.e. personal data leaves Tanzania. The PDPA restricts this.
The user must be told their content is processed abroad, and the transfer needs a lawful basis
and safeguards — not an unmentioned default.

## Google Play (separate, and also mandatory)
- The **Data safety form** must declare collection, sharing, and purposes.
- The **15 July 2026 policy update** states Play's User Data requirements **also apply to
  third-party AI integrations**, and developers stay responsible for limited use, disclosure
  and consent. Our DeepSeek integration is exactly that.
- A privacy policy is required, and target API level compliance by **31 Aug 2026**.

## The copy to add — Privacy Policy (EN/SW)

**EN**
> **What Sumaiya learns about you**
> Sumaiya is a career assistant that gets better at helping you over time. To do that, she keeps
> short notes about your activity — for example, that you checked your CV's ATS score, or that
> you asked about interviews. When the same thing comes up repeatedly, she draws a conclusion
> from it (for example, "this person would benefit from interview practice") so she can help
> before you have to ask.
>
> **Where it is kept.** These notes are stored on your own device. They are not your CV and they
> are not your chat history.
>
> **What she does with it.** She uses these notes only to give you better career advice. She does
> not sell them, and she does not use them for advertising. The advice she gives is a suggestion
> — the decisions are always yours.
>
> **When your content leaves your device.** When you chat with Sumaiya, what you write is sent to
> an AI provider outside Tanzania to generate her reply. By using the assistant you agree to this.
>
> **Your rights.** You can ask to see everything she has noted about you, correct anything that
> is wrong, and delete it. Deleting is permanent. Under Tanzania's Personal Data Protection Act
> 2022 you also have the right to object to this processing.
>
> **Contact.** [support address] — we respond within [X] days.

**SW**
> **Sumaiya anachojifunza kukuhusu**
> Sumaiya ni msaidizi wa kazi anayeboresha usaidizi wake kadiri muda unavyopita. Ili kufanya
> hivyo, anaweka kumbukumbu fupi za matumizi yako — mfano, kwamba ulikagua alama za ATS za CV
> yako, au kwamba uliuliza kuhusu mahojiano. Jambo linalojirudia mara nyingi humfanya afiche
> hitimisho (mfano, "mtu huyu atafaidika na mazoezi ya mahojiano") ili akusaidie kabla hujauliza.
>
> **Wapi zinahifadhiwa.** Kumbukumbu hizi zimehifadhiwa kwenye kifaa chako mwenyewe. Si CV yako
> na si historia ya mazungumzo yako.
>
> **Anatufanyia nini.** Anazitumia tu kukupa ushauri bora wa kazi. Haziuzwi, na hazitumiki kwa
> matangazo. Ushauri anaotoa ni pendekezo — maamuzi ni yako daima.
>
> **Wakati maudhui yako yanatoka kwenye kifaa.** Unapozungumza na Sumaiya, unachoandika
> hutumwa kwa mtoa huduma wa AI nje ya Tanzania ili atengeneze jibu. Kwa kutumia msaidizi
> unakubali hili.
>
> **Haki zako.** Unaweza kuomba kuona kila alichokumbuka kukuhusu, kurekebisha kilichokosea, na
> kukifuta. Kufuta ni kwa kudumu. Chini ya Sheria ya Ulinzi wa Taarifa Binafsi ya Tanzania ya
> 2022 pia una haki ya kupinga usindikaji huu.
>
> **Wasiliana.** [anuani ya msaada] — tunajibu ndani ya siku [X].

## The copy to add — Terms (short)
> Sumaiya's guidance is generated by AI and is **advice, not a decision**. She does not decide
> anything for you — you choose which CV to send and which jobs to apply for. AI can be wrong:
> check anything important before you rely on it.

## What must be built alongside the copy
1. **A pre-collection notice** — shown once, before the first episode is stored (s.23(2)).
2. **"What Sumaiya knows" screen** — view + correct (`setFact`) + delete (`forget`), with an
   "erase everything" action (s.33, s.38).
3. **A named contact** for data requests — a real, monitored address. `sumaiya.app` currently
   has no MX, so today there is nowhere for a legal request to arrive.
4. **Play Data safety form** updated for AI processing + cross-border transfer.

## Honest bottom line
The feature is fine to ship, but three of the obligations have **no implementation at all**
right now — the pre-collection notice, the access/erasure surface, and the controller
registration/DPO. The first two are in-app work I can do; the last is a business filing that
needs you, and it should happen before the app is on Play.
