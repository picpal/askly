import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptApiKey } from "@/lib/crypto/encrypt";
import { mintToken } from "@/lib/auth/jwt";
import { generateSessionCode } from "@/lib/utils/session-code";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, nickname, aiProvider, aiApiKey } = body;

    if (!title || !nickname) {
      return NextResponse.json(
        { error: "title and nickname are required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Supabase 익명 인증
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: undefined,
        phone: undefined,
        // 익명 사용자 생성을 위해 빈 객체로 생성
      });

    // 익명 인증이 안 될 경우 UUID 직접 생성으로 폴백
    let authId: string;
    if (authError || !authData?.user) {
      // service role로 직접 auth user 생성
      const { data: anonData, error: anonError } =
        await supabase.auth.admin.createUser({
          user_metadata: { anonymous: true },
          email_confirm: true,
        });
      if (anonError || !anonData?.user) {
        return NextResponse.json(
          { error: "Failed to create anonymous user" },
          { status: 500 }
        );
      }
      authId = anonData.user.id;
    } else {
      authId = authData.user.id;
    }

    // 6자리 코드 생성 (중복 확인)
    let code = generateSessionCode();
    let retries = 0;
    while (retries < 10) {
      const { data: existing } = await supabase
        .from("sessions")
        .select("id")
        .eq("code", code)
        .single();

      if (!existing) break;
      code = generateSessionCode();
      retries++;
    }
    if (retries >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique session code" },
        { status: 500 }
      );
    }

    // API 키 암호화
    let aiApiKeyEnc: string | null = null;
    if (aiApiKey) {
      aiApiKeyEnc = encryptApiKey(aiApiKey);
    }

    // sessions 테이블에 INSERT (creator_id는 나중에 업데이트)
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        code,
        title,
        description: description || null,
        ai_provider: aiProvider || "claude",
        ai_api_key_enc: aiApiKeyEnc,
      })
      .select("id")
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Failed to create session", details: sessionError?.message },
        { status: 500 }
      );
    }

    // users 테이블에 INSERT (role: 'super_admin')
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert({
        session_id: session.id,
        nickname,
        role: "super_admin",
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

    // sessions.creator_id 업데이트
    await supabase
      .from("sessions")
      .update({ creator_id: user.id })
      .eq("id", session.id);

    // JWT 발급
    const token = await mintToken({
      sub: authId,
      sessionId: session.id,
      userId: user.id,
      role: "super_admin",
    });

    return NextResponse.json(
      {
        sessionId: session.id,
        code,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
