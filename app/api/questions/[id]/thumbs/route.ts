import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractUser, AuthError } from "@/lib/auth/middleware";

export async function POST(
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

    const { id: questionId } = await params;
    const supabase = createAdminClient();

    // 질문 존재 확인
    const { data: question, error: fetchError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", questionId)
      .single();

    if (fetchError || !question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // thumbs INSERT
    const { error: insertError } = await supabase
      .from("thumbs")
      .insert({
        question_id: questionId,
        user_id: user.userId,
      });

    if (insertError) {
      // UNIQUE 제약 위반 (이미 좋아요 누른 경우)
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "Already reacted" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to add reaction", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        questionId,
        userId: user.userId,
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
    console.error("POST /api/questions/[id]/thumbs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
