// Pure helpers for the WhatsApp worker — no I/O, unit-tested with `node --test`.

/**
 * Pull the text messages out of a Meta "messages" webhook payload.
 * Returns [{ id, from, text }] — non-text messages (images, audio, status
 * callbacks) are dropped.
 */
export function extractTextMessages(body) {
  const out = [];
  const entries = Array.isArray(body?.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const messages = Array.isArray(change?.value?.messages) ? change.value.messages : [];
      for (const m of messages) {
        if (m?.type === "text" && typeof m?.text?.body === "string" && m.text.body.trim()) {
          out.push({ id: String(m.id ?? ""), from: String(m.from ?? ""), text: m.text.body.trim() });
        }
      }
    }
  }
  return out;
}

/**
 * Verify the GET /webhook handshake Meta sends when you register the callback.
 * Returns the challenge string to echo, or null to 403.
 */
export function verifyChallenge(query, verifyToken) {
  if (
    query.get("hub.mode") === "subscribe" &&
    query.get("hub.verify_token") === verifyToken &&
    query.get("hub.challenge")
  ) {
    return query.get("hub.challenge");
  }
  return null;
}

/** A bounded, per-sender rolling transcript kept in memory by the worker. */
export class History {
  constructor(maxTurns = 10, ttlMs = 30 * 60_000) {
    this.maxTurns = maxTurns;
    this.ttlMs = ttlMs;
    this.map = new Map(); // from -> { turns: [{role,content}], seen: Set<id>, at: number }
  }

  _bucket(from) {
    const now = Date.now();
    let b = this.map.get(from);
    if (!b || now - b.at > this.ttlMs) {
      b = { turns: [], seen: new Set(), at: now };
      this.map.set(from, b);
    }
    return b;
  }

  /** True the first time an inbound message id is seen (Meta retries deliveries). */
  isNew(from, id) {
    const b = this._bucket(from);
    if (id && b.seen.has(id)) return false;
    if (id) b.seen.add(id);
    return true;
  }

  get(from) {
    return this._bucket(from).turns.slice();
  }

  push(from, role, content) {
    const b = this._bucket(from);
    b.turns.push({ role, content });
    if (b.turns.length > this.maxTurns) b.turns = b.turns.slice(-this.maxTurns);
    b.at = Date.now();
  }
}
