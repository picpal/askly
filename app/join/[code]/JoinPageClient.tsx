'use client';

import JoinSessionForm from '@/components/session/JoinSessionForm';
import type { Session } from '@/lib/types';

interface JoinPageClientProps {
  session: Session;
}

export default function JoinPageClient({ session }: JoinPageClientProps) {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <JoinSessionForm sessionId={session.id} sessionTitle={session.title} />
      </div>
    </main>
  );
}
