import * as FileSystem from "expo-file-system/legacy";

/**
 * On-disk cache for real (rendered, not schematic) template gallery thumbnails.
 *
 * The gallery grid used to draw every one of 224 designs with the same 5-shape
 * wireframe (`template-thumb.tsx`) because a live WebView per visible cell
 * stutters scrolling on a cheap Android phone. The fix keeps that constraint —
 * at most ONE WebView renders at a time, off-screen, in `TemplateThumbRenderer`
 * — and turns its output into a cached PNG so every later view of that cell is
 * a plain, fast `<Image>`. This module is the queue + the disk cache; the
 * actual WebView capture lives in `components/cv/template-thumb-renderer.tsx`
 * because capturing a native view requires a mounted component.
 *
 * Cached per (id, lang, pixel size): the same file naturally survives app
 * restarts (see `warmThumbCacheFromDisk`) and is naturally invalidated if the
 * cell's pixel size ever changes (rotation, tablet, a future redesign).
 */

export const A4_RATIO = 1123 / 794;

export interface ThumbSpec {
  id: string;
  lang: "en" | "sw";
  /** Cell width in dp — the cache key, not a request for a specific dpi; the
   *  capture itself comes out at the device's native pixel density. */
  width: number;
  height: number;
  accent: string;
}

/** `Math.ceil` so a fractional cell width never leaves a 1px unrendered sliver
 *  along the bottom edge of the cached image. */
export function thumbCellHeight(width: number): number {
  return Math.ceil(width * A4_RATIO);
}

function dir(): string {
  return `${FileSystem.cacheDirectory ?? ""}template-thumbs/`;
}

function thumbFileName(spec: Pick<ThumbSpec, "id" | "lang" | "width" | "height">): string {
  const w = Math.round(spec.width);
  const h = Math.round(spec.height);
  return `${spec.id}-${spec.lang}-${w}x${h}.png`;
}

/** In-memory index of what's on disk this session — checked synchronously so
 *  a gallery cell can decide "cached / not cached" during render. */
const uriCache = new Map<string, string>();
const readyListeners = new Set<(key: string) => void>();

export function subscribeThumbReady(cb: (key: string) => void): () => void {
  readyListeners.add(cb);
  return () => readyListeners.delete(cb);
}

export function getCachedThumbUri(spec: Pick<ThumbSpec, "id" | "lang" | "width" | "height">): string | undefined {
  return uriCache.get(thumbFileName(spec));
}

let warmed: Promise<void> | null = null;

/** Scans the cache dir once so thumbnails rendered in a previous session (or
 *  earlier this session) are reused instead of re-rendered. Safe to call from
 *  every gallery open — the scan only happens once per app run. */
export function warmThumbCacheFromDisk(): Promise<void> {
  if (!warmed) {
    warmed = (async () => {
      try {
        const info = await FileSystem.getInfoAsync(dir());
        if (!info.exists) {
          await FileSystem.makeDirectoryAsync(dir(), { intermediates: true });
          return;
        }
        const names = await FileSystem.readDirectoryAsync(dir());
        for (const name of names) {
          if (name.endsWith(".png")) uriCache.set(name, `${dir()}${name}`);
        }
      } catch {
        /* first run on this device, or a platform without a readable cache dir yet */
      }
    })();
  }
  return warmed;
}

const pending = new Set<string>();
const queue: ThumbSpec[] = [];
let processor: ((spec: ThumbSpec) => Promise<string | null>) | null = null;
let draining = false;

/** Registered once by the single `<TemplateThumbRenderer/>` mounted inside the
 *  gallery — the actual capture needs a mounted WebView, which this plain
 *  module cannot render itself. */
export function registerThumbProcessor(fn: (spec: ThumbSpec) => Promise<string | null>): () => void {
  processor = fn;
  void drain();
  return () => {
    if (processor === fn) processor = null;
  };
}

/** Enqueues a render if this exact (id, lang, size) isn't already cached or in
 *  flight. Safe to call on every render of a cell — it's a no-op once queued. */
export function requestThumbRender(spec: ThumbSpec): void {
  const key = thumbFileName(spec);
  if (uriCache.has(key) || pending.has(key)) return;
  pending.add(key);
  queue.push(spec);
  void drain();
}

async function drain(): Promise<void> {
  if (draining || !processor) return;
  draining = true;
  try {
    while (queue.length && processor) {
      const spec = queue.shift()!;
      const key = thumbFileName(spec);
      pending.delete(key);
      if (uriCache.has(key)) continue;
      try {
        const uri = await processor(spec);
        if (uri) {
          uriCache.set(key, uri);
          for (const cb of readyListeners) cb(key);
          void evictIfOverBudget();
        }
      } catch {
        /* one bad template must not stall every other cell */
      }
    }
  } finally {
    draining = false;
  }
}

/** A device that opens the gallery and scrolls through everything eventually
 *  caches every design (a few hundred KB each at cell resolution) — cap the
 *  directory and evict oldest-rendered first rather than let it grow forever. */
const MAX_CACHE_BYTES = 10 * 1024 * 1024;

async function evictIfOverBudget(): Promise<void> {
  try {
    const names = await FileSystem.readDirectoryAsync(dir());
    const infos = await Promise.all(
      names.map(async (name) => {
        const info = await FileSystem.getInfoAsync(`${dir()}${name}`);
        return { name, size: info.exists ? info.size : 0, modificationTime: info.exists ? info.modificationTime : 0 };
      }),
    );
    let total = infos.reduce((n, f) => n + f.size, 0);
    if (total <= MAX_CACHE_BYTES) return;
    const oldestFirst = infos.sort((a, b) => a.modificationTime - b.modificationTime);
    for (const f of oldestFirst) {
      if (total <= MAX_CACHE_BYTES) break;
      await FileSystem.deleteAsync(`${dir()}${f.name}`, { idempotent: true }).catch(() => {});
      uriCache.delete(f.name);
      total -= f.size;
    }
  } catch {
    /* best effort — a full cache dir degrades to "renders every time", not a crash */
  }
}
