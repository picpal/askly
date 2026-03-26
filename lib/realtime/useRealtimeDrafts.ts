'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuestionStore } from '@/store/questionStore';
import { getDraftChannel } from './channels';
import type { AIDraft } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

function toDraft(row: Record<string, unknown>): AIDraft {
  return {
    id: row.id as string,
    questionId: row.question_id as string,
    content: row.content as string | undefined,
    status: row.status as AIDraft['status'],
    model: row.model as string | undefined,
    errorMsg: row.error_msg as string | undefined,
    createdAt: row.created_at as string,
  };
}

/**
 * Admin-only hook: listens for AI draft INSERT/UPDATE events
 * and exposes the latest draft state per question.
 */
export function useRealtimeDrafts(sessionId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AIDraft>>({});

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channelName = getDraftChannel(sessionId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_drafts',
        },
        (payload) => {
          if (
            payload.eventType === 'INSERT' ||
            payload.eventType === 'UPDATE'
          ) {
            const draft = toDraft(payload.new);

            // Filter client-side: only track drafts for questions in this session
            const { questions } = useQuestionStore.getState();
            const belongsToSession = questions.some(
              (q) => q.id === draft.questionId
            );
            if (!belongsToSession) return;

            setDrafts((prev) => ({ ...prev, [draft.questionId]: draft }));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  return { drafts };
}
