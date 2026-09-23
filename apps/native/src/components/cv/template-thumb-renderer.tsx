import React, { useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system/legacy";
import { cvToHtml } from "../../lib/cv-html";
import { sampleCv } from "../../lib/sample-cv";
import { registerThumbProcessor, type ThumbSpec } from "../../lib/template-thumb-cache";

/**
 * The one WebView the gallery is allowed to render at a time — a grid of 224
 * live WebViews stutters scrolling on a cheap Android phone (see the comment
 * at `template-gallery.tsx`'s SectionList), so instead of one per cell, this
 * single off-screen renderer works through the cache module's queue: mount the
 * real template HTML (the same path `RealTemplateThumb` uses for the tap
 * preview) at the cell's own pixel size, capture it to a PNG once it has
 * painted, cache the file to disk, move to the next request.
 *
 * Mount exactly one of these, inside the gallery, only while it's open.
 */
export function TemplateThumbRenderer(): React.JSX.Element | null {
  const [job, setJob] = useState<ThumbSpec | null>(null);
  const containerRef = useRef<View>(null);
  const resolverRef = useRef<((uri: string | null) => void) | null>(null);

  useEffect(() => {
    return registerThumbProcessor(
      (spec) =>
        new Promise<string | null>((resolve) => {
          resolverRef.current = resolve;
          setJob(spec);
        }),
    );
  }, []);

  const html = useMemo(() => {
    if (!job) return null;
    return cvToHtml(
      { ...sampleCv(job.lang), templateId: job.id },
      { template: job.id, accent: job.accent, lang: job.lang, fitWidth: job.width },
    );
  }, [job]);

  if (!job || !html) return null;

  const finish = async (uri: string | null) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setJob(null);
    resolve?.(uri);
  };

  const capture = async () => {
    const current = job;
    // A capture must run against the job that requested it — if the queue has
    // already moved on (shouldn't happen, but a stray delayed onLoadEnd must
    // never write another template's render under this one's filename).
    if (!current) return;
    try {
      const tmpUri = await captureRef(containerRef, { format: "png", result: "tmpfile" });
      const targetDir = `${FileSystem.cacheDirectory ?? ""}template-thumbs/`;
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true }).catch(() => {});
      const w = Math.round(current.width);
      const h = Math.round(current.height);
      const dest = `${targetDir}${current.id}-${current.lang}-${w}x${h}.png`;
      await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
      await FileSystem.copyAsync({ from: tmpUri, to: dest });
      await finish(dest);
    } catch {
      await finish(null);
    }
  };

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: -9999, top: 0, width: job.width, height: job.height }}
    >
      <View
        ref={containerRef}
        collapsable={false}
        style={{ width: job.width, height: job.height, backgroundColor: "#fff", overflow: "hidden" }}
      >
        <WebView
          key={`${job.id}-${job.lang}-${job.width}x${job.height}`}
          originWhitelist={["*"]}
          source={{ html }}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          setBuiltInZoomControls={false}
          // A blank onLoadEnd fires once the DOM has loaded, not once Chromium
          // has actually painted the frame — the same gap RealTemplateThumb
          // doesn't have to worry about because it captures nothing. One
          // `requestAnimationFrame` round-trip through onMessage is enough to
          // guarantee a real paint happened before the capture reads pixels.
          injectedJavaScript={`requestAnimationFrame(() => requestAnimationFrame(() => { window.ReactNativeWebView.postMessage("painted"); })); true;`}
          onMessage={(_e: WebViewMessageEvent) => {
            void capture();
          }}
          style={{ width: job.width, height: job.height, backgroundColor: "#fff" }}
        />
      </View>
    </View>
  );
}
