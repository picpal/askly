import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, AuthError } from "@/lib/auth/middleware";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, "admin", "super_admin");

    const { id: questionId } = await params;
    const body = await req.json();
    const { draftId, content, showAiBadge } = body;

    if (!draftId) {
      return NextResponse.json(
        { error: "draftId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // ai_drafts에서 해당 초안 조회
    const { data: draft, error: draftError } = await supabase
      .from("ai_drafts")
      .select("id, question_id, content, status")
      .eq("id", draftId)
      .eq("question_id", questionId)
      .single();

    if (draftError || !draft) {
      return NextResponse.json(
        { error: "AI draft not found" },
        { status: 404 }
      );
    }

    if (draft.status !== "done") {
      return NextResponse.json(
        { error: "Draft is not ready for publishing" },
        { status: 400 }
      );
    }

    // content가 없으면 초안의 원본 content 사용
    const answerContent = content?.trim() || draft.content;

    if (!answerContent) {
      return NextResponse.json(
        { error: "No content available to publish" },
        { status: 400 }
      );
    }

    // answers 테이블에 INSERT
    const { data: answer, error: answerError } = await supabase
      .from("answers")
      .insert({
        question_id: questionId,
        content: answerContent,
        source: "ai_assisted",
        show_ai_badge: showAiBadge ?? true,
      })
      .select("id, question_id, content, source, show_ai_badge, created_at")
      .single();

    if (answerError || !answer) {
      return NextResponse.json(
        { error: "Failed to publish answer", details: answerError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        answerId: answer.id,
        content: answer.content,
        source: answer.source,
        showAiBadge: answer.show_ai_badge,
        createdAt: answer.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/questions/[id]/ai-draft/publish error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
