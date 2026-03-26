'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { useRealtimeQuestions } from '@/lib/realtime/useRealtimeQuestions';
import { useRealtimeAnswers } from '@/lib/realtime/useRealtimeAnswers';
import { useRealtimeThumbs } from '@/lib/realtime/useRealtimeThumbs';
import { useRealtimeDrafts } from '@/lib/realtime/useRealtimeDrafts';
import { usePresence } from '@/lib/realtime/usePresence';
import { useSessionStore } from '@/store/sessionStore';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface RealtimeProviderProps {
  sessionId: string;
  children: ReactNode;
}

/**
 * Activates realtime subscriptions based on user role.
 * All participants: questions, answers, thumbs
 * Admin only: AI drafts, presence
 *
 * Falls back to polling (refetchInterval) if WebSocket connection fails.
 */
export default function RealtimeProvider({
  sessionId,
  children,
}: RealtimeProviderProps) {
  const { user } = useSessionStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <>
      <RealtimeSubscriptions sessionId={sessionId} />
      {isAdmin && (
        <AdminRealtimeSubscriptions
          sessionId={sessionId}
          userId={user?.id ?? ''}
          nickname={user?.nickname ?? ''}
        />
      )}
      {children}
    </>
  );
}

/** Subscriptions shared by all participants */
function RealtimeSubscriptions({ sessionId }: { sessionId: string }) {
  const [connected, setConnected] = useState(true);
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Core realtime hooks
  useRealtimeQuestions(sessionId);
  useRealtimeAnswers(sessionId);
  useRealtimeThumbs(sessionId);

  // Monitor WebSocket connection health
  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`health:${sessionId}`)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Fallback polling when WebSocket is down
  useEffect(() => {
    if (!connected) {
      intervalRef.current = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['questions', sessionId] });
      }, 3000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [connected, queryClient, sessionId]);

  return null;
}

/** Admin-only subscriptions */
function AdminRealtimeSubscriptions({
  sessionId,
  userId,
  nickname,
}: {
  sessionId: string;
  userId: string;
  nickname: string;
}) {
  useRealtimeDrafts(sessionId);
  usePresence(sessionId, userId, nickname);
  return null;
}
