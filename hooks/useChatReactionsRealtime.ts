import { createClient } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import { getAccessToken } from '@/store/auth-tokens';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/env';
import type { ApiChatMessage } from '@/types/api';

/**
 * Subscribes to Supabase Realtime for chat_message_reactions INSERT and DELETE.
 * Filters INSERT by chat_id to only receive reactions for the current chat (reduces traffic and avoids cross-chat updates).
 * DELETE events cannot be filtered by Supabase Realtime; we ignore events for other chats via client-side chat_id check when present.
 */
export function useChatReactionsRealtime(
  chatId: string | null,
  currentUserId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<ApiChatMessage[]>>
) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const setMessagesRef = useRef(setMessages);
  const currentUserIdRef = useRef(currentUserId);
  setMessagesRef.current = setMessages;
  currentUserIdRef.current = currentUserId;

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
        .channel(`chat-reactions:${chatId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_message_reactions',
            filter: `chat_id=eq.${chatId}`,
          },
          (payload) => {
            if (!mounted) return;
            const row = payload.new as { message_id: string; user_id: string; emoji: string; chat_id?: string };
            if (row.chat_id != null && row.chat_id !== chatId) return;
            if (row.user_id === currentUserIdRef.current) return;
            setMessagesRef.current((prev) =>
              prev.map((m) => {
                if (m.id !== row.message_id) return m;
                const reactions = [...(m.reactions ?? [])];
                const idx = reactions.findIndex((r) => r.emoji === row.emoji);
                if (idx >= 0) {
                  const existing = reactions[idx];
                  if (existing) {
                    reactions[idx] = {
                      ...existing,
                      count: existing.count + 1,
                      reacted_by_me: existing.reacted_by_me || row.user_id === (currentUserIdRef.current ?? ''),
                    };
                  }
                } else {
                  reactions.push({
                    emoji: row.emoji,
                    count: 1,
                    reacted_by_me: row.user_id === (currentUserIdRef.current ?? ''),
                  });
                }
                return { ...m, reactions };
              })
            );
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'chat_message_reactions',
          },
          (payload) => {
            if (!mounted) return;
            const row = (payload.old ?? (payload as { oldRecord?: Record<string, unknown> }).oldRecord) as
              | { message_id: string; user_id: string; emoji: string; chat_id?: string }
              | undefined;
            if (!row?.message_id || !row?.emoji) return;
            if (row.chat_id != null && row.chat_id !== chatId) return;
            setMessagesRef.current((prev) =>
              prev.map((m) => {
                if (m.id !== row.message_id) return m;
                const reactions = (m.reactions ?? [])
                  .map((r) =>
                    r.emoji === row.emoji
                      ? {
                          ...r,
                          count: Math.max(0, r.count - 1),
                          reacted_by_me: row.user_id === currentUserIdRef.current ? false : r.reacted_by_me,
                        }
                      : r
                  )
                  .filter((r) => r.count > 0);
                return { ...m, reactions };
              })
            );
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Chat reactions] Realtime subscription failed:', status);
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
  }, [chatId, currentUserId]);
}
