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
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 답변 존재 확인
    const { data: answer, error: fetchError } = await supabase
      .from("answers")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !answer) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    // UPDATE
    const { data: updated, error: updateError } = await supabase
      .from("answers")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, question_id, content, source, created_at, updated_at")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Failed to update answer", details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      questionId: updated.question_id,
      content: updated.content,
      source: updated.source,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/answers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, "admin", "super_admin");

    const { id } = await params;
    const supabase = createAdminClient();

    // 답변 존재 확인
    const { data: answer, error: fetchError } = await supabase
      .from("answers")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !answer) {
      return NextResponse.json(
        { error: "Answer not found" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("answers")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete answer", details: deleteError.message },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/answers/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
