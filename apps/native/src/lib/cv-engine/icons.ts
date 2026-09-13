/**
 * Inline SVG contact icons — 1:1 with the web's template-utils
 * (IcoEmail / IcoPhone / IcoPin / IcoLinkedIn / IcoGlobe).
 *
 * They are emitted as SVG source rather than drawn with a font or an <img>,
 * because the engine's output has to be a single self-contained HTML string
 * with no external assets: it is fed to both expo-print (PDF) and the
 * react-native-webview preview.
 */

export type IconName = "email" | "phone" | "pin" | "linkedin" | "globe";

interface IconDef {
  viewBox: string;
  paths: { d: string; evenodd?: boolean }[];
}

const ICONS: Record<IconName, IconDef> = {
  email: {
    viewBox: "0 0 20 20",
    paths: [
      { d: "M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3z" },
      { d: "m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839z" },
    ],
  },
  phone: {
    viewBox: "0 0 20 20",
    paths: [
      {
        evenodd: true,
        d: "M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5z",
      },
    ],
  },
  pin: {
    viewBox: "0 0 20 20",
    paths: [
      {
        evenodd: true,
        d: "m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5z",
      },
    ],
  },
  linkedin: {
    viewBox: "0 0 24 24",
    paths: [
      {
        d: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z",
      },
    ],
  },
  globe: {
    viewBox: "0 0 24 24",
    paths: [
      {
        d: "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667zM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13zM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333 8.008 8.008 0 0 0 4.062 11zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248 15.905 15.905 0 0 0 10.03 11zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667z",
      },
    ],
  },
};

/** `icon("email", 9, "#DA4A1C")` → an inline `<svg>` string. */
export function icon(name: IconName, size: number, color: string): string {
  const def = ICONS[name];
  const paths = def.paths
    .map((p) => `<path d="${p.d}"${p.evenodd ? ' fill-rule="evenodd" clip-rule="evenodd"' : ""}/>`)
    .join("");
  return (
    `<svg width="${size}" height="${size}" viewBox="${def.viewBox}" fill="${color}" ` +
    `style="display:inline-block;vertical-align:middle;flex-shrink:0">${paths}</svg>`
  );
}
