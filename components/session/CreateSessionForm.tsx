'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import { createSession } from '@/lib/api/sessions';
import { useSessionStore } from '@/store/sessionStore';

export default function CreateSessionForm() {
  const router = useRouter();
  const { setSession, setUser, setToken } = useSessionStore();

  const [title, setTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [aiProvider, setAiProvider] = useState('claude');
  const [aiApiKey, setAiApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('세션 제목을 입력해주세요.');
      return;
    }
    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await createSession({
        title: title.trim(),
        nickname: nickname.trim(),
        description: description.trim() || undefined,
        aiProvider,
        aiApiKey: aiApiKey.trim() || undefined,
      });

      setSession({
        id: result.sessionId,
        code: result.code,
        title: title.trim(),
        description: description.trim() || undefined,
      });
      setUser({
        id: '',
        nickname: nickname.trim(),
        role: 'super_admin',
      });
      setToken(result.token);

      router.push(`/admin/${result.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '세션 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">새 세션 만들기</h2>

      <Input
        label="세션 제목"
        placeholder="예: 2024 개발자 컨퍼런스 Q&A"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <Input
        label="닉네임"
        placeholder="관리자 닉네임"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
      />

      <TextArea
        label="설명 (선택)"
        placeholder="세션에 대한 설명을 입력하세요"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          AI 제공자
        </label>
        <select
          value={aiProvider}
          onChange={(e) => setAiProvider(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="claude">Claude</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <Input
        label="AI API Key (선택)"
        type="password"
        placeholder="AI 답변 추천 기능을 사용하려면 입력"
        value={aiApiKey}
        onChange={(e) => setAiApiKey(e.target.value)}
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        세션 생성
      </Button>
    </form>
  );
}
