// TemplateCanvas — the wrapper every full-page CV render goes through, so two
// cross-cutting fixes reach all ~267 hand-written template components without
// editing 267 files:
//
//   1. PAGE FILL / FIT. The SmartFit engine (components/templates/engine/fit.tsx)
//      measures the rendered CV and either tightens it onto one page or grows it
//      to fill the sheet. It is a client component with a measuring effect, so it
//      must be around the template — including on the element the PDF exporter
//      rasterizes (that is where the user's actual document comes from).
//   2. FONTS. Narrower: callers resolve the document's `fontFamily` through
//      `resolveFontStack` (lib/fonts.ts) before passing it down, because a
//      document stores the bare name "Inter" and a bare name the machine lacks
//      renders as Arial.
//
// It takes the template as CHILDREN, not as a `Component` prop: the template
// pages are server components, and a function (component) cannot cross the
// server → client boundary. Element children can.
//
// Thumbnails deliberately do NOT use this (see template-gallery-client): the
// engine measures real layout, and running it for 267 gallery tiles at once is
// page-weight with no benefit at 106px wide.

import React from "react";
import { AutoFitPage } from "./engine/fit";

interface TemplateCanvasProps {
  children: React.ReactNode;
  /** `false` = render the template raw, with no SmartFit wrapper. */
  page?: boolean;
}

export function TemplateCanvas({ children, page = true }: TemplateCanvasProps) {
  return page ? <AutoFitPage>{children}</AutoFitPage> : <>{children}</>;
}
