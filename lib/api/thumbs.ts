import { fetchWithAuth } from './client';

export async function addThumb(
  questionId: string
): Promise<{ questionId: string; userId: string }> {
  const res = await fetchWithAuth(`/api/questions/${questionId}/thumbs`, {
    method: 'POST',
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to add reaction');
  }

  return res.json();
}
