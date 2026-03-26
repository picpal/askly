'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuestionStore } from '@/store/questionStore';
import { getQuestionChannel } from './channels';
import type { Question } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** DB snake_case row -> client Question camelCase */
function toQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    authorId: row.author_id as string,
    authorNickname: row.author_nickname as string,
    content: row.content as string,
    isPrivate: row.is_private as boolean,
    thumbCount: (row.thumb_count as number) ?? 0,
    isPinned: (row.is_pinned as boolean) ?? false,
    createdAt: row.created_at as string,
  };
}

export function useRealtimeQuestions(sessionId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channelName = getQuestionChannel(sessionId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const store = useQuestionStore.getState();

          switch (payload.eventType) {
            case 'INSERT': {
              const q = toQuestion(payload.new);
              // Avoid duplicates (optimistic add may already exist)
              const exists = store.questions.some((x) => x.id === q.id);
              if (!exists) {
                store.addQuestion(q);
              }
              break;
            }
            case 'UPDATE': {
              const q = toQuestion(payload.new);
              store.updateQuestion(q.id, q);
              break;
            }
            case 'DELETE': {
              const oldId = (payload.old as Record<string, unknown>)?.id as string | undefined;
              if (oldId) {
                store.removeQuestion(oldId);
              }
              break;
            }
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
}
