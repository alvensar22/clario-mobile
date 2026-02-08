import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

import { api } from '@/services/api/client';
import type { ApiFollowListUser } from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';

export type FollowListMode = 'followers' | 'following';

interface FollowListModalProps {
  username: string;
  mode: FollowListMode;
  onClose: () => void;
}

export function FollowListModal({ username, mode, onClose }: FollowListModalProps) {
  const router = useRouter();
  const [users, setUsers] = useState<ApiFollowListUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res =
      mode === 'followers'
        ? await api.getFollowers(username)
        : await api.getFollowing(username);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setUsers(res.data?.users ?? []);
  }, [username, mode]);

  useEffect(() => {
    load();
  }, [load]);

  const title = mode === 'followers' ? 'Followers' : 'Following';

  const openProfile = (u: ApiFollowListUser) => {
    onClose();
    const un = u.username ?? '';
    if (un) router.push(`/profile/${un}`);
  };

  return (
    <Modal visible transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {loading ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : users.length === 0 ? (
              <Text style={styles.empty}>
                {mode === 'followers'
                  ? 'No followers yet.'
                  : 'Not following anyone yet.'}
              </Text>
            ) : (
              users.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.row}
                  onPress={() => openProfile(u)}
                  activeOpacity={0.7}>
                  <Avatar
                    src={u.avatar_url}
                    fallback={u.username ?? '?'}
                    size="md"
                  />
                  <Text style={styles.username} numberOfLines={1}>
                    @{u.username ?? 'unknown'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    backgroundColor: '#171717',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  list: { maxHeight: 360 },
  listContent: { paddingVertical: 8, paddingBottom: 16 },
  centered: { paddingVertical: 32, alignItems: 'center' },
  error: { color: '#f87171', padding: 20, textAlign: 'center' },
  empty: { color: '#737373', padding: 24, textAlign: 'center', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  username: { flex: 1, fontSize: 15, fontWeight: '500', color: '#fff' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#262626',
    padding: 16,
  },
  closeBtn: {
    backgroundColor: '#262626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
