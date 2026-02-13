import { createClient } from '@supabase/supabase-js';
import { useEffect, useRef } from 'react';

import { useNotificationsStore } from '@/store/notifications';
import { getAccessToken } from '@/store/auth-tokens';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/env';

/**
 * Subscribes to Supabase Realtime for the notifications table.
 * When a new notification is inserted for the current user, updates the notifications store
 * (unread count + version) so the bell badge and notifications list update in realtime.
 * Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to be set.
 */
export function useNotificationsRealtime(userId: string | null) {
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const onRealtimeNew = useNotificationsStore((s) => s.onRealtimeNew);

  useEffect(() => {
    if (!userId) return;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return; // Realtime disabled when Supabase env not set; bell still works via initial fetch
    }

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
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            if (mounted) onRealtimeNew();
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn('[Notifications] Realtime subscription failed:', status);
          }
        });

      channelRef.current = channel;
    };

    setup();
    return () => {
      mounted = false;
      const supabase = supabaseRef.current;
      const channel = channelRef.current;
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
      supabaseRef.current = null;
      channelRef.current = null;
    };
  }, [userId, onRealtimeNew]);
}
