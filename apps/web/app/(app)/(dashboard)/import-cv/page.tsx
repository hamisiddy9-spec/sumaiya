import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ImportCvClient } from "@/components/pdf-tools/import-cv-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import your old CV — Sumaiya",
  description: "Upload an existing PDF résumé and turn it into a fully editable CV, ready to restyle and re-export.",
};

interface Props {
  searchParams: { template?: string };
}

export default async function ImportCvPage({ searchParams }: Props) {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/sign-in?callbackUrl=%2Fimport-cv");

  return <ImportCvClient initialTemplateId={searchParams.template} />;
}
