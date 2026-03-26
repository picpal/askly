import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { mintToken } from "@/lib/auth/jwt";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: sessionId } = params;
    const body = await req.json();
    const { nickname } = body;

    if (!nickname) {
      return NextResponse.json(
        { error: "nickname is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 세션 존재 여부 및 활성 상태 확인
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, code, title, description, is_active, created_at")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: "Session is no longer active" },
        { status: 400 }
      );
    }

    // Supabase 익명 인증 (anon key 클라이언트 사용)
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: authData, error: authError } =
      await anonClient.auth.signInAnonymously();

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "Failed to create anonymous user", details: authError?.message },
        { status: 500 }
      );
    }

    const authId = authData.user.id;

    // users 테이블에 INSERT (role: 'participant')
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        session_id: sessionId,
        nickname,
        role: "participant",
        auth_id: authId,
      })
      .select("id")
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Failed to create user", details: userError?.message },
        { status: 500 }
      );
    }

    // JWT 발급 (role: 'participant')
    const token = await mintToken({
      sub: authId,
      sessionId,
      userId: user.id,
      role: "participant",
    });

    return NextResponse.json(
      {
        userId: user.id,
        token,
        session: {
          id: session.id,
          code: session.code,
          title: session.title,
          description: session.description,
          isActive: session.is_active,
          createdAt: session.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sessions/[id]/join error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
