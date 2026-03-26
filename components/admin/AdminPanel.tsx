'use client';

import { useQuery } from '@tanstack/react-query';
import QuestionFeed from '@/components/question/QuestionFeed';
import AnswerComposer from './AnswerComposer';
import AIDraftCard from './AIDraftCard';
import { fetchWithAuth } from '@/lib/api/client';
import { useCallback } from 'react';

interface AdminPanelProps {
  sessionId: string;
}

export default function AdminPanel({ sessionId }: AdminPanelProps) {
  const { data: participantsData, refetch: refetchParticipants } = useQuery({
    queryKey: ['participants', sessionId],
    queryFn: async () => {
      const res = await fetchWithAuth(`/api/sessions/${sessionId}/participants`);
      if (!res.ok) return { participants: [] };
      return res.json();
    },
    refetchInterval: 10000,
  });

  const participantCount = participantsData?.participants?.length ?? 0;

  const handleAnswered = useCallback(() => {
    // The QuestionFeed will auto-refetch via its refetchInterval
  }, []);

  const renderCardExtra = useCallback(
    (questionId: string) => (
      <>
        <AIDraftCard questionId={questionId} />
        <AnswerComposer questionId={questionId} onAnswered={handleAnswered} />
      </>
    ),
    [handleAnswered]
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>참여자 {participantCount}명</span>
        </div>
        <button
          onClick={() => refetchParticipants()}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          새로고침
        </button>
      </div>

      <QuestionFeed sessionId={sessionId} renderCardExtra={renderCardExtra} />
    </div>
  );
}
