import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import { FeedListHeader } from '@/components/feed/FeedListHeader';
import { FeedScreenHeader, type FeedTab } from '@/components/feed/FeedScreenHeader';
import { PostCard } from '@/components/feed/PostCard';
import { ScrollToTopButton } from '@/components/feed/ScrollToTopButton';
import { api } from '@/services/api/client';
import type { ApiInterest, ApiPost } from '@/types/api';
import { useAuthStore } from '@/store/auth';
import { useFeedStore } from '@/store/feed';

const SCROLL_TOP_THRESHOLD = 300;

export default function HomeScreen() {
  const listRef = useRef<FlatList>(null);
  const profile = useAuthStore((s) => s.profile);
  const [tab, setTab] = useState<FeedTab>('explore');
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > SCROLL_TOP_THRESHOLD);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const currentUser = profile
    ? { username: profile.username ?? '', avatar_url: profile.avatar_url }
    : { username: '', avatar_url: null };

  const listHeader = (
    <FeedListHeader
      showComposer={!!profile}
      currentUser={currentUser}
      loading={loading}
      refreshing={refreshing}
      postsLength={posts.length}
      tab={tab}
      isPremium={profile?.is_premium}
    />
  );

  return (
    <View style={styles.container}>
      <FeedScreenHeader tab={tab} onTabChange={setTab} isPremium={profile?.is_premium} />

      <FlatList
        ref={listRef}
        data={loading ? [] : posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
            title="Pull down to refresh"
            progressViewOffset={Platform.OS === 'android' ? 56 : 0}
          />
        }
        renderItem={({ item }) => (
          <PostCard post={item} currentUserId={profile?.id} onRefresh={fetchFeed} />
        )}
      />

      <ScrollToTopButton visible={showScrollTop} onPress={scrollToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  list: { paddingBottom: 40, flexGrow: 1 },
});
