'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchWithAuth } from '@/lib/api/client';
import type { AIDraft } from '@/lib/types';

interface AIDraftCardProps {
  questionId: string;
}

export default function AIDraftCard({ questionId }: AIDraftCardProps) {
  const queryClient = useQueryClient();
  const [editContent, setEditContent] = useState('');
  const [showAiBadge, setShowAiBadge] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [actionError, setActionError] = useState('');

  const {
    data: draft,
    isLoading,
    error,
  } = useQuery<AIDraft>({
    queryKey: ['ai-draft', questionId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/questions/${questionId}/ai-draft`);
      if (res.status === 404) return null as unknown as AIDraft;
      if (!res.ok) throw new Error('Failed to fetch AI draft');
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'pending' || data.status === 'generating')) {
        return 2000;
      }
      return false;
    },
  });

  useEffect(() => {
    if (draft?.status === 'done' && draft.content && !editContent) {
      setEditContent(draft.content);
    }
  }, [draft, editContent]);

  const handlePublish = useCallback(async () => {
    if (!draft) return;
    setPublishing(true);
    setActionError('');

    try {
      const res = await fetchWithAuth(
        `/api/questions/${questionId}/ai-draft/publish`,
        {
          method: 'POST',
          body: JSON.stringify({
            draftId: draft.id,
            content: editContent || undefined,
            showAiBadge,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to publish');
      }

      queryClient.invalidateQueries({ queryKey: ['ai-draft', questionId] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '발행에 실패했습니다.');
    } finally {
      setPublishing(false);
    }
  }, [draft, editContent, showAiBadge, questionId, queryClient]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setActionError('');

    try {
      const res = await fetchWithAuth(
        `/api/questions/${questionId}/ai-draft/retry`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to retry');
      }

      queryClient.invalidateQueries({ queryKey: ['ai-draft', questionId] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '재시도에 실패했습니다.');
    } finally {
      setRetrying(false);
    }
  }, [questionId, queryClient]);

  if (isLoading) return null;
  if (error || !draft) return null;

  return (
    <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
          AI 초안
        </span>
        {draft.model && (
          <span className="text-xs text-gray-400">{draft.model}</span>
        )}
      </div>

      {/* Pending / Generating */}
      {(draft.status === 'pending' || draft.status === 'generating') && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="animate-spin h-4 w-4 text-purple-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>AI 답변 생성 중...</span>
        </div>
      )}

      {/* Done */}
      {draft.status === 'done' && (
        <div className="space-y-2">
          <textarea
            className="w-full rounded border border-purple-200 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 resize-y"
            rows={4}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showAiBadge}
                onChange={(e) => setShowAiBadge(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              AI 배지 표시
            </label>
            <button
              onClick={handlePublish}
              disabled={publishing || !editContent.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {publishing ? '발행 중...' : '발행'}
            </button>
          </div>
        </div>
      )}

      {/* Failed */}
      {draft.status === 'failed' && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">
            {draft.errorMsg || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {retrying ? '재시도 중...' : '재시도'}
          </button>
        </div>
      )}

      {actionError && (
        <p className="mt-2 text-xs text-red-500">{actionError}</p>
      )}
    </div>
  );
}
