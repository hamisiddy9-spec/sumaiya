# Cost of "perfect voice" for Sumaiya

Analysis, 2026-09-16. Nothing built. Rates from published pricing (June–July 2026).

## Usage model (per active user / month)
- **Voice input:** 20 spoken messages/day × ~15 s ≈ **150 minutes/month**
- **Voice output:** ~10 listened replies/day × ~1,200 chars ≈ **360k characters/month**
- Reference: Sumaiya's **text** AI costs ≈ **$0.12/user/month** (see cost-sweet-spot doc)

## Speech-to-text (input) — 150 min/month
| Option | Rate | Cost/user/mo |
|---|---|---|
| **On-device** (Android SpeechRecognizer / `@react-native-voice`) | $0 | **$0.00** |
| AssemblyAI Universal-2 | $0.0025/min | $0.38 |
| OpenAI gpt-4o-mini-transcribe | $0.003/min | $0.45 |
| Google Chirp V2 (batch) | $0.004/min | $0.60 |
| Deepgram Nova-3 | $0.0077/min | $1.16 |
| Google V2 Standard | $0.016/min | $2.40 |

## Text-to-speech (output) — 360k chars/month
| Option | Rate | Cost/user/mo |
|---|---|---|
| **On-device** (`expo-speech` / Android TTS) | $0 | **$0.00** |
| Google WaveNet / Standard | $4/1M (4M free) | **$0.00–1.44** |
| OpenAI TTS | $15/1M | $5.40 |
| Google Neural2 | $16/1M (1M free) | $5.76 |
| Google Chirp 3 HD | $30/1M (1M free) | $10.80 |
| ElevenLabs Flash/Turbo | $60/1M | $21.60 |
| **ElevenLabs v2/v3 ("Rachel")** | $120/1M | **$43.20** |

## The four totals
| Build | Input + output | Per user/mo | vs text AI |
|---|---|---|---|
| **A. Fully on-device** | $0 + $0 | **$0.00** | free |
| **B. Hybrid** (on-device, cloud fallback on low confidence) | ~$0.14 + $0 | **~$0.14** | ~1× |
| **C. Cheap cloud** (AssemblyAI + Google WaveNet) | $0.38 + $1.44 | **$1.82** | ~15× |
| **D. "Perfect" cloud** (OpenAI mini + Chirp 3 HD) | $0.45 + $10.80 | **$11.25** | ~90× |
| **E. Premium voice** (× ElevenLabs Rachel) | $0.45 + $43.20 | **$43.65** | ~360× |

**The entire spread is one decision: does the audio leave the phone?**

## What "perfect" actually requires for Swahili
The market is Swahili-first with routine **code-switching** (Kiswahili ↔ English in one
sentence). That is the hard case, and it is where the free option is weakest:

- **On-device STT** handles clear Swahili; it degrades on code-switching and noisy streets.
- **Whisper-class cloud models** are markedly better on Swahili and mixed speech — which is why
  option A alone will *not* feel "perfect" to your users.

So "perfect" is not a single choice — it is a **hybrid**, and the hybrid is where the value is:

> On-device first (free, offline, instant). Send the clip to a cloud model **only when the
> on-device transcript looks wrong** — low confidence, empty, or far shorter than the audio.
> That pays only for the hard clips, so you get near-cloud accuracy at ~10% of cloud cost.

## The voice quality question (your stated preference)
You chose a **female** voice for voice features. That preference is what makes option E
expensive: ElevenLabs is **7–30× Google's per-character rate**. At $43/user/month it cannot be
the default for a free career app used by thousands.

The affordable way to honour it:
- **Free tier:** on-device TTS (female Swahili voice available) — $0
- **Premium tier:** a good cloud female voice — Google **Chirp 3 HD at $30/1M** ≈ $10.80/user/mo,
  or **Neural2 at $16/1M** ≈ $5.76 — which is defensible *because premium users pay*
- **Reserve ElevenLabs** for a small number of high-value moments (e.g. a premium-only
  "interview practice" mode), not for every reply

## Recommendation
1. **Ship A on the free tier, with B's fallback** — on-device by default, cloud Whisper-class
   only on low-confidence clips. Expect **~$0.10–0.20/user/month**, roughly the same order as
   the text AI. This is the sweet spot.
2. **Gate quality, not basics.** Everyone gets working voice input; better *voice output* is a
   premium feature. That is where the real per-user cost lives.
3. **Do not default to ElevenLabs at scale.** At $43/user/month one viral week becomes a bill
   you cannot pay.

## Two honest caveats
- Rates shift; verify against the providers' pages before committing a budget.
- On-device quality must be **measured on real Tanzanian audio**, not assumed. Before building,
  record ~20 real clips from the target users — clear speech, street noise, and code-switching —
  and run them through on-device vs Whisper. That test decides whether the hybrid is worth the
  complexity or whether on-device alone already clears the bar.
