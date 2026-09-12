/**
 * Anonymous usage telemetry for the native app.
 *
 * Testers are about to use this app on real phones, and their phone is the only
 * place the truth lives: which build they actually run, whether the in-app
 * updater finished, and what broke. Without this we are guessing.
 *
 * Design rules, in order of importance:
 *   1. Never break the app. Every call is best-effort, swallows everything, and
 *      a flush failure just leaves events queued for the next attempt.
 *   2. Never send PII. Events carry names, counters, versions and error
 *      MESSAGES (never content): the server strips PII keys again on the way in.
 *   3. Bound the cost. One install id, events batched, queue capped, no retry
 *      storm — a tester on Tanzanian mobile data must not pay for our curiosity.
 *   4. Opt-out wins. The server drops events for any signed-in user whose
 *      `analytics_opt_out` is set, so honouring the setting does not depend on
 *      the client remembering to.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { apiClient } from "./api-client";
import { APP_VERSION } from "./app-version";

type Props = Record<string, unknown>;

interface QueuedEvent {
  name: string;
  props: Props;
  at: number;
}

const INSTALL_ID_KEY = "sumaiya.install.id";
const QUEUE_KEY = "sumaiya.telemetry.queue";
const MAX_QUEUE = 200;
const BATCH_SIZE = 25;
const FLUSH_INTERVAL_MS = 20_000;
const PERSIST_DEBOUNCE_MS = 1_500;

let installId: string | null = null;
let queue: QueuedEvent[] = [];
let started = false;
let flushing = false;
let timer: ReturnType<typeof setInterval> | null = null;
let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** No crypto import: this is an opaque grouping key, not a security token. */
function randomId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
}

function deviceLabel(): string | null {
  try {
    const model = Device.modelName ?? Device.deviceName ?? null;
    // NOT Device.osName: on Android it hands back the whole build fingerprint
    // ("Hisense/HLTE272E/HLTE272E:15/AP3A…/release-keys"), which bloated every
    // row with 100+ chars of noise. The OS version is the useful part.
    const os = Device.osVersion
      ? `${Platform.OS === "android" ? "Android" : "iOS"} ${Device.osVersion}`
      : null;
    return [model, os].filter(Boolean).join(" · ") || null;
  } catch {
    return null;
  }
}

async function persistNow(): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-MAX_QUEUE)));
  } catch {
    /* storage full / unavailable — losing the queue is acceptable */
  }
}

function schedulePersist(): void {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistNow();
  }, PERSIST_DEBOUNCE_MS);
}

/**
 * Load the install id and any events left over from a previous launch, then
 * begin flushing on a timer.
 *
 * Resolves true only for the call that actually started things, so a caller can
 * hang once-per-launch work off it. (It resolved void before, and an effect that
 * ran more than once fired `app.open` four times in the same second — caught on
 * the Hisense, not in a test.)
 */
export async function startTelemetry(): Promise<boolean> {
  try {
    if (started) return false;
    started = true;

    installId = await AsyncStorage.getItem(INSTALL_ID_KEY).catch(() => null);
    if (!installId) {
      installId = randomId();
      await AsyncStorage.setItem(INSTALL_ID_KEY, installId).catch(() => {});
    }

    const raw = await AsyncStorage.getItem(QUEUE_KEY).catch(() => null);
    if (raw) {
      const parsed = JSON.parse(raw) as QueuedEvent[];
      // A queue persisted by an older build could be anything — validate.
      if (Array.isArray(parsed)) {
        queue = parsed.filter((e) => e && typeof e.name === "string").slice(-MAX_QUEUE);
      }
    }

    timer = setInterval(() => {
      void flushTelemetry();
    }, FLUSH_INTERVAL_MS);
    return true;
  } catch {
    /* telemetry is never allowed to be the reason the app fails to start */
    return false;
  }
}

/** Record an event. Returns immediately; the network happens later, in a batch. */
export function track(name: string, props: Props = {}): void {
  try {
    queue.push({ name, props, at: Date.now() });
    if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);
    schedulePersist();
    if (queue.length >= BATCH_SIZE) void flushTelemetry();
  } catch {
    /* nothing here is worth an exception */
  }
}

/**
 * Ship the oldest batch. Called on the timer, when the batch fills, and when the
 * app goes to the background (the last chance before Android may kill us).
 * Concurrent calls collapse into one — a slow network must not stack requests.
 */
export async function flushTelemetry(): Promise<void> {
  if (flushing || queue.length === 0 || !installId) return;
  flushing = true;
  const batch = queue.slice(0, BATCH_SIZE);
  try {
    await apiClient.postTelemetry({
      installId,
      appVersion: APP_VERSION,
      platform: Platform.OS,
      device: deviceLabel(),
      events: batch.map((e) => ({ name: e.name, props: e.props, at: e.at })),
    });
    // Only drop what the server accepted: a failure keeps everything queued.
    queue = queue.slice(batch.length);
    void persistNow();
  } catch {
    /* offline, slow, server down — the next tick tries again */
  } finally {
    flushing = false;
  }
}

/** Stop the timer (tests, hot reload). Queued events stay persisted. */
export function stopTelemetry(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}

/** Truncate a message for transport — long strings are where PII hides. */
export function shortMessage(value: unknown, max = 240): string {
  const s = value instanceof Error ? `${value.name}: ${value.message}` : String(value ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** Exposed for tests and for grouping "how many installs have we ever seen". */
export function currentInstallId(): string | null {
  return installId;
}
