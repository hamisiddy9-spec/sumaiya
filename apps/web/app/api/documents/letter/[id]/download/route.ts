import { NextRequest, NextResponse } from "next/server";
import { db, letter } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordExport } from "@/lib/documents/export-ledger";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select({ id: letter.id, title: letter.title })
    .from(letter)
    .where(and(eq(letter.id, params.id), eq(letter.userId, user.id)))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Counter + ledger from one place. Previously this bumped `download_count`
  // and wrote nothing to `download_log`, so a letter exported from the web
  // editor was invisible to the assistant's library block.
  // markComplete: letters have always flipped to "complete" on download here.
  await recordExport({
    userId: user.id,
    documentId: existing.id,
    documentType: "letter",
    title: existing.title,
    format: "pdf",
    markComplete: true,
  });

  return NextResponse.json({ success: true });
}
