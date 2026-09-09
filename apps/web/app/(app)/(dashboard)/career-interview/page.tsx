import { headers } from "next/headers";
import type { Metadata } from "next";
import { CareerInterviewClient } from "@/components/interview/career-interview-client";
import type { Lang } from "@/lib/i18n/translations";

export const metadata: Metadata = {
  title: "Career Interview — Sumaiya",
  description:
    "Answer a few questions (type or speak) to build your Career Profile — the source of truth every CV is made from.",
};

export const dynamic = "force-dynamic";

export default async function CareerInterviewPage() {
  const lang = ((await headers()).get("x-lang") ?? "sw") as Lang;
  return <CareerInterviewClient lang={lang} />;
}
