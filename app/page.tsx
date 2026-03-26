'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateSessionForm from '@/components/session/CreateSessionForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setCodeError('세션 코드를 입력해주세요.');
      return;
    }
    if (trimmed.length !== 6) {
      setCodeError('6자리 코드를 입력해주세요.');
      return;
    }
    router.push(`/join/${trimmed}`);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Askly</h1>
          <p className="text-lg text-gray-500">
            실시간 청중 Q&A 및 반응 플랫폼
          </p>
        </div>

        {/* Main content */}
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left: Create Session */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <CreateSessionForm />
          </div>

          {/* Right: Join Session */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              세션 참여하기
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              발표자에게 받은 6자리 코드를 입력하세요
            </p>
            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                placeholder="예: ABC123"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setCodeError('');
                }}
                error={codeError}
                maxLength={6}
                className="text-center text-lg font-mono tracking-widest"
              />
              <Button type="submit" variant="secondary" className="w-full">
                참여하기
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
