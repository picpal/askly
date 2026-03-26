'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { joinSession } from '@/lib/api/sessions';
import { useSessionStore } from '@/store/sessionStore';

interface JoinSessionFormProps {
  sessionId: string;
  sessionTitle: string;
}

export default function JoinSessionForm({
  sessionId,
  sessionTitle,
}: JoinSessionFormProps) {
  const router = useRouter();
  const { setSession, setUser, setToken } = useSessionStore();

  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const result = await joinSession(sessionId, nickname.trim());

      setSession({
        id: result.session.id,
        code: result.session.code,
        title: result.session.title,
        description: result.session.description,
      });
      setUser({
        id: result.userId,
        nickname: nickname.trim(),
        role: 'participant',
      });
      setToken(result.token);

      router.push(`/session/${result.session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '참여에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{sessionTitle}</h2>
        <p className="text-sm text-gray-500 mt-1">세션에 참여하려면 닉네임을 입력하세요</p>
      </div>

      <Input
        label="닉네임"
        placeholder="사용할 닉네임을 입력하세요"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        required
      />

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        참여하기
      </Button>
    </form>
  );
}
