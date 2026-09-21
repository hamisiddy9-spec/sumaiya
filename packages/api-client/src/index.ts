// API Client — shared across web and mobile.
//
// Talks to the Next backend's Hono API (`app/api/[[...route]]/route.ts`), which
// authenticates via `Authorization: Bearer <supabase access token>` (see
// `lib/api/auth.ts#getAuthUser`). Auth itself is handled directly against
// Supabase GoTrue in the mobile app (apps/mobile/src/lib/supabase.ts +
// contexts/auth-context.tsx); the session's access token is pushed here via
// setAccessToken() and attached to every request below.
//
// The Hono routes wrap their payloads in `{ success: true, data: ... }` — the
// `request()` helper unwraps that automatically.

import type { CV, CVData, Template, Lang } from "@sumaiya/types";
import { TEMPLATES } from "@sumaiya/templates";
// Subpath import on purpose: the package barrel pulls in offline-storage
// (expo-sqlite), which neither the web build nor jest can resolve.
import { toNativeCvData, toStoredCvData } from "@sumaiya/utils/cv-shape";
// The chat's job picker (see ./job-pick.ts). Imported as well as re-exported,
// because `export *` at the bottom of this file creates no local bindings.
import { buildPickListUrl, buildPickRowUrl } from "./job-pick";

/**
 * JSON has no date type — `createdAt`/`updatedAt` arrive over the wire as ISO
 * strings, while `CV` declares them as `Date`. Nothing converted them, so
 * `offlineStorage.saveCVOffline` hit `cv.createdAt.getTime()` and threw a
 * TypeError on **every** write. The result: nothing was ever cached on the
 * device, offline editing was impossible, the list came back empty on a cold
 * start, and the app had to show "this device couldn't cache them". The SQLite
 * layer was never at fault.
 *
 * Coerce once, here — the single point every CV response passes through.
 */
function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  category: string;
  employmentType: string;
  description: string;
  applyUrl: string;
  sourceName?: string;
  applicationDeadline?: string | null;
  createdAt?: string;
}

export interface JobRecommendation {
  jobId: string;
  /** 0–100 match against the user's profile / CV. */
  score: number;
  reason: string;
  matchedTerms: string[];
  job: JobListing;
}

/** The native app's flat Career Profile — the wire shape for /api/mobile/profile. */
export interface MobileProfile {
  fullName: string;
  headline: string;
  location: string;
  phone: string;
  email: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  goals: string;
  languages: string;
  /** Compressed data URL of the headshot, or "" when unset. */
  photo?: string;
  updatedAt: number;
}

/** A deterministic proactive nudge (mirrors the web signal engine). */
export interface MobileSignal {
  type: string;
  tool: string;
  priority: number;
  title: { en: string; sw: string };
  detail: { en: string; sw: string };
  trigger: string;
  jobId?: string;
  applicationId?: string;
  confirmations?: number;
  /** career.skillGap only — specific missing skill keywords, lowercase. */
  missingSkills?: string[];
}

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  /**
   * Recover from a rejected token. Called at most ONCE per request, after a 401,
   * and must return true only if it applied a fresh token via setAccessToken().
   *
   * Why this belongs here: a 401 was indistinguishable from a dead network at
   * every call site, and the app's own screens then told the user "we couldn't
   * reach the server" — which is false. Worse, retry buttons re-sent the same
   * dead token forever. A 401 whose cause is a stale or not-yet-applied session
   * (cold start: getSession() resolves AFTER the first screen mounts) is
   * recoverable, and the recovery belongs next to the request that fails.
   */
  refreshAuth?: () => Promise<boolean>;
}

export class ApiError extends Error {
  status: number;
  /**
   * Why we have no response, when status is 0. `"timeout"` means WE aborted
   * locally — the server may well still be working (an upload that got past
   * the uplink but not back), which is worth telling the user differently from
   * a transport failure. `"network"` means the request never went out.
   *
   * `"unauthorized"` is the opposite case: the server answered, and it refused
   * our credentials even after a refresh. Callers must NOT report that as a
   * connection problem.
   */
  kind?: "timeout" | "network" | "unauthorized" | "aborted";
  constructor(status: number, message: string, kind?: "timeout" | "network" | "unauthorized" | "aborted") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
  }
}

/**
 * Upload budgets.
 *
 * The client-wide default (30s) is tuned for JSON round-trips. Reads of an
 * uploaded file are NOT that: the request carries a multi-hundred-KB body up a
 * slow uplink, then the server parses it — and for OCR runs tesseract, whose
 * own budget is 60s (server route: OCR_TIMEOUT_MS). A 30s client abort cut the
 * read off mid-flight on perfectly healthy connections, and because the abort
 * has no HTTP status it fell through to the generic "couldn't read that file —
 * check your connection" branch. Users saw a file that simply "can't be read",
 * the model invented a reason for it ("muunganisho ulikataa"), and nothing was
 * logged. These budgets sit ABOVE the server's own limits so the server always
 * gets to answer.
 */
const UPLOAD_TIMEOUT_MS = 120_000; // document upload + parse (server cap 4 MB)
const OCR_TIMEOUT_MS = 90_000; // server OCR budget is 60s — leave headroom

/** Exposed so a test can assert these stay ABOVE the server's own budget. The
 *  whole bug was a client deadline shorter than the work it was waiting on. */
export const UPLOAD_BUDGETS = { upload: UPLOAD_TIMEOUT_MS, ocr: OCR_TIMEOUT_MS } as const;

export class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private accessToken?: string;
  private refreshAuth?: () => Promise<boolean>;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.refreshAuth = config.refreshAuth;
  }

  setAccessToken(token: string) {
    this.accessToken = token || undefined;
  }

  /**
   * Wire up token recovery after construction. The app has exactly ONE
   * ApiClient instance, built before Supabase is touched (see
   * apps/native/src/lib/api-client.ts), so the handler is injected later.
   */
  setRefreshAuth(fn: () => Promise<boolean>) {
    this.refreshAuth = fn;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    /**
     * Per-call deadline. Defaults to the client-wide `timeout` (30s), which is
     * right for a JSON round-trip but WRONG for an upload: the server may spend
     * up to 60s on OCR, so a 30s client abort killed the read mid-flight and
     * surfaced as a bogus "check your connection". Long-running calls pass
     * their own budget (see UPLOAD_TIMEOUT_MS / OCR_TIMEOUT_MS below).
     */
    timeoutMs?: number,
    /** Internal: true on the single retry that follows a recovered 401. */
    authRetry = false
  ): Promise<T> {
    const timeout = timeoutMs ?? this.timeout;
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {};

    // Only default to JSON when we're actually sending a JSON string body.
    const hasStringBody = typeof options.body === "string";
    if (hasStringBody) headers["Content-Type"] = "application/json";

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    // retryAttempts was a config option that did nothing — every call, on any
    // transient network blip, failed outright with no retry at all. Only
    // retry GET (the default when options.method is unset): it's the one
    // method safe to retry blindly. A retried POST/PUT/DELETE risks a
    // duplicate side effect if the first attempt actually reached the server
    // and only the response was lost — GETs have no such risk.
    const method = (options.method ?? "GET").toUpperCase();
    const isRetryable = method === "GET";
    const maxAttempts = isRetryable ? Math.max(1, this.retryAttempts) : 1;

    let response: Response;
    let attempt = 0;
    for (;;) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      // An EXTERNAL abort (the chat's Stop control) must really stop the
      // request: on a metered connection a "stop" that keeps the bytes flowing
      // is worse than no stop at all — the user paid for a reply they cancelled.
      // Composed with our own timeout controller rather than replacing it.
      const external = options.signal;
      let externalAborted = false;
      if (external) {
        if (external.aborted) controller.abort();
        else
          external.addEventListener(
            "abort",
            () => {
              externalAborted = true;
              controller.abort();
            },
            { once: true },
          );
      }
      try {
        response = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(timeoutId);
        break;
      } catch (err) {
        clearTimeout(timeoutId);
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 300 * attempt));
          continue;
        }
        if (err instanceof Error && err.name === "AbortError") {
          // The user's own cancel is not a timeout, and must not be reported as
          // one — it is the one case where nothing went wrong at all.
          if (externalAborted) {
            throw new ApiError(0, "Request stopped.", "aborted");
          }
          throw new ApiError(0, "Request timed out. Check your connection.", "timeout");
        }
        // The real cause (DNS failure, TLS handshake, connection reset…) was
        // being discarded here — every transport failure surfaced to the user
        // and to us as an identical generic message, with no way to tell a
        // dead network apart from, say, a blocked/misconfigured host. Log it
        // before replacing it with the user-facing copy.
        console.error(`[apiClient] ${method} ${url} failed:`, err instanceof Error ? `${err.name}: ${err.message}` : err);
        throw new ApiError(0, "Network error. Check your connection.", "network");
      }
    }

    const text = await response.text();
    let payload: unknown = undefined;
    try {
      payload = text ? JSON.parse(text) : undefined;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      const message =
        (payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : null) ||
        (typeof payload === "string" && payload) ||
        `${response.status} ${response.statusText}`;

      /**
       * A 401 is usually a stale/absent token, not a bad user: on a cold start
       * `supabase.auth.getSession()` resolves AFTER the first screen mounts, so
       * the very first authenticated request can go out with no Authorization
       * header at all — and every "Try again" re-sent the same missing token,
       * so the screen failed identically forever while claiming the server was
       * unreachable.
       *
       * Ask the app to restore/refresh the session, then retry ONCE. If it
       * still refuses, the error is reported as `unauthorized` so callers can
       * say what actually happened.
       */
      if (response.status === 401 && !authRetry && this.refreshAuth) {
        const recovered = await this.refreshAuth().catch(() => false);
        if (recovered) {
          return this.request<T>(endpoint, options, timeoutMs, true);
        }
      }

      throw new ApiError(
        response.status,
        message,
        response.status === 401 ? "unauthorized" : undefined
      );
    }

    // Unwrap Hono's { success, data } envelope when present.
    if (payload && typeof payload === "object" && "data" in payload && "success" in payload) {
      return (payload as { data: T }).data;
    }
    return payload as T;
  }

  // ── CV CRUD (Hono /api/cv) ─────────────────────────────────────────────────

  async listCVs(): Promise<CV[]> {
    const rows = await this.request<CV[]>("/api/cv");
    return (Array.isArray(rows) ? rows : []).map((cv) => this.fromCvResponse(cv));
  }

  async getCV(id: string): Promise<CV> {
    return this.fromCvResponse(await this.request<CV>(`/api/cv/${id}`));
  }

  /**
   * Rows in `cv.data` are written by two different apps with two different
   * field names (`personal`/`jobTitle`/`position` from the web,
   * `personalInfo`/`headline`/`title` from here). Everything that reads a CV
   * goes through this so a web-made CV doesn't arrive looking blank.
   */
  private fromCvResponse(cv: CV): CV {
    if (!cv || typeof cv !== "object") return cv;
    return {
      ...cv,
      // Wire strings → Date. See toDate() above for why this matters.
      createdAt: toDate((cv as unknown as { createdAt?: unknown }).createdAt),
      updatedAt: toDate((cv as unknown as { updatedAt?: unknown }).updatedAt),
      data: toNativeCvData<CVData>((cv as unknown as { data?: unknown }).data),
    };
  }

  async createCV(data: Partial<CV> & { name?: string; clientId?: string }): Promise<CV> {
    const body = this.toCvPayload(data);
    return this.fromCvResponse(
      await this.request<CV>("/api/cv", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
  }

  async updateCV(id: string, data: Partial<CV> & { name?: string }): Promise<CV> {
    const body = this.toCvPayload(data);
    return this.fromCvResponse(
      await this.request<CV>(`/api/cv/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    );
  }

  async deleteCV(id: string): Promise<void> {
    await this.request<void>(`/api/cv/${id}`, { method: "DELETE" });
  }

  /** Idempotent delete keyed by the client's local id (mobile sync queue). */
  async deleteCVByClientId(clientId: string): Promise<void> {
    await this.request<void>(`/api/cv?clientId=${encodeURIComponent(clientId)}`, {
      method: "DELETE",
    });
  }

  private toCvPayload(data: Partial<CV> & { name?: string; clientId?: string }) {
    const { name, title, templateId, data: cvData, clientId } = data as Record<string, unknown>;
    const payload: Record<string, unknown> = {};
    const resolvedTitle = (title as string) || (name as string);
    if (resolvedTitle) payload.title = resolvedTitle;
    if (templateId) payload.templateId = templateId;
    if (cvData && typeof cvData === "object") payload.data = toStoredCvData(cvData);
    if (clientId) payload.clientId = clientId;
    return payload;
  }

  // ── Templates ─────────────────────────────────────────────────────────────
  // The backend has no templates endpoint; the mobile app ships the catalogue
  // locally (works offline). Kept async so callers don't change.

  async getTemplates(lang: Lang = "en"): Promise<Template[]> {
    return TEMPLATES.filter((t) => !t.languages || t.languages.includes(lang));
  }

  async getTemplate(id: string): Promise<Template> {
    const found = TEMPLATES.find((t) => t.id === id);
    if (!found) throw new ApiError(404, `Template ${id} not found`);
    return found;
  }

  // ── OCR (mobile-specific, Hono /api/mobile/ocr) ───────────────────────────
  // Sends the photo as a base64 data URL (what the backend's tesseract route
  // expects) and returns the parsed CVData fields when AI extraction
  // succeeded, or just the raw text when it didn't — callers should treat a
  // missing `fields` as "let the user fill the form in manually", not an error.

  async ocrUpload(imageBase64: string): Promise<{ text: string; data: Partial<CVData> | null }> {
    const result = await this.request<{ text: string; fields: Record<string, unknown> | null }>(
      "/api/mobile/ocr",
      { method: "POST", body: JSON.stringify({ imageBase64 }) },
      OCR_TIMEOUT_MS
    );
    return { text: result.text, data: (result.fields as Partial<CVData> | null) ?? null };
  }

  // ── Career Profile sync (Hono /api/mobile/profile) ───────────────────────
  // The native app owns a flat Career Profile (AsyncStorage). These push it to
  // / pull it from the server Spine so it survives reinstalls, reaches other
  // devices, and feeds job matching + the web assistant.

  async getMobileProfile(): Promise<MobileProfile> {
    return this.request<MobileProfile>("/api/mobile/profile");
  }

  async putMobileProfile(profile: MobileProfile): Promise<{ updatedAt: number }> {
    return this.request<{ updatedAt: number }>("/api/mobile/profile", {
      method: "PUT",
      body: JSON.stringify(profile),
    });
  }

  // Persists the UI language choice server-side so push notifications (sent
  // from a cron job, with no access to this device's local setting) can be
  // composed in the right language. Best-effort — the caller should swallow
  // failures, same as the local setSecureItem write it accompanies.
  async setLangPreference(lang: "en" | "sw"): Promise<void> {
    await this.request<{ success: boolean }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ lang }),
    });
  }

  // ── Proactive signals (Hono /api/mobile/signals) ─────────────────────────
  async getSignals(): Promise<MobileSignal[]> {
    return this.request<MobileSignal[]>("/api/mobile/signals").catch(() => [] as MobileSignal[]);
  }

  // ── Extract text from an uploaded document (Hono /api/tools/extract-text) ──
  // Multipart upload. `file` is what RN's FormData accepts: { uri, name, type }.
  // The server sniffs the bytes (PDF / .docx / RTF / plain text) — it does NOT
  // trust the name or MIME, so a mislabelled file from a share sheet still
  // works. Throws ApiError on a 4xx (old .doc, scanned PDF, unknown type) with
  // a user-facing `.message`.
  async extractDocumentText(file: { uri: string; name: string; type?: string }): Promise<{ text: string; pages?: number }> {
    const form = new FormData();
    // RN FormData file part — cast because DOM's FormData types expect a Blob.
    form.append(
      "file",
      { uri: file.uri, name: file.name || "document", type: file.type || "application/octet-stream" } as unknown as Blob,
    );
    const result = await this.request<{ text: string; pages?: number }>("/api/tools/extract-text", {
      method: "POST",
      body: form,
    }, UPLOAD_TIMEOUT_MS);
    return { text: result.text, pages: result.pages };
  }

  /**
   * Read a document the native app has ALREADY turned into base64.
   *
   * Why this exists instead of the multipart call above: on this React Native
   * version the multipart writer fails to open a `file://` part — the POST
   * never leaves the device and surfaces as a network error, so no document
   * could ever be read from the app (verified on-device: the file was present
   * and readable, the FormData shape was correct, a JSON POST to the same URL
   * succeeded, and the multipart POST failed instantly). The bytes therefore
   * travel as JSON base64, exactly like the OCR route already does.
   */
  async extractDocumentTextBase64(file: {
    base64: string;
    name: string;
    mimeType?: string;
  }): Promise<{ text: string; pages?: number }> {
    const result = await this.request<{ text: string; pages?: number }>(
      "/api/tools/extract-text",
      {
        method: "POST",
        body: JSON.stringify({
          fileBase64: file.base64,
          name: file.name,
          mimeType: file.mimeType,
        }),
      },
      UPLOAD_TIMEOUT_MS,
    );
    return { text: result.text, pages: result.pages };
  }

  /** @deprecated use extractDocumentText — kept for callers not yet migrated */
  async extractPdfText(file: { uri: string; name: string; type?: string }): Promise<{ text: string; pages: number }> {
    const r = await this.extractDocumentText(file);
    return { text: r.text, pages: r.pages ?? 1 };
  }

  // ── Learning + chat (Hono /api/mobile) ────────────────────────────────────

  async getLearningResources(skills: string[] = []): Promise<
    { id: string; title: string; platform: string; url: string; free: boolean }[]
  > {
    const qs = skills.length ? `?skills=${encodeURIComponent(skills.join(","))}` : "";
    return this.request(`/api/mobile/learning/resources${qs}`);
  }

  async sendChatMessage(
    messages: { role: "user" | "assistant"; content: string }[],
    conversationId?: string,
    lang?: "en" | "sw",
    /**
     * Optional external abort — the chat's Stop control. Passed through to the
     * transport so stopping a turn really stops it: the request is cancelled and
     * the bytes stop, which is the whole point on a metered connection.
     */
    signal?: AbortSignal
  ): Promise<{ message: string; conversationId: string | null }> {
    return this.request("/api/mobile/chat", {
      method: "POST",
      body: JSON.stringify({ messages, conversationId, lang }),
      ...(signal ? { signal } : {}),
    });
  }

  /**
   * The provider's own answer about itself — `GET /api/ai/status` →
   * `{configured, provider}`.
   *
   * The chat asks THIS before the user invests a message, rather than guessing
   * from a connectivity flag: "never a connectivity heuristic" (§3.6 of the
   * chatbox redesign). Returns `null` when the probe itself could not be made —
   * which is deliberately NOT the same as "the provider is off": an unplugged
   * phone must not be told the intelligence is unavailable when nobody asked it.
   */
  async getAiStatus(): Promise<{ configured: boolean; provider: string | null } | null> {
    try {
      return await this.request<{ configured: boolean; provider: string | null }>("/api/ai/status");
    } catch {
      return null;
    }
  }

  /** Turn a chat transcript (what the user told Sumaiya + their profile) into a
   *  structured CV the app can preview and save. Anti-fabrication enforced
   *  server-side. */
  async buildCv(transcript: string, lang?: "en" | "sw"): Promise<{ cv: CVData }> {
    return this.request("/api/mobile/build-cv", {
      method: "POST",
      body: JSON.stringify({ transcript, lang }),
    });
  }

  // ── Referral loop (Hono /api/referral, Bearer) ───────────────────────────
  async getReferral(): Promise<{ code: string; url: string; joined: number; activated: number; premiumUntil: string | null }> {
    return this.request("/api/referral");
  }

  async claimReferral(code: string): Promise<{ ok: boolean; reason?: string }> {
    return this.request("/api/referral/claim", { method: "POST", body: JSON.stringify({ code }) });
  }

  async referralShared(channel: "whatsapp" | "link" | "copy"): Promise<void> {
    await this.request("/api/referral/shared", { method: "POST", body: JSON.stringify({ channel }) }).catch(() => {});
  }

  // ── Jobs (Hono /api/jobs) ─────────────────────────────────────────────────
  /** The public live-jobs feed. */
  async getJobs(opts: { q?: string; limit?: number; light?: boolean; id?: string } = {}): Promise<JobListing[]> {
    // Deliberately NO internal `.catch(() => [])` here. Swallowing the failure
    // made a network error indistinguishable from a genuinely empty feed at
    // every call site: the Jobs screen rendered "No openings right now" while
    // offline, and its (correct) "Couldn't load jobs / Retry" branch was dead
    // code. All callers already handle rejection — let it propagate.
    //
    // The no-argument call is unchanged (the full public feed). The options
    // exist for the chat's job picker: `light` drops every description so a
    // phone on metered data can open a pick-list for a couple of KB instead of
    // ~350 KB, and `id` fetches the ONE advert the user actually chose.
    if (opts.id) return this.request<JobListing[]>(buildPickRowUrl(opts.id));
    if (opts.light) return this.request<JobListing[]>(buildPickListUrl({ q: opts.q, limit: opts.limit }));
    return this.request<JobListing[]>("/api/jobs");
  }

  /** Jobs matched to the signed-in user's Career Profile / latest CV. `score`
   *  is the 0–100 match. Returns [] for a guest or an empty profile. */
  async getJobRecommendations(limit = 8): Promise<JobRecommendation[]> {
    // Same reasoning as getJobs(). A user with no profile still gets a real
    // 200 + [] from the server, so the genuine "empty" case is unaffected.
    return this.request<JobRecommendation[]>(`/api/jobs/recommendations?limit=${limit}`);
  }

  /** Paste a job description, get a tailored CV and/or a cover letter grounded
   *  in the user's real profile + CV. */
  async applyToJob(
    jobDescription: string,
    want: "cv" | "letter" | "both",
    opts: { cvId?: string; lang?: "en" | "sw" } = {}
  ): Promise<{
    jobTitle: string;
    company: string;
    cvId: string | null;
    cv: { summary: string; experience: { id: string; description: string }[] } | null;
    letter: { content: string } | null;
  }> {
    return this.request("/api/mobile/apply", {
      method: "POST",
      body: JSON.stringify({ jobDescription, want, ...opts }),
    });
  }

  // ── Account management (Hono /api/user) ───────────────────────────────────

  /** Permanently deletes the account and every row keyed by the user's id. */
  async deleteAccount(): Promise<void> {
    await this.request<void>("/api/user/delete-user", { method: "POST" });
  }

  // ── App update manifest (public, no auth) ────────────────────────────────

  async getAppUpdate(): Promise<{
    version?: string | null;
    url?: string | null;
    notes?: { en?: string | null; sw?: string | null } | null;
    // A floor and a line-reset flag. The route has returned both since the
    // restarted-version-line work; this type simply never learned about them,
    // so `manifest?.minimumVersion` was a compile error at the call site.
    minimumVersion?: string | null;
    lineReset?: boolean | null;
  }> {
    return this.request("/api/app/update");
  }

  // ── App telemetry (anonymous, install-scoped) ────────────────────────────
  /**
   * Ship a batch of anonymous usage events from the native app.
   *
   * Deliberately not retried by `request` (POST is never retried — a duplicate
   * side effect is worse than a lost batch), and deliberately tolerant: the
   * caller treats any failure as "keep the events queued".
   */
  async postTelemetry(payload: {
    installId: string;
    appVersion: string;
    platform?: string;
    device?: string | null;
    events: { name: string; props?: Record<string, unknown>; at?: number }[];
  }): Promise<void> {
    await this.request<void>("/api/app/telemetry", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Send a user-initiated problem report. Unlike `postTelemetry`, this one
   * DOES surface failure to the caller — a report the user explicitly asked
   * to send needs a real "I couldn't send it" outcome, not a silently
   * requeued event. Auth is optional (a guest can report); never throws —
   * the report sheet shows its own message either way.
   */
  async postAppReport(payload: {
    installId: string;
    kind: "crash" | "problem" | "idea";
    note?: string;
    screenshot?: string | null;
    logs: { at: number; kind: string; name: string; detail?: string }[];
    appVersion: string;
    platform?: string;
    device?: string | null;
  }): Promise<{ ok: boolean }> {
    try {
      await this.request<void>(
        "/api/app/report",
        { method: "POST", body: JSON.stringify(payload) },
        UPLOAD_TIMEOUT_MS, // carries a base64 screenshot — the default 30s is too tight
      );
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  // ── Export ledger (Hono /api/mobile/export, Bearer) ──────────────────────

  /**
   * Tell the server a document actually left this device.
   *
   * The native app prints and shares the PDF locally with expo-print, so
   * nothing reached the server and the assistant could never see that a letter
   * had been exported — `download_log` only ever held rows from the web editor.
   *
   * Best-effort by contract: the export has already happened on the device, so
   * a failure here is swallowed by the caller, never surfaced to the user.
   */
  async recordExport(input: {
    documentType: "cv" | "cover-letter" | "letter" | "business-card";
    documentId?: string;
    title?: string;
    format?: "pdf";
  }): Promise<void> {
    await this.request<void>("/api/mobile/export", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  // ── Capability layer (Hono /api/capabilities) ────────────────────────────
  // One method for every tool. The web + native UI both call this; the server's
  // run-tool pipeline does entitlement / quota / policy / audit identically.
  // A `blocked` / `confirm_required` / `error` outcome comes back as data, not
  // a thrown error — the caller branches on `result.status`.

  async runCapability(
    toolId: string,
    body: {
      args?: Record<string, unknown>;
      confirmed?: boolean;
      cv?: unknown;
      hasFile?: boolean;
      context?: Record<string, unknown>;
    } = {},
  ): Promise<CapabilityResult> {
    return this.request<CapabilityResult>(`/api/capabilities/${encodeURIComponent(toolId)}`, {
      method: "POST",
      body: JSON.stringify({ caller: "ui", ...body }),
    });
  }

  // ── Push registration (Hono /api/mobile/device-token, Bearer) ─────────────

  async registerPushToken(input: {
    pushToken: string;
    platform: "ios" | "android" | "web";
    deviceId: string;
  }): Promise<{ ok: true }> {
    return this.request<{ ok: true }>("/api/mobile/device-token", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  // ── Connectivity ─────────────────────────────────────────────────────────

  async checkConnectivity(): Promise<boolean> {
    try {
      await this.request<unknown>("/api/health");
      return true;
    } catch {
      return false;
    }
  }
}

/** Mirrors the ToolResult union in apps/web/lib/assistant/run-tool.ts. */
export type CapabilityResult =
  | { status: "ok"; tool: string; data: unknown; provenance?: unknown[] }
  | { status: "preview"; tool: string; data: unknown; provenance?: unknown[] }
  | { status: "confirm_required"; tool: string; summary: string }
  | { status: "blocked"; tool: string; reason: string; detail?: string; retryAfter?: number }
  | { status: "error"; tool: string; code: string };

export * from "./vacancy-sources";
export * from "./job-pick";

export default ApiClient;
