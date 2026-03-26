'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getPresenceChannel } from './channels';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function usePresence(
  sessionId: string,
  userId: string,
  nickname: string
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const supabase = createClient();
    const channelName = getPresenceChannel(sessionId);

    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setParticipantCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId, nickname });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, userId, nickname]);

  return { participantCount };
}
