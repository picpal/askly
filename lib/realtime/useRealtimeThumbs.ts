'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useQuestionStore } from '@/store/questionStore';
import { getThumbChannel } from './channels';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Optional hook for UI feedback on new thumbs.
 * The actual thumb_count on questions is updated via DB trigger
 * and propagated through the questions realtime channel.
 */
export function useRealtimeThumbs(sessionId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [lastThumbQuestionId, setLastThumbQuestionId] = useState<string | null>(null);

  const clearLastThumb = useCallback(() => setLastThumbQuestionId(null), []);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channelName = getThumbChannel(sessionId);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thumbs',
        },
        (payload) => {
          const questionId = (payload.new as Record<string, unknown>)
            .question_id as string;

          // Filter client-side: only react if the question belongs to this session
          const { questions } = useQuestionStore.getState();
          const belongsToSession = questions.some((q) => q.id === questionId);
          if (!belongsToSession) return;

          setLastThumbQuestionId(questionId);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId]);

  return { lastThumbQuestionId, clearLastThumb };
}
