'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import QRCodeDisplay from '@/components/session/QRCodeDisplay';
import Button from '@/components/ui/Button';

export default function QRFullscreenPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const router = useRouter();
  const { session } = useSessionStore();

  const code = session?.code || '';

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {session?.title || 'Q&A 세션'}
          </h1>
          <p className="text-gray-500">아래 QR 코드를 스캔하여 참여하세요</p>
        </div>

        {code ? (
          <QRCodeDisplay code={code} size={300} />
        ) : (
          <p className="text-gray-400">세션 정보를 불러올 수 없습니다.</p>
        )}

        <div className="text-6xl font-mono font-bold tracking-[0.3em] text-gray-900">
          {code}
        </div>

        <Button
          variant="secondary"
          onClick={() => router.push(`/admin/${sessionId}`)}
        >
          돌아가기
        </Button>
      </div>
    </main>
  );
}
