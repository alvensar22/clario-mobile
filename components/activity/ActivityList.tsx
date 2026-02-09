import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';

import type { ApiActivityItem } from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { RelativeTime } from '@/components/feed/RelativeTime';

function snippet(text: string, maxLen: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= maxLen ? t : t.slice(0, maxLen) + '…';
}

interface ActivityListProps {
  items: ApiActivityItem[];
  hasMore: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function ActivityList({
  items,
  hasMore,
  onLoadMore,
  onRefresh,
  refreshing,
}: ActivityListProps) {
  const router = useRouter();

  const renderItem = useCallback(
    ({ item }: { item: ApiActivityItem }) => (
      <ActivityItemRow
        item={item}
        onPressPost={(postId) => router.push(`/post/${postId}`)}
        onPressProfile={(username) => router.push(`/profile/${username}`)}
      />
    ),
    [router]
  );

  const keyExtractor = useCallback((item: ApiActivityItem) => item.id, []);

  const ListEmpty = useCallback(
    () => (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No activity yet.</Text>
        <Text style={styles.emptySubtitle}>
          Your likes, comments, and follows will show up here.
        </Text>
      </View>
    ),
    []
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={ListEmpty}
      contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#737373"
        />
      }
    />
  );
}

interface ActivityItemRowProps {
  item: ApiActivityItem;
  onPressPost: (postId: string) => void;
  onPressProfile: (username: string) => void;
}

function ActivityItemRow({
  item,
  onPressPost,
  onPressProfile,
}: ActivityItemRowProps) {
  if (item.type === 'like') {
    const username = item.post.author?.username ?? 'unknown';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPressPost(item.post_id)}
        activeOpacity={0.7}>
        <View style={styles.iconWrapLike}>
          <MaterialIcons name="favorite" size={20} color="#f87171" />
        </View>
        <View style={styles.body}>
          <Text style={styles.message}>
            You liked a post by <Text style={styles.handle}>@{username}</Text>
          </Text>
          <Text style={styles.snippet} numberOfLines={2}>
            {snippet(item.post.content, 80)}
          </Text>
          <RelativeTime isoDate={item.created_at} style={styles.time} />
        </View>
      </TouchableOpacity>
    );
  }

  if (item.type === 'comment') {
    const username = item.post.author?.username ?? 'unknown';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPressPost(item.post_id)}
        activeOpacity={0.7}>
        <View style={styles.iconWrapComment}>
          <MaterialIcons name="chat-bubble-outline" size={20} color="#60a5fa" />
        </View>
        <View style={styles.body}>
          <Text style={styles.message}>
            You commented on a post by{' '}
            <Text style={styles.handle}>@{username}</Text>
          </Text>
          <Text style={styles.snippet} numberOfLines={2}>
            "{snippet(item.comment_content, 60)}"
          </Text>
          <RelativeTime isoDate={item.created_at} style={styles.time} />
        </View>
      </TouchableOpacity>
    );
  }

  if (item.type === 'follow') {
    const username = item.user.username ?? 'unknown';
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => onPressProfile(username)}
        activeOpacity={0.7}>
        <Avatar
          src={item.user.avatar_url}
          fallback={username}
          size="md"
        />
        <View style={styles.body}>
          <Text style={styles.message}>
            You followed <Text style={styles.handle}>@{username}</Text>
          </Text>
          <RelativeTime isoDate={item.created_at} style={styles.time} />
        </View>
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 40 },
  emptyContainer: { flexGrow: 1, paddingTop: 48 },
  empty: { paddingHorizontal: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, color: '#a3a3a3', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#737373', textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  iconWrapLike: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapComment: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  message: { fontSize: 14, color: '#e5e5e5' },
  handle: { fontWeight: '600', color: '#fff' },
  snippet: {
    marginTop: 4,
    fontSize: 13,
    color: '#a3a3a3',
    lineHeight: 18,
  },
  time: { marginTop: 6 },
});
