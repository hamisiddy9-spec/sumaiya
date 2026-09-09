# Agent D — comms / emerging markets / voice / analytics / jobs data

## WhatsApp / Telegram infra
- **WAHA** https://github.com/devlikeapro/waha — self-hosted HTTP/webhook wrapper hiding Baileys/WEBJS/NOWEB behind one REST API, swap engines w/o rewrite. Core MIT (Docker), Plus paid. *Fastest self-hosted WA layer for free tier — but ban risk.*
- **Baileys** https://github.com/WhiskeySockets/Baileys — TS lib speaking WA Web multi-device protocol, no browser. MIT. Engine under most cheap bots; **ban waves intensified 2025–26**, plan Cloud API migration.
- **Evolution API** https://github.com/EvolutionAPI/evolution-api — open REST bundling Baileys + native WA Cloud API + Typebot/Chatwoot/n8n; search interest 6×'d 2025. *Single gateway: start Baileys, flip to official Cloud API later.*
- **WPPConnect** https://github.com/wppconnect-team/wppconnect — higher-level lib + optional REST server w/ session mgmt. MIT.
- **Typebot** https://github.com/baptisteArno/typebot.io — visual conversational-flow builder, runs flows over WhatsApp (via Evolution API). FSL (→Apache after 2y). ~9k★. *Build the structured onboarding/intake (CV questions, job prefs) as a visual flow, not a hand-coded state machine.*
- **Chatwoot** https://github.com/chatwoot/chatwoot — OSS omnichannel support desk (WA/TG/web/email). MIT core, 34k★. *Human-handoff inbox when AI can't help.*
- **grammY** https://github.com/grammyjs/grammY — modern TS-first Telegram framework (most else in TS Telegram is unmaintained). MIT.
- **aiogram** https://github.com/aiogram/aiogram — async Python 3.10+ Telegram. MIT.

⚠️ **WhatsApp risk**: Meta's Jan 15 2026 terms bar 3rd-party AI chatbot distribution on WhatsApp; ban waves hit Baileys/WAHA numbers in weeks. Design the messaging layer to flip to **official Cloud API** with minimal change (WAHA + Evolution both support that path).

## African / emerging-market tooling
- **Africa's Talking SDKs** https://github.com/AfricasTalkingLtd — Node updated Jan 2026 + Py/PHP/Java/.NET. MIT. SMS + USSD + Voice + Airtime + mobile-money, one account. *SMS fallback + USSD entry for feature-phone jobseekers.*
- **Ussd Airflow (ussd_engine)** https://github.com/ussd-airflow/ussd_engine — whole USSD journeys as YAML screens on Django. MIT. *"browse jobs / check application status" over USSD, declaratively.*
- **momo-api (lepresk)** https://github.com/lepresk/momo-api — PHP, MTN MoMo + Airtel Money (collections/disbursements/remittances), Oct 2025. Also ogwok/mtn-momo (Node), a Go client.
- **IntaSend Python SDK** https://github.com/IntaSend/intasend-python — Kenyan aggregator (M-Pesa + card + bank), MIT. Cleaner than raw Daraja.
- **mpesa-api ecosystem** https://github.com/topics/daraja-api — raw Daraja wrappers, mixed maintenance; FastAPI-Daraja healthiest Python.
- **django-pesapal** https://github.com/odero/django-pesapal — Pesapal (pan-EA, covers TZ/UG better than M-Pesa-only). BSD.

## Low-resource speech / NLP (Swahili)
- **Sunbird AI — SALT + Sunflower LLM** https://huggingface.co/Sunbird , https://github.com/SunbirdAI/salt — Kampala non-profit. SALT: multi-way parallel text+speech incl **Swahili** (25k sentences, ~5k w/ audio), CC-BY. Sunflower LLM (30+ Ugandan langs) open Oct 2025. *Swahili parallel data + a locally-relevant open LLM to fine-tune for career chat.*
- **bookbot Swahili TTS/STT** https://huggingface.co/collections/bookbot/swahili-tts — OpenBible_Swahili (verse-aligned audio, MMS forced align, CC-BY-SA) + Swahili G2P + TTS checkpoints. *Ready corpus + TTS starting points for voice-note replies.*
- **Meta MMS mms-tts-swh** https://huggingface.co/facebook/mms-tts-swh — Swahili TTS + 1000-lang ASR. ⚠️ **CC-BY-NC (non-commercial)** — prototype only, don't ship.
- **Whisper Swahili fine-tunes** — PaschalK/whisper-swahili-small, KevKibe LoRA recipe, Microsoft paza-whisper-large-v3-turbo (Kenyan langs). Whisper weights MIT/Apache. *Transcribe Swahili/Sheng WhatsApp voice notes — key input for low-literacy users.*
- **Mozilla Common Voice — Kiswahili** https://commonvoice.mozilla.org — ~500–700+ validated hrs after Mombasa festivals; **CC-0**. *Free training/eval data, no licensing friction.*
- **Masakhane** https://huggingface.co/masakhane — MasakhaNER 2.0 / POS / NEWS, AfroXLMR, IrokoBench (2025 African-lang LLM benchmark). CC-BY/Apache. *Swahili NER (extract skills/employers/locations from messy text) + a benchmark to vet any LLM's Swahili.*

## Analytics / experimentation / flags
- **OpenPanel** https://github.com/Openpanel-dev/openpanel — web + product analytics (events, profiles, funnels, retention, session replay), "Mixpanel + Plausible", lighter self-host than PostHog. AGPL-3.0.
- **GrowthBook** https://github.com/growthbook/growthbook — feature flags + warehouse-native A/B (stats on your own Postgres/BigQuery). MIT, mature. *Flag WhatsApp vs Expo rollout; experiment on onboarding→finished-CV.*
- **OpenFeature** https://openfeature.dev (CNCF) — vendor-neutral flag SDK spec; wrap GrowthBook/Flagsmith/Unleash behind one API. Apache-2.0. *Write flag checks once in Expo + Next, swap backend later.*
- **OpenReplay** https://github.com/openreplay/openreplay — self-hosted session replay + co-browsing. Elastic License 2.0.

## Jobs / hiring / skills open data
- **ESCO** https://esco.ec.europa.eu — EU occupation/skill taxonomy (~3k occ, ~14k skills), free API, O*NET crosswalk. *Normalize free-text Swahili/English skills → stable skill graph for matching + gap analysis.*
- **O*NET** https://services.onetcenter.org — US DoL occupation DB (tasks/skills/context/abilities), CC-BY 4.0. *"what this role involves / what to learn next" content + interview prep.*
- **Arbeitnow API** https://www.arbeitnow.com/api/job-board-api — free no-key ATS-sourced postings w/ remote flag. Also **Adzuna** (free 1k calls/mo, salary histograms), Remotive/RemoteOK. *Seed a live jobs feed; remote roles = realistic near-term for EA jobseekers.*
- **OpenResume** https://github.com/xitanggg/open-resume — OSS resume builder + **browser-local parser + ATS-readability checker**, no signup. AGPL-3.0. *Reference impl for client-side PDF parsing + ATS score.*
- **ATS-Screener (sunnypatell)** https://github.com/sunnypatell/ats-screener — simulates 6 real enterprise ATSes (Workday/Taleo/iCIMS/Greenhouse/Lever/SuccessFactors), pluggable LLM. MIT. *"here's why the robot rejected you" — strong get-hired hook.*
- **ResumeParser (OmkarPathak)** https://github.com/OmkarPathak/ResumeParser — privacy-first, local Qwen2.5-1.5B agentic extraction, offline, zero API cost. *Cheap server-side CV ingestion for free tier.*

⚠️ Copyleft/source-available (self-host OK, multi-tenant resale needs care): Typebot (FSL), OpenReplay (Elastic), OpenPanel/OpenResume (AGPL).
