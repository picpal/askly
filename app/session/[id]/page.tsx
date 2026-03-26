'use client';

import { useParams } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import QuestionFeed from '@/components/question/QuestionFeed';
import QuestionSubmitForm from '@/components/question/QuestionSubmitForm';
import SessionCodeBadge from '@/components/session/SessionCodeBadge';
import RealtimeProvider from '@/components/providers/RealtimeProvider';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const { session } = useSessionStore();
  const queryClient = useQueryClient();

  const handleSubmitted = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['questions', sessionId] });
  }, [queryClient, sessionId]);

  return (
    <RealtimeProvider sessionId={sessionId}>
      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {session?.title || 'Q&A 세션'}
              </h1>
              {session?.description && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {session.description}
                </p>
              )}
            </div>
            {session?.code && <SessionCodeBadge code={session.code} />}
          </div>
        </header>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <QuestionSubmitForm
            sessionId={sessionId}
            onSubmitted={handleSubmitted}
          />
          <QuestionFeed sessionId={sessionId} />
        </div>
      </main>
    </RealtimeProvider>
  );
}
