import { createAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey } from "@/lib/crypto/encrypt";
import { callClaude, ClaudeAPIError } from "./claude";
import { AI_SYSTEM_PROMPT, buildUserPrompt } from "./prompt";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function generateDraft(questionId: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    // 1. question + session 조회
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("id, content, session_id")
      .eq("id", questionId)
      .single();

    if (qError || !question) {
      console.error("generateDraft: question not found", questionId);
      return;
    }

    const { data: session, error: sError } = await supabase
      .from("sessions")
      .select("id, title, ai_api_key_enc")
      .eq("id", question.session_id)
      .single();

    if (sError || !session) {
      console.error("generateDraft: session not found", question.session_id);
      return;
    }

    // 2. ai_drafts 레코드 생성 (status: 'generating')
    const { data: draft, error: draftError } = await supabase
      .from("ai_drafts")
      .insert({
        question_id: questionId,
        status: "generating",
        model: "claude-haiku-4-5-20251001",
      })
      .select("id")
      .single();

    if (draftError || !draft) {
      console.error("generateDraft: failed to create draft", draftError?.message);
      return;
    }

    // 3. API 키 복호화
    if (!session.ai_api_key_enc) {
      // 4. API 키가 없으면 failed
      await supabase
        .from("ai_drafts")
        .update({ status: "failed", error_msg: "No API key configured" })
        .eq("id", draft.id);
      return;
    }

    let apiKey: string;
    try {
      apiKey = decryptApiKey(session.ai_api_key_enc);
    } catch (err) {
      await supabase
        .from("ai_drafts")
        .update({
          status: "failed",
          error_msg: "Failed to decrypt API key",
        })
        .eq("id", draft.id);
      console.error("generateDraft: decrypt error", err);
      return;
    }

    // 5. callClaude() 호출 — 5xx 에러 시 최대 2회 재시도
    const userPrompt = buildUserPrompt(session.title, question.content);
    const retryDelays = [1000, 3000];
    let lastError: ClaudeAPIError | null = null;

    for (let attempt = 0; attempt <= 2; attempt++) {
      try {
        const content = await callClaude(apiKey, AI_SYSTEM_PROMPT, userPrompt);

        // 6. 성공
        await supabase
          .from("ai_drafts")
          .update({ status: "done", content })
          .eq("id", draft.id);
        return;
      } catch (err) {
        if (err instanceof ClaudeAPIError) {
          lastError = err;
          if (err.isRetryable && attempt < 2) {
            await sleep(retryDelays[attempt]);
            continue;
          }
        } else {
          lastError = new ClaudeAPIError(
            500,
            err instanceof Error ? err.message : "Unknown error"
          );
        }
        break;
      }
    }

    // 7. 실패
    await supabase
      .from("ai_drafts")
      .update({
        status: "failed",
        error_msg: lastError?.message ?? "Unknown error",
      })
      .eq("id", draft.id);
  } catch (err) {
    console.error("generateDraft: unexpected error", err);
  }
}
