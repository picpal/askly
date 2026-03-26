import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, AuthError } from "@/lib/auth/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, "admin", "super_admin");

    const { id: questionId } = await params;
    const supabase = createAdminClient();

    const { data: draft, error } = await supabase
      .from("ai_drafts")
      .select("id, question_id, content, status, model, error_msg, created_at")
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

    return NextResponse.json({
      id: draft.id,
      questionId: draft.question_id,
      content: draft.content,
      status: draft.status,
      model: draft.model,
      errorMsg: draft.error_msg,
      createdAt: draft.created_at,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/questions/[id]/ai-draft error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
