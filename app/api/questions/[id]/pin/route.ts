import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, AuthError } from "@/lib/auth/middleware";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, "admin", "super_admin");

    const { id } = await params;
    const supabase = createAdminClient();

    // 현재 상태 조회
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id, is_pinned")
      .eq("id", id)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 토글
    const { data: updated, error: updateError } = await supabase
      .from("questions")
      .update({ is_pinned: !question.is_pinned })
      .eq("id", id)
      .select("id, is_pinned")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Failed to toggle pin", details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      isPinned: updated.is_pinned,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/questions/[id]/pin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
