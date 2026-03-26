import type { Answer } from '@/lib/types';

interface AnswerDisplayProps {
  answer: Answer;
}

export default function AnswerDisplay({ answer }: AnswerDisplayProps) {
  return (
    <div className="mt-3 pl-4 border-l-2 border-blue-200">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-medium text-blue-600">답변</span>
        {answer.showAiBadge && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
            AI
          </span>
        )}
      </div>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{answer.content}</p>
      <p className="text-xs text-gray-400 mt-1">
        {new Date(answer.createdAt).toLocaleString('ko-KR')}
        {answer.updatedAt && ' (수정됨)'}
      </p>
    </div>
  );
}
