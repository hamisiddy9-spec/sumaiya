/**
 * Photo rendering — the HTML counterpart of the web's PhotoCircle.
 *
 * Only sources the PDF/WebView can render offline are accepted (base64 data
 * URIs and https URLs — the same allow-list the legacy cv-html.ts gates on).
 * Anything else falls back to initials on the accent colour, so a broken or
 * hostile value can never become a broken <img> box in an exported PDF.
 */

import { esc } from "./html";

const PHOTO_SRC_RE = /^(data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+|https:\/\/[^"'\s<>]+)$/;

export function initialsOf(name: string): string {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
}

export interface PhotoOptions {
  url: string;
  name: string;
  size: number;
  bgColor: string;
  /** Text colour for the initials fallback. Defaults to white. */
  fgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  /** 50 = circle, 0 = square, any other number = px radius. */
  radius?: number;
}

export function photoCircle({
  url,
  name,
  size,
  bgColor,
  fgColor = "#FFFFFF",
  borderColor,
  borderWidth,
  radius = 50,
}: PhotoOptions): string {
  const r = radius === 50 ? "50%" : `${radius}px`;
  const box = [
    `width:${size}px`,
    `height:${size}px`,
    `border-radius:${r}`,
    "overflow:hidden",
    "flex-shrink:0",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    `background-color:${bgColor}`,
    borderColor && borderWidth ? `border:${borderWidth}px solid ${borderColor}` : "",
    "box-sizing:border-box",
  ]
    .filter(Boolean)
    .join(";");

  if (url && PHOTO_SRC_RE.test(url)) {
    return (
      `<div style="${box}">` +
      `<img src="${esc(url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block"/>` +
      `</div>`
    );
  }

  const initials = initialsOf(name);
  if (!initials) return "";
  const fs = Math.max(10, Math.round(size * 0.38));
  return (
    `<div style="${box}">` +
    `<span style="font-size:${fs}px;font-weight:800;color:${fgColor};letter-spacing:-0.02em">${esc(initials)}</span>` +
    `</div>`
  );
}
