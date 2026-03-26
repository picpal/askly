export const AI_SYSTEM_PROMPT = `You are an assistant helping a presenter respond to audience questions.
Write a clear, friendly answer in 2–4 sentences.
Use a direct, conversational tone as if the presenter is speaking.
Match the language of the question (Korean or English).`;

export function buildUserPrompt(
  sessionTitle: string,
  questionContent: string
): string {
  return `[Session: ${sessionTitle}]\n[Question]: ${questionContent}\n\nPlease write an answer draft.`;
}
