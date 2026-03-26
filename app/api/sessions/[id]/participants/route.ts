import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, AuthError } from "@/lib/auth/middleware";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sessionId } = params;

    // admin 또는 super_admin 역할 필요
    const user = await requireRole(req, "admin", "super_admin");

    // 요청한 사용자의 세션과 일치하는지 확인
    if (user.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Forbidden: session mismatch" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    const { data: participants, error } = await supabase
      .from("users")
      .select("id, nickname, role, joined_at")
      .eq("session_id", sessionId)
      .order("joined_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch participants", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      participants: (participants || []).map((p) => ({
        id: p.id,
        nickname: p.nickname,
        role: p.role,
        joinedAt: p.joined_at,
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/sessions/[id]/participants error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
