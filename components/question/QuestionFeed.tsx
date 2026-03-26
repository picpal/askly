'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/lib/api/questions';
import { useQuestionStore } from '@/store/questionStore';
import QuestionCard from './QuestionCard';
import EmptyState from '@/components/ui/EmptyState';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { useEffect, useMemo } from 'react';

interface QuestionFeedProps {
  sessionId: string;
  renderCardExtra?: (questionId: string) => React.ReactNode;
}

export default function QuestionFeed({
  sessionId,
  renderCardExtra,
}: QuestionFeedProps) {
  const { questions, setQuestions, sortBy, setSortBy } = useQuestionStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['questions', sessionId],
    queryFn: () => getQuestions(sessionId),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data) {
      setQuestions(data);
    }
  }, [data, setQuestions]);

  const sortedQuestions = useMemo(() => {
    const sorted = [...questions];
    if (sortBy === 'popular') {
      sorted.sort((a, b) => b.thumbCount - a.thumbCount);
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    // Pinned questions always on top
    sorted.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    return sorted;
  }, [questions, sortBy]);

  const handleThumbAdded = () => {
    refetch();
  };

  return (
    <div aria-live="polite">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          질문 ({questions.length})
        </h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1" role="tablist" aria-label="정렬 방식">
          <button
            role="tab"
            aria-selected={sortBy === 'latest'}
            aria-label="최신순 정렬"
            onClick={() => setSortBy('latest')}
            className={`px-3 py-1 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              sortBy === 'latest'
                ? 'bg-white text-gray-900 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            최신순
          </button>
          <button
            role="tab"
            aria-selected={sortBy === 'popular'}
            aria-label="인기순 정렬"
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1 text-sm rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              sortBy === 'popular'
                ? 'bg-white text-gray-900 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            인기순
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-label="질문 로딩 중">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : sortedQuestions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {sortedQuestions.map((question) => (
            <div key={question.id} className="animate-slideIn">
              <QuestionCard
                question={question}
                onThumbAdded={handleThumbAdded}
              >
                {renderCardExtra?.(question.id)}
              </QuestionCard>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
