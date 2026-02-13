import { Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Avatar } from '@/components/feed/Avatar';
import { PremiumPill } from '@/components/premium/PremiumPill';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { api } from '@/services/api/client';
import { useAuthStore } from '@/store/auth';
import { useNotificationsStore } from '@/store/notifications';

export interface AppTabHeaderProps {
  /** Show premium pill next to logo (e.g. on Home) */
  showPremiumPill?: boolean;
}

export function AppTabHeader({ showPremiumPill = false }: AppTabHeaderProps) {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);

  useEffect(() => {
    api.getNotificationUnreadCount().then(({ data }) => {
      if (data?.count != null) setUnreadCount(data.count);
    });
  }, [setUnreadCount]);

  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <View style={styles.logoLeft}>
          <LogoIcon size={28} color="#fff" />
          <Text style={styles.logoText}>clario</Text>
          {showPremiumPill ? <PremiumPill /> : null}
        </View>
        <View style={styles.rightRow}>
          <TouchableOpacity
            onPress={() => router.push('/notifications')}
            hitSlop={12}
            style={styles.bellBtn}
            activeOpacity={0.7}>
            <Bell size={24} color="#fff" strokeWidth={2} />
            {unreadCount != null && unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          {profile ? (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              hitSlop={8}
              style={styles.avatarBtn}
              activeOpacity={0.7}>
              <Avatar
                src={profile.avatar_url}
                fallback={profile.username ?? '?'}
                size="sm"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avatarBtn: { padding: 4 },
  bellBtn: { padding: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
