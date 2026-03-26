'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import { postAnswer } from '@/lib/api/answers';

interface AnswerComposerProps {
  questionId: string;
  onAnswered?: () => void;
}

export default function AnswerComposer({
  questionId,
  onAnswered,
}: AnswerComposerProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setError('');

    try {
      await postAnswer(questionId, content.trim());
      setContent('');
      setIsOpen(false);
      onAnswered?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '답변 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        답변 작성
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <TextArea
        placeholder="답변을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setContent('');
            setError('');
          }}
        >
          취소
        </Button>
        <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>
          답변 등록
        </Button>
      </div>
    </form>
  );
}
