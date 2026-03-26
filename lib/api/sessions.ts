import { fetchWithAuth } from './client';
import type { Session } from '@/lib/types';

interface CreateSessionParams {
  title: string;
  nickname: string;
  description?: string;
  aiProvider?: string;
  aiApiKey?: string;
}

interface CreateSessionResponse {
  sessionId: string;
  code: string;
  token: string;
}

export async function createSession(
  params: CreateSessionParams
): Promise<CreateSessionResponse> {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create session');
  }

  return res.json();
}

export async function getSessionByCode(code: string): Promise<Session> {
  const res = await fetch(`/api/sessions/code/${code}`);

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Session not found');
  }

  return res.json();
}

interface JoinSessionResponse {
  userId: string;
  token: string;
  session: Session;
}

export async function joinSession(
  sessionId: string,
  nickname: string
): Promise<JoinSessionResponse> {
  const res = await fetch(`/api/sessions/${sessionId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to join session');
  }

  return res.json();
}
