# Sumaiya WhatsApp worker

A tiny Node 20 service (no dependencies) that connects a WhatsApp Business number
to Sumaiya. It owns the Meta Cloud API webhook and the outbound send; it forwards
every inbound text to `POST /api/whatsapp/turn` on the web app and relays the
reply. No database, no model here.

```
GET  /health    -> { ok, configured }
GET  /webhook   -> Meta verification handshake
POST /webhook   -> inbound messages (acked immediately, processed out of band)
```

## Run locally

```bash
cp .env.example .env   # fill it in
npm start
npm test               # node --test, no install
```

Without a full env it starts in **health-only mode** — safe to deploy before the
Meta side is ready.

## Provisioning (your tasks)

1. **Meta app** — create an app at developers.facebook.com, add the **WhatsApp**
   product. Note the **Phone number ID** and a temporary token (API Setup tab).
2. **Deploy this worker** — Render / Railway / Fly / a small VM. Set the env
   from `.env.example`. `SUMAIYA_API_URL` is your deployed web app;
   `WHATSAPP_WORKER_SECRET` must match the value you set on the **web** app's
   env (`WHATSAPP_WORKER_SECRET`) and `WHATSAPP_AI_PER_DAY` (optional) caps free
   replies per sender per day.
3. **Webhook** — in the Meta app, WhatsApp → Configuration → Callback URL
   `https://<worker-host>/webhook`, Verify token = `WHATSAPP_VERIFY_TOKEN`.
   Subscribe to the **messages** field.
4. **Permanent token** — create a System User in Business Settings, assign the
   app, generate a non-expiring token, put it in `WHATSAPP_TOKEN`.
5. **Go live** — add a real phone number and submit for review if you want to
   message users who haven't messaged you first (not needed for inbound-first).

## What it does today

Guest-mode career coaching over WhatsApp — CV / cover-letter / job-search /
interview advice in Swahili or English, bounded per sender per day. It does not
build or export documents (it points users to sumaiya.pro for that). Account
linking (a code texted from inside the app) is a later addition.
