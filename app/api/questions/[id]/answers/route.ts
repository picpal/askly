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
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 질문 존재 확인
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", questionId)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 답변 INSERT
    const { data: answer, error: answerError } = await supabase
      .from("answers")
      .insert({
        question_id: questionId,
        content: content.trim(),
        source: "manual",
      })
      .select("id, question_id, content, source, created_at")
      .single();

    if (answerError || !answer) {
      return NextResponse.json(
        { error: "Failed to create answer", details: answerError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        id: answer.id,
        questionId: answer.question_id,
        content: answer.content,
        source: answer.source,
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
    console.error("POST /api/questions/[id]/answers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
