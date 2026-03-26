import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, AuthError } from "@/lib/auth/middleware";
import { generateDraft } from "@/lib/ai/generate-draft";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, "admin", "super_admin");

    const { id: questionId } = await params;
    const supabase = createAdminClient();

    // 기존 failed 상태 확인
    const { data: draft, error } = await supabase
      .from("ai_drafts")
      .select("id, status")
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch AI draft", details: error.message },
        { status: 500 }
      );
    }

    if (!draft) {
      return NextResponse.json(
        { error: "No AI draft found for this question" },
        { status: 404 }
      );
    }

    if (draft.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed drafts can be retried" },
        { status: 400 }
      );
    }

    // 기존 실패 draft 삭제 후 재생성 (fire-and-forget)
    await supabase.from("ai_drafts").delete().eq("id", draft.id);
    generateDraft(questionId).catch(console.error);

    return NextResponse.json(
      { message: "Retry initiated" },
      { status: 202 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/questions/[id]/ai-draft/retry error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
