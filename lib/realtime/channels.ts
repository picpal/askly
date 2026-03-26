export function getQuestionChannel(sessionId: string): string {
  return `session:${sessionId}:questions`;
}

export function getAnswerChannel(sessionId: string): string {
  return `session:${sessionId}:answers`;
}

export function getThumbChannel(sessionId: string): string {
  return `session:${sessionId}:thumbs`;
}

export function getDraftChannel(sessionId: string): string {
  return `session:${sessionId}:ai_drafts`;
}

export function getPresenceChannel(sessionId: string): string {
  return `session:${sessionId}:presence`;
}
