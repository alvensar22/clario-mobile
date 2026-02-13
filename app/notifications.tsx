import { ArrowLeft, AtSign, Heart, MessageCircle, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/services/api/client';
import type { ApiNotificationAggregated } from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { RelativeTime } from '@/components/feed/RelativeTime';
import { useNotificationsStore } from '@/store/notifications';

const PAGE_SIZE = 20;

function formatNotificationMessage(item: ApiNotificationAggregated): string {
  const names = item.actors
    .slice(0, 2)
    .map((a) => a.username || 'Someone')
    .filter(Boolean);
  const rest = item.total_count - names.length;
  const who =
    rest > 0 ? `${names.join(', ')} and ${rest} other${rest === 1 ? '' : 's'}` : names.join(' and ');
  switch (item.type) {
    case 'like':
      return `${who} liked your post`;
    case 'comment':
      return `${who} commented on your post`;
    case 'follow':
      return `${who} started following you`;
    case 'mention':
      return `${who} mentioned you`;
    default:
      return 'New notification';
  }
}

function NotificationIcon({ type }: { type: ApiNotificationAggregated['type'] }) {
  const color = '#a78bfa';
  const size = 20;
  let Icon = MessageCircle;
  switch (type) {
    case 'like':
      Icon = Heart;
      break;
    case 'comment':
      Icon = MessageCircle;
      break;
    case 'follow':
      Icon = UserPlus;
      break;
    case 'mention':
      Icon = AtSign;
      break;
    default:
      Icon = MessageCircle;
  }
  return (
    <View style={styles.typeIconWrap}>
      {type === 'like' ? (
        <Heart size={size} color={color} strokeWidth={2} fill={color} />
      ) : (
        <Icon size={size} color={color} strokeWidth={2} />
      )}
    </View>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: ApiNotificationAggregated;
  onPress: () => void;
}) {
  const firstActor = item.actors[0];
  const isUnread = !item.read_at;

  return (
    <TouchableOpacity
      style={[styles.row, isUnread && styles.rowUnread]}
      onPress={onPress}
      activeOpacity={0.7}>
      {isUnread ? <View style={styles.unreadDot} /> : null}
      <View style={styles.avatarWrap}>
        {firstActor ? (
          <Avatar
            src={firstActor.avatar_url}
            fallback={firstActor.username ?? '?'}
            size="md"
            sizePx={44}
          />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.message} numberOfLines={2}>
          {formatNotificationMessage(item)}
        </Text>
        <Text style={styles.time}>
          <RelativeTime isoDate={item.created_at} />
        </Text>
      </View>
      <View style={styles.iconWrap}>
        <NotificationIcon type={item.type} />
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const version = useNotificationsStore((s) => s.version);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationsStore((s) => s.setUnreadCount);
  const [items, setItems] = useState<ApiNotificationAggregated[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchPage = useCallback(async (offset: number) => {
    const { data, error } = await api.getNotifications(PAGE_SIZE, offset);
    if (error) return { list: [], hasMore: false };
    return {
      list: data?.notifications ?? [],
      hasMore: data?.hasMore ?? false,
    };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const [{ list, hasMore: more }, countRes] = await Promise.all([
      fetchPage(0),
      api.getNotificationUnreadCount(),
    ]);
    setItems(list);
    setHasMore(more);
    if (countRes.data?.count != null) setUnreadCount(countRes.data.count);
    setLoading(false);
  }, [fetchPage, setUnreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const [{ list, hasMore: more }, countRes] = await Promise.all([
      fetchPage(0),
      api.getNotificationUnreadCount(),
    ]);
    setItems(list);
    setHasMore(more);
    if (countRes.data?.count != null) setUnreadCount(countRes.data.count);
    setRefreshing(false);
  }, [fetchPage, setUnreadCount]);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || items.length === 0) return;
    const { list, hasMore: more } = await fetchPage(items.length);
    if (list.length) setItems((prev) => [...prev, ...list]);
    setHasMore(more);
  }, [fetchPage, hasMore, items.length]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Realtime: when a new notification arrives (version bumps), refetch list in background
  const refetchSilently = useCallback(async () => {
    const { list, hasMore: more } = await fetchPage(0);
    setItems(list);
    setHasMore(more);
    api.getNotificationUnreadCount().then(({ data }) => {
      if (data?.count != null) setUnreadCount(data.count);
    });
  }, [fetchPage, setUnreadCount]);

  useEffect(() => {
    if (version > 0) refetchSilently();
  }, [version, refetchSilently]);

  const handlePress = useCallback(
    async (item: ApiNotificationAggregated) => {
      await api.markNotificationRead(item.ids);
      setItems((prev) =>
        prev.map((n) =>
          n.ids.some((id) => item.ids.includes(id))
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      api.getNotificationUnreadCount().then(({ data }) => {
        if (data?.count != null) setUnreadCount(data.count);
      });
      if (item.post_id) {
        router.push(`/post/${item.post_id}`);
      } else if (item.actors[0]?.username) {
        router.push(`/profile/${item.actors[0].username}`);
      }
    },
    [router, setUnreadCount]
  );

  const renderItem = useCallback(
    ({ item }: { item: ApiNotificationAggregated }) => (
      <NotificationRow item={item} onPress={() => handlePress(item)} />
    ),
    [handlePress]
  );

  const keyExtractor = useCallback((item: ApiNotificationAggregated) => item.ids[0] ?? item.created_at, []);

  const handleMarkAllRead = useCallback(async () => {
    if ((unreadCount ?? 0) === 0 || markingAllRead) return;
    setMarkingAllRead(true);
    const { error } = await api.markNotificationRead();
    if (!error) {
      setUnreadCount(0);
      setItems((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
    }
    setMarkingAllRead(false);
  }, [unreadCount, markingAllRead, setUnreadCount]);

  const markAllReadHeader =
    (unreadCount ?? 0) > 0 ? (
      <TouchableOpacity
        style={styles.markAllReadRow}
        onPress={handleMarkAllRead}
        disabled={markingAllRead}
        activeOpacity={0.7}>
        {markingAllRead ? (
          <ActivityIndicator size="small" color="#a78bfa" />
        ) : (
          <Text style={styles.markAllReadText}>Mark all read</Text>
        )}
      </TouchableOpacity>
    ) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <>
          {markAllReadHeader}
          <FlatList
            data={items}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, items.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ffffff"
              colors={['#ffffff']}
              title="Pull to refresh"
              titleColor="#a3a3a3"
              progressViewOffset={Platform.OS === 'android' ? 80 : 0}
              progressBackgroundColor={Platform.OS === 'android' ? '#262626' : undefined}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                When someone likes, comments, or follows you, it will show up here.
              </Text>
            </View>
          }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  backBtn: { padding: 8, minWidth: 40 },
  title: { fontSize: 18, fontWeight: '700', color: '#fff' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  markAllReadRow: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  markAllReadText: { fontSize: 15, fontWeight: '600', color: '#a78bfa' },
  list: { paddingTop: 12, paddingBottom: Platform.OS === 'android' ? 24 : 48 },
  listEmpty: { flexGrow: 1, paddingTop: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
    position: 'relative',
  },
  rowUnread: { backgroundColor: 'rgba(167, 139, 250, 0.08)' },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a78bfa',
  },
  avatarWrap: { marginRight: 14 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262626',
  },
  content: { flex: 1 },
  message: { fontSize: 15, color: '#fff', marginBottom: 2 },
  time: { fontSize: 13, color: '#737373' },
  iconWrap: { marginLeft: 12 },
  typeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#737373', textAlign: 'center', lineHeight: 22 },
});
