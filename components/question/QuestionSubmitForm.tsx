'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import { submitQuestion } from '@/lib/api/questions';
import { useUIStore } from '@/store/uiStore';

interface QuestionSubmitFormProps {
  sessionId: string;
  onSubmitted?: () => void;
}

export default function QuestionSubmitForm({
  sessionId,
  onSubmitted,
}: QuestionSubmitFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const { isSubmitting, setSubmitting } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('질문 내용을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await submitQuestion({
        sessionId,
        content: content.trim(),
      });
      setContent('');
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '질문 제출에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
    >
      <TextArea
        placeholder="질문을 입력하세요..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        showCount
        rows={3}
      />

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}

      <div className="flex justify-end mt-3">
        <Button type="submit" loading={isSubmitting} disabled={!content.trim()}>
          질문하기
        </Button>
      </div>
    </form>
  );
}
