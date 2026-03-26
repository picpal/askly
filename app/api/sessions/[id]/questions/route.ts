import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractUser, AuthError } from "@/lib/auth/middleware";

export async function GET(
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

    const { id: sessionId } = await params;
    const { searchParams } = new URL(req.url);

    const sort = searchParams.get("sort") || "latest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const offset = (page - 1) * limit;

    if (sort !== "latest" && sort !== "popular") {
      return NextResponse.json(
        { error: "sort must be 'latest' or 'popular'" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const isAdmin = user.role === "admin" || user.role === "super_admin";

    // 쿼리 빌드
    let query = supabase
      .from("questions")
      .select("id, session_id, author_id, author_nickname, content, is_private, is_pinned, thumb_count, created_at", { count: "exact" })
      .eq("session_id", sessionId);

    // 비공개 질문 필터링: admin이 아닌 경우 자기 것만 + 공개 질문
    if (!isAdmin) {
      query = query.or(`is_private.eq.false,author_id.eq.${user.userId}`);
    }

    // 정렬
    if (sort === "popular") {
      query = query.order("thumb_count", { ascending: false }).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: questions, error: queryError, count } = await query;

    if (queryError) {
      return NextResponse.json(
        { error: "Failed to fetch questions", details: queryError.message },
        { status: 500 }
      );
    }

    const mapped = (questions || []).map((q) => ({
      id: q.id,
      sessionId: q.session_id,
      authorId: q.author_id,
      authorNickname: q.author_nickname,
      content: q.content,
      isPrivate: q.is_private,
      isPinned: q.is_pinned,
      thumbCount: q.thumb_count,
      createdAt: q.created_at,
    }));

    return NextResponse.json({
      questions: mapped,
      total: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/sessions/[id]/questions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
