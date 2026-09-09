"use client";

// Hero showcase registry — the ONLY templates the landing page renders.
// Importing the full 267-template registry here pulled ~516 KB of eager JS
// into every landing view (all template components were bundled client-side
// even though the hero cycles through 6 and the showcase through 18).
// This module keeps the landing lean while the full registry stays available
// to the editor / gallery / dashboard where any template can be selected.
import type { FC } from "react";
import { RiftTemplate } from "./rift";
import { ZahabuTemplate } from "./zahabu";
import { NuruTemplate } from "./nuru";
import { PembaTemplate } from "./pemba";
import { MalachiteTemplate } from "./malachite";
import { CoralTemplate } from "./coral";
import { KiooTemplate } from "./kioo";
import { BentoTemplate } from "./bento";
import { ZegeTemplate } from "./zege";
import { RisoTemplate } from "./riso";
import { VibeTemplate } from "./vibe";
import { NeonTemplate } from "./neon";
import { RegentTemplate } from "./regent";
import { MarloweTemplate } from "./marlowe";
import { HavenTemplate } from "./haven";
import { NakuruTemplate } from "./nakuru";
import { KilimanjaroTemplate } from "./kilimanjaro";
import { SerengetiTemplate } from "./serengeti";
import { ZanzibarTemplate } from "./zanzibar";
import { UbuntuTemplate } from "./ubuntu";
import { SavannaTemplate } from "./savanna";
import type { TemplateProps } from "./registry";

/** Landing-only template map (6 hero + 18 showcase, deduped). */
export const HERO_TEMPLATE_COMPONENTS: Record<string, FC<TemplateProps>> = {
  rift: RiftTemplate,
  zahabu: ZahabuTemplate,
  nuru: NuruTemplate,
  pemba: PembaTemplate,
  malachite: MalachiteTemplate,
  coral: CoralTemplate,
  kioo: KiooTemplate,
  bento: BentoTemplate,
  zege: ZegeTemplate,
  riso: RisoTemplate,
  vibe: VibeTemplate,
  neon: NeonTemplate,
  regent: RegentTemplate,
  marlowe: MarloweTemplate,
  haven: HavenTemplate,
  nakuru: NakuruTemplate,
  kilimanjaro: KilimanjaroTemplate,
  serengeti: SerengetiTemplate,
  zanzibar: ZanzibarTemplate,
  ubuntu: UbuntuTemplate,
  savanna: SavannaTemplate,
};
