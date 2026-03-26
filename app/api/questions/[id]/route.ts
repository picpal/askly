import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractUser, AuthError } from "@/lib/auth/middleware";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await extractUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { content } = body;

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length === 0) {
        return NextResponse.json(
          { error: "content must be a non-empty string" },
          { status: 400 }
        );
      }
      if (content.length > 500) {
        return NextResponse.json(
          { error: "content must be 500 characters or less" },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // 질문 조회
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id, author_id")
      .eq("id", id)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 권한 확인: 작성자 또는 admin/super_admin
    const isAuthor = question.author_id === user.userId;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // UPDATE
    const updateData: Record<string, unknown> = {};
    if (content !== undefined) {
      updateData.content = content.trim();
    }

    const { data: updated, error: updateError } = await supabase
      .from("questions")
      .update(updateData)
      .eq("id", id)
      .select("id, session_id, author_id, author_nickname, content, is_private, is_pinned, thumb_count, created_at, updated_at")
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: "Failed to update question", details: updateError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: updated.id,
      sessionId: updated.session_id,
      authorId: updated.author_id,
      authorNickname: updated.author_nickname,
      content: updated.content,
      isPrivate: updated.is_private,
      isPinned: updated.is_pinned,
      thumbCount: updated.thumb_count,
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
    console.error("PATCH /api/questions/[id] error:", error);
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
    const user = await extractUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // 질문 조회
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id, author_id")
      .eq("id", id)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // 권한 확인
    const isAuthor = question.author_id === user.userId;
    const isAdmin = user.role === "admin" || user.role === "super_admin";
    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("questions")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete question", details: deleteError.message },
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
    console.error("DELETE /api/questions/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
