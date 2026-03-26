'use client';

import { useParams } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import AdminPanel from '@/components/admin/AdminPanel';
import QRCodeDisplay from '@/components/session/QRCodeDisplay';
import SessionCodeBadge from '@/components/session/SessionCodeBadge';
import Link from 'next/link';

export default function AdminPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { session } = useSessionStore();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">
              {session?.title || '관리자 대시보드'}
            </h1>
            {session?.code && <SessionCodeBadge code={session.code} />}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/${sessionId}/qr`}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              QR 전체화면
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Question Feed + Answer */}
          <div className="lg:col-span-2">
            <AdminPanel sessionId={sessionId} />
          </div>

          {/* Right: Session Info + QR */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                세션 정보
              </h3>
              {session && (
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <span className="font-medium text-gray-700">제목:</span>{' '}
                    {session.title}
                  </p>
                  {session.description && (
                    <p>
                      <span className="font-medium text-gray-700">설명:</span>{' '}
                      {session.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                참여 QR 코드
              </h3>
              {session?.code && <QRCodeDisplay code={session.code} size={180} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
