import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole, AuthError } from "@/lib/auth/middleware";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sessionId } = params;

    // super_admin 역할 필요
    const caller = await requireRole(req, "super_admin");

    // 요청한 사용자의 세션과 일치하는지 확인
    if (caller.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Forbidden: session mismatch" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 대상 사용자가 같은 세션에 속하는지 확인
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, role, session_id")
      .eq("id", userId)
      .eq("session_id", sessionId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: "User not found in this session" },
        { status: 404 }
      );
    }

    if (targetUser.role === "super_admin") {
      return NextResponse.json(
        { error: "Cannot modify super_admin role" },
        { status: 400 }
      );
    }

    if (targetUser.role === "admin") {
      return NextResponse.json(
        { error: "User is already an admin" },
        { status: 400 }
      );
    }

    // role을 'admin'으로 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update role", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "User promoted to admin",
      userId,
      role: "admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/sessions/[id]/admins error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
