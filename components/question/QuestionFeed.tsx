'use client';

import { useQuery } from '@tanstack/react-query';
import { getQuestions } from '@/lib/api/questions';
import { useQuestionStore } from '@/store/questionStore';
import QuestionCard from './QuestionCard';
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          질문 ({questions.length})
        </h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSortBy('latest')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              sortBy === 'latest'
                ? 'bg-white text-gray-900 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => setSortBy('popular')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
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
        <div className="text-center py-8 text-gray-400">
          질문을 불러오는 중...
        </div>
      ) : sortedQuestions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-1">아직 질문이 없습니다</p>
          <p className="text-sm">첫 번째 질문을 남겨보세요!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQuestions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onThumbAdded={handleThumbAdded}
            >
              {renderCardExtra?.(question.id)}
            </QuestionCard>
          ))}
        </div>
      )}
    </div>
  );
}
