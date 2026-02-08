import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

import { LogoIcon } from '@/components/ui/LogoIcon';
import { api } from '@/services/api/client';
import type { ApiPost } from '@/types/api';
import { useAuthStore } from '@/store/auth';

type FeedTab = 'explore' | 'following' | 'interests';
const FEED_OPTIONS: { value: FeedTab; label: string }[] = [
  { value: 'explore', label: 'For you' },
  { value: 'following', label: 'Following' },
  { value: 'interests', label: 'My Interests' },
];

export default function HomeScreen() {
  const [tab, setTab] = useState<FeedTab>('explore');
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const { data, error } = await api.getPosts(tab);
    if (error) return;
    setPosts(data?.posts ?? []);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  }, [fetchFeed]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <LogoIcon size={28} color="#fff" />
          <Text style={styles.logoText}>clario</Text>
        </View>
        <View style={styles.tabRow}>
          {FEED_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setTab(opt.value)}
              style={[styles.tab, tab === opt.value && styles.tabActive]}
              activeOpacity={0.7}>
              <Text style={[styles.tabText, tab === opt.value && styles.tabTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptySubtitle}>
            {tab === 'explore'
              ? 'When people post, they’ll show up here.'
              : tab === 'following'
                ? 'Follow people to see their posts here.'
                : 'Add interests to see posts about what you care about.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.author}>@{item.author?.username ?? 'unknown'}</Text>
                {item.interest ? (
                  <Text style={styles.interest}>{item.interest.name}</Text>
                ) : null}
              </View>
              <Text style={styles.content}>{item.content}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.meta}>
                  {(item.like_count ?? 0)} likes · {(item.comment_count ?? 0)} comments
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#262626' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logoText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#737373' },
  tabTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#a3a3a3', textAlign: 'center' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  author: { fontSize: 14, fontWeight: '600', color: '#fff' },
  interest: { fontSize: 12, color: '#a3a3a3' },
  content: { fontSize: 15, color: '#e5e5e5', lineHeight: 22 },
  cardFooter: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#262626' },
  meta: { fontSize: 12, color: '#737373' },
});
