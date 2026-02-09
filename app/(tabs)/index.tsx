import { useFocusEffect } from 'expo-router';
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
import { FeedComposer } from '@/components/feed/FeedComposer';
import { FeedEmpty } from '@/components/feed/FeedEmpty';
import { PostCard } from '@/components/feed/PostCard';
import { api } from '@/services/api/client';
import type { ApiInterest, ApiPost } from '@/types/api';
import { useAuthStore } from '@/store/auth';
import { useFeedStore } from '@/store/feed';

type FeedTab = 'explore' | 'following' | 'interests';
const FEED_OPTIONS: { value: FeedTab; label: string }[] = [
  { value: 'explore', label: 'For you' },
  { value: 'following', label: 'Following' },
  { value: 'interests', label: 'My Interests' },
];

export default function HomeScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [tab, setTab] = useState<FeedTab>('explore');
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const { data, error } = await api.getPosts(tab);
    if (error) return;
    setPosts(data?.posts ?? []);
  }, [tab]);

  const loadInterests = useCallback(async () => {
    const { data } = await api.getInterests();
    setInterests(data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchFeed().finally(() => setLoading(false));
  }, [fetchFeed]);

  useEffect(() => {
    loadInterests();
  }, [loadInterests]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFeed(), loadInterests()]);
    setRefreshing(false);
  }, [fetchFeed, loadInterests]);

  useFocusEffect(
    useCallback(() => {
      if (useFeedStore.getState().consumeFeedRefresh()) {
        fetchFeed();
      }
    }, [fetchFeed])
  );

  const currentUser = profile
    ? { username: profile.username ?? '', avatar_url: profile.avatar_url }
    : { username: '', avatar_url: null };

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

      {profile ? (
        <FeedComposer
          currentUser={currentUser}
          interests={interests}
          onSuccess={fetchFeed}
        />
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : posts.length === 0 ? (
        <FeedEmpty variant={tab} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          renderItem={({ item }) => (
            <PostCard post={item} currentUserId={profile?.id} onRefresh={fetchFeed} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  logoText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  tabRow: { flexDirection: 'row', gap: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#737373' },
  tabTextActive: { color: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { paddingBottom: 32 },
});
