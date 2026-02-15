import { createClient } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import { api } from '@/services/api/client';
import { useChatStore } from '@/store/chat';
import { getAccessToken } from '@/store/auth-tokens';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/env';

/**
 * Subscribes to Supabase Realtime for chat_messages INSERT (all chats).
 * When a new message is inserted and it's not from the current user, refetches
 * the chat unread count so the header badge updates in realtime.
 */
export function useChatUnreadRealtime(userId: string | null) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    if (!userId) return;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    let mounted = true;

    const setup = async () => {
      const token = await getAccessToken();
      if (!mounted || !token) return;

      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      supabaseRef.current = supabase;

      try {
        (supabase.realtime as { setAuth?: (token: string) => void }).setAuth?.(token);
      } catch {
        // continue
      }

      const channel = supabase
        .channel(`chat-unread:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            if (!mounted) return;
            const row = payload.new as Record<string, unknown>;
            const senderId = row.sender_id as string;
            if (senderId === userIdRef.current) return;
            api.getChatUnreadCount().then(({ data }) => {
              if (data?.count != null) setUnreadCount(data.count);
            });
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Chat unread] Realtime subscription failed:', status);
          }
        });

      channelRef.current = channel;
    };

    setup();
    return () => {
      mounted = false;
      const supabase = supabaseRef.current;
      const channel = channelRef.current;
      if (supabase && channel) supabase.removeChannel(channel);
      supabaseRef.current = null;
      channelRef.current = null;
    };
  }, [userId, setUnreadCount]);
}
