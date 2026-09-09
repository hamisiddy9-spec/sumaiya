import { NextRequest, NextResponse } from "next/server";
import { db, businessCard } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const result = await db
    .update(businessCard)
    .set({ downloadCount: sql`${businessCard.downloadCount} + 1`, status: "complete" })
    .where(and(eq(businessCard.id, params.id), eq(businessCard.userId, user.id)))
    .returning({ id: businessCard.id });

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
