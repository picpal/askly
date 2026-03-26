'use client';

import type { Question } from '@/lib/types';
import ThumbButton from './ThumbButton';
import AnswerDisplay from './AnswerDisplay';

interface QuestionCardProps {
  question: Question;
  onThumbAdded?: (questionId: string) => void;
  children?: React.ReactNode;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function QuestionCard({
  question,
  onThumbAdded,
  children,
}: QuestionCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border p-4 ${
        question.isPinned ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {question.isPinned && (
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                고정
              </span>
            )}
            <span className="text-sm font-medium text-gray-900">
              {question.authorNickname}
            </span>
            <span className="text-xs text-gray-400">
              {timeAgo(question.createdAt)}
            </span>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {question.content}
          </p>
        </div>
        <ThumbButton
          questionId={question.id}
          thumbCount={question.thumbCount}
          onThumbAdded={onThumbAdded}
        />
      </div>

      {question.answers && question.answers.length > 0 && (
        <div className="mt-2">
          {question.answers.map((answer) => (
            <AnswerDisplay key={answer.id} answer={answer} />
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
