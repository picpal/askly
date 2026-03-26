import { fetchWithAuth } from './client';
import type { Question } from '@/lib/types';

export async function getQuestions(sessionId: string): Promise<Question[]> {
  const res = await fetchWithAuth(`/api/sessions/${sessionId}/questions`);

  if (!res.ok) {
    // If the endpoint doesn't exist yet, return empty array
    if (res.status === 404) return [];
    const data = await res.json();
    throw new Error(data.error || 'Failed to fetch questions');
  }

  const data = await res.json();
  return data.questions || data;
}

interface SubmitQuestionParams {
  sessionId: string;
  content: string;
  isPrivate?: boolean;
}

export async function submitQuestion(
  params: SubmitQuestionParams
): Promise<Question> {
  const res = await fetchWithAuth('/api/questions', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to submit question');
  }

  return res.json();
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await fetchWithAuth(`/api/questions/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete question');
  }
}
