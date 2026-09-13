// Sumaiya WhatsApp worker.
//
// Runs anywhere Node 20 runs (Render, Fly, Railway, a small VM). It owns the
// Meta Cloud API webhook + send; it forwards every inbound text to the Sumaiya
// API (POST /api/whatsapp/turn) and relays the reply. No DB, no model here.
//
// Env (see .env.example):
//   PORT                    default 8080
//   WHATSAPP_VERIFY_TOKEN   the string you type into the Meta webhook config
//   WHATSAPP_TOKEN          Cloud API access token (System User, permanent)
//   WHATSAPP_PHONE_ID       the phone-number id from the WhatsApp API setup
//   SUMAIYA_API_URL         e.g. https://www.templatehub.pro
//   WHATSAPP_WORKER_SECRET  shared secret; must match the web env of the same name
//   GRAPH_VERSION           default v21.0

import { createServer } from "node:http";
import { extractTextMessages, verifyChallenge, History } from "./handler.mjs";

const PORT = Number(process.env.PORT ?? 8080);
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "";
const WA_TOKEN = process.env.WHATSAPP_TOKEN ?? "";
const PHONE_ID = process.env.WHATSAPP_PHONE_ID ?? "";
const API_URL = (process.env.SUMAIYA_API_URL ?? "").replace(/\/$/, "");
const WORKER_SECRET = process.env.WHATSAPP_WORKER_SECRET ?? "";
const GRAPH = process.env.GRAPH_VERSION ?? "v21.0";

const history = new History();

function configOk() {
  return VERIFY_TOKEN && WA_TOKEN && PHONE_ID && API_URL && WORKER_SECRET;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function sendMessage(to, text) {
  const res = await fetch(`https://graph.facebook.com/${GRAPH}/${PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text.slice(0, 4000) },
    }),
  });
  if (!res.ok) console.error("[wa] send failed", res.status, await res.text().catch(() => ""));
}

async function askSumaiya(waId, text) {
  const res = await fetch(`${API_URL}/api/whatsapp/turn`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WORKER_SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ waId, text, history: history.get(waId) }),
  });
  const json = await res.json().catch(() => null);
  return json?.reply ?? null;
}

async function handleInbound(body) {
  for (const msg of extractTextMessages(body)) {
    if (!msg.from || !history.isNew(msg.from, msg.id)) continue;
    try {
      const reply = await askSumaiya(msg.from, msg.text);
      if (reply) {
        history.push(msg.from, "user", msg.text);
        history.push(msg.from, "assistant", reply);
        await sendMessage(msg.from, reply);
      }
    } catch (err) {
      console.error("[wa] turn failed", err);
    }
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, configured: configOk() }));
  }

  if (req.method === "GET" && url.pathname === "/webhook") {
    const challenge = verifyChallenge(url.searchParams, VERIFY_TOKEN);
    if (challenge) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end(challenge);
    }
    res.writeHead(403);
    return res.end("forbidden");
  }

  if (req.method === "POST" && url.pathname === "/webhook") {
    // Ack Meta immediately (they retry on any non-2xx / slow response), then
    // process out of band.
    res.writeHead(200);
    res.end("ok");
    try {
      const raw = await readBody(req);
      if (configOk() && raw) await handleInbound(JSON.parse(raw));
    } catch (err) {
      console.error("[wa] webhook parse failed", err);
    }
    return;
  }

  res.writeHead(404);
  res.end("not found");
});

server.listen(PORT, () => {
  console.log(`[wa] worker on :${PORT} — configured: ${configOk()}`);
  if (!configOk()) console.log("[wa] missing env — running in health-only mode");
});
