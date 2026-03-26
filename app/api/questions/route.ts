import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/middleware";
import { AuthError } from "@/lib/auth/middleware";
import { generateDraft } from "@/lib/ai/generate-draft";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req, "participant", "admin", "super_admin");

    const body = await req.json();
    const { sessionId, content, isPrivate } = body;

    if (!sessionId || !content || typeof content !== "string") {
      return NextResponse.json(
        { error: "sessionId and content are required" },
        { status: 400 }
      );
    }

    if (content.trim().length === 0) {
      return NextResponse.json(
        { error: "content must not be empty" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "content must be 500 characters or less" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 닉네임 조회
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("nickname")
      .eq("id", user.userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // 질문 INSERT
    const { data: question, error: questionError } = await supabase
      .from("questions")
      .insert({
        session_id: sessionId,
        author_id: user.userId,
        author_nickname: userData.nickname,
        content: content.trim(),
        is_private: isPrivate ?? false,
      })
      .select("id, session_id, author_nickname, content, is_private, thumb_count, created_at")
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: "Failed to create question", details: questionError?.message },
        { status: 500 }
      );
    }

    // fire-and-forget: AI 초안 생성 (응답을 블로킹하지 않음)
    generateDraft(question.id).catch(console.error);

    return NextResponse.json(
      {
        id: question.id,
        sessionId: question.session_id,
        authorNickname: question.author_nickname,
        content: question.content,
        isPrivate: question.is_private,
        thumbCount: question.thumb_count ?? 0,
        createdAt: question.created_at,
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
    console.error("POST /api/questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
