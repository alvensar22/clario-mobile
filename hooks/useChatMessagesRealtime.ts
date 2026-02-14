import { createClient } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import { getAccessToken } from '@/store/auth-tokens';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/env';
import type { ApiChatMessage } from '@/types/api';

/**
 * Subscribes to Supabase Realtime for new messages in a single chat.
 * When a new message is inserted, calls onNewMessage so the conversation UI can append it.
 */
export function useChatMessagesRealtime(
  chatId: string | null,
  onNewMessage: (message: ApiChatMessage) => void
) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const onNewMessageRef = useRef(onNewMessage);
  onNewMessageRef.current = onNewMessage;

  useEffect(() => {
    if (!chatId || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

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
        .channel(`chat-messages:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            if (!mounted) return;
            const row = payload.new as Record<string, unknown>;
            const msg: ApiChatMessage = {
              id: row.id as string,
              chat_id: row.chat_id as string,
              sender_id: row.sender_id as string,
              content: (row.content as string) ?? '',
              media_urls: (row.media_urls as string[] | undefined) ?? undefined,
              created_at: row.created_at as string,
              reply_to: undefined,
              reactions: [],
            };
            onNewMessageRef.current(msg);
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Chat] Realtime subscription failed:', status);
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
  }, [chatId]);
}
