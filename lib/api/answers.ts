import { fetchWithAuth } from './client';
import type { Answer } from '@/lib/types';

export async function postAnswer(
  questionId: string,
  content: string
): Promise<Answer> {
  const res = await fetchWithAuth(`/api/questions/${questionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to post answer');
  }

  return res.json();
}

export async function editAnswer(
  answerId: string,
  content: string
): Promise<Answer> {
  const res = await fetchWithAuth(`/api/answers/${answerId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to edit answer');
  }

  return res.json();
}

export async function deleteAnswer(answerId: string): Promise<void> {
  const res = await fetchWithAuth(`/api/answers/${answerId}`, {
    method: 'DELETE',
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete answer');
  }
}
