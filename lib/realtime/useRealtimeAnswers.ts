'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAnswerChannel } from './channels';
import { useQuestionStore } from '@/store/questionStore';
import { useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeAnswers(sessionId: string) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channelName = getAnswerChannel(sessionId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
        },
        (payload) => {
          // Check if this answer belongs to a question in the current session
          // by looking up the question store
          const questionId =
            (payload.new as Record<string, unknown>)?.question_id ??
            (payload.old as Record<string, unknown>)?.question_id;

          if (questionId) {
            const { questions } = useQuestionStore.getState();
            const belongsToSession = questions.some(
              (q) => q.id === questionId
            );
            if (!belongsToSession) return;
          }

          // Re-fetch questions so embedded answers are refreshed
          queryClient.invalidateQueries({ queryKey: ['questions', sessionId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, queryClient]);
}
