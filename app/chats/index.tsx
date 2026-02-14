import { ArrowLeft } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/services/api/client';
import type { ApiChat } from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { RelativeTime } from '@/components/feed/RelativeTime';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';

const PAGE_SIZE = 20;

function ChatRow({
  chat,
  currentUserId,
  onPress,
}: {
  chat: ApiChat;
  currentUserId: string | null;
  onPress: () => void;
}) {
  const name = chat.other_user.username ?? 'Unknown';
  const isFromThem = chat.last_message?.sender_id === chat.other_user.id;
  const preview = chat.last_message
    ? (isFromThem ? '' : 'You: ') + (chat.last_message.content || 'Photo')
    : 'No messages yet';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatarWrap}>
        <Avatar
          src={chat.other_user.avatar_url}
          fallback={name}
          size="md"
          sizePx={56}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.username} numberOfLines={1}>
            {name}
          </Text>
          {chat.last_message && (
            <RelativeTime isoDate={chat.last_message.created_at} style={styles.time} />
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
      {chat.unread_count > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>
            {chat.unread_count > 99 ? '99+' : chat.unread_count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function ChatsListScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id) ?? null;
  const setChatUnreadCount = useChatStore((s) => s.setUnreadCount);
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newError, setNewError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const fetchPage = useCallback(async (offset: number) => {
    const { data, error } = await api.getChats(PAGE_SIZE, offset);
    if (error) return { list: [], hasMore: false };
    return {
      list: data?.chats ?? [],
      hasMore: data?.hasMore ?? false,
    };
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const [{ list, hasMore: more }, countRes] = await Promise.all([
      fetchPage(0),
      api.getChatUnreadCount(),
    ]);
    setChats(list);
    setHasMore(more);
    if (countRes.data?.count != null) setChatUnreadCount(countRes.data.count);
    setLoading(false);
  }, [fetchPage, setChatUnreadCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const [{ list, hasMore: more }, countRes] = await Promise.all([
      fetchPage(0),
      api.getChatUnreadCount(),
    ]);
    setChats(list);
    setHasMore(more);
    if (countRes.data?.count != null) setChatUnreadCount(countRes.data.count);
    setRefreshing(false);
  }, [fetchPage, setChatUnreadCount]);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || chats.length === 0) return;
    const { list, hasMore: more } = await fetchPage(chats.length);
    if (list.length) setChats((prev) => [...prev, ...list]);
    setHasMore(more);
  }, [fetchPage, hasMore, chats.length]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useFocusEffect(
    useCallback(() => {
      api.getChatUnreadCount().then(({ data }) => {
        if (data?.count != null) setChatUnreadCount(data.count);
      });
    }, [setChatUnreadCount])
  );

  const handleStartChat = useCallback(async () => {
    const username = newUsername.trim().replace(/^@/, '');
    if (!username) {
      setNewError('Enter a username');
      return;
    }
    setStarting(true);
    setNewError(null);
    const { data: user, error: userError } = await api.getUserByUsername(username);
    if (userError || !user?.id) {
      setStarting(false);
      setNewError('User not found');
      return;
    }
    const { data: chatRes, error: chatError } = await api.createOrGetChat(user.id);
    setStarting(false);
    if (chatError || !chatRes?.chatId) {
      setNewError('Could not start chat');
      return;
    }
    setNewUsername('');
    router.push({
      pathname: '/chats/[chatId]',
      params: {
        chatId: chatRes.chatId,
        username: user.username ?? username,
        otherUserId: user.id,
        avatarUrl: user.avatar_url ?? '',
      },
    });
    const newChat: ApiChat = {
      id: chatRes.chatId,
      other_user: { id: user.id, username: user.username, avatar_url: user.avatar_url },
      last_message: null,
      unread_count: 0,
      updated_at: new Date().toISOString(),
    };
    setChats((prev) => {
      if (prev.some((c) => c.id === newChat.id)) return prev;
      return [newChat, ...prev];
    });
  }, [newUsername, router]);

  const handleChatPress = useCallback(
    (chat: ApiChat) => {
      router.push({
        pathname: '/chats/[chatId]',
        params: {
          chatId: chat.id,
          username: chat.other_user.username ?? '',
          otherUserId: chat.other_user.id,
          avatarUrl: chat.other_user.avatar_url ?? '',
        },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ApiChat }) => (
      <ChatRow
        chat={item}
        currentUserId={currentUserId}
        onPress={() => handleChatPress(item)}
      />
    ),
    [currentUserId, handleChatPress]
  );

  const keyExtractor = useCallback((item: ApiChat) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <>
          <View style={styles.newChatRow}>
            <TextInput
              style={styles.newChatInput}
              placeholder="Username to message"
              placeholderTextColor="#737373"
              value={newUsername}
              onChangeText={(t) => { setNewUsername(t); setNewError(null); }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={handleStartChat}
              disabled={starting}
              style={[styles.newChatBtn, starting && styles.newChatBtnDisabled]}
              activeOpacity={0.7}>
              {starting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.newChatBtnText}>Message</Text>
              )}
            </TouchableOpacity>
          </View>
          {newError ? <Text style={styles.newError}>{newError}</Text> : null}
          <FlatList
            data={chats}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[styles.list, chats.length === 0 && styles.listEmpty]}
            refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              title="Pull to refresh"
              progressViewOffset={Platform.OS === 'android' ? 60 : 0}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                When you message someone, your conversations will show up here.
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  newChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  newChatInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#262626',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#fff',
  },
  newChatBtn: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3797f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatBtnDisabled: { opacity: 0.6 },
  newChatBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  newError: { paddingHorizontal: 16, paddingTop: 4, fontSize: 13, color: '#ef4444' },
  list: { paddingBottom: Platform.OS === 'android' ? 24 : 48 },
  listEmpty: { flexGrow: 1, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  avatarWrap: { marginRight: 14 },
  content: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  username: { fontSize: 16, fontWeight: '600', color: '#fff' },
  time: { fontSize: 12, color: '#737373' },
  preview: { fontSize: 14, color: '#a3a3a3' },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  empty: { paddingVertical: 48, paddingHorizontal: 32, alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#737373', textAlign: 'center', lineHeight: 22 },
});
