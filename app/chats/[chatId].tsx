import { ArrowLeft, Send } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/services/api/client';
import type { ApiChatMessage } from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { RelativeTime } from '@/components/feed/RelativeTime';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { useChatMessagesRealtime } from '@/hooks/useChatMessagesRealtime';

function MessageBubble({
  message,
  isFromMe,
  showSeen,
  showAvatar,
  avatarUrl,
  username,
  isFirstInGroup,
  isLastInGroup,
}: {
  message: ApiChatMessage;
  isFromMe: boolean;
  showSeen?: boolean;
  showAvatar: boolean;
  avatarUrl: string | null;
  username: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}) {
  const urls = message.media_urls?.length ? message.media_urls : [];
  const hasText = (message.content ?? '').trim().length > 0;

  const bubbleRadius = (): object => {
    if (isFromMe) {
      if (isFirstInGroup && isLastInGroup) return styles.bubbleSingleMe;
      if (isFirstInGroup) return styles.bubbleFirstMe;
      if (isLastInGroup) return styles.bubbleLastMe;
      return styles.bubbleMiddleMe;
    }
    if (isFirstInGroup && isLastInGroup) return styles.bubbleSingleThem;
    if (isFirstInGroup) return styles.bubbleFirstThem;
    if (isLastInGroup) return styles.bubbleLastThem;
    return styles.bubbleMiddleThem;
  };

  return (
    <View
      style={[
        styles.bubbleRow,
        isFromMe ? styles.bubbleRowMe : styles.bubbleRowThem,
        isLastInGroup ? styles.bubbleRowSpaced : styles.bubbleRowTight,
      ]}>
      {!isFromMe && (
        <View style={styles.avatarSlot}>
          {showAvatar ? (
            <Avatar
              src={avatarUrl}
              fallback={username}
              size="sm"
              sizePx={32}
            />
          ) : null}
        </View>
      )}
      <View style={[styles.bubbleCol, isFromMe ? styles.bubbleColMe : styles.bubbleColThem]}>
        <View style={[styles.bubble, isFromMe ? styles.bubbleMe : styles.bubbleThem, bubbleRadius()]}>
          {message.reply_to && (
            <View style={[styles.replyPreview, isFromMe ? styles.replyPreviewMe : styles.replyPreviewThem]}>
              <Text style={styles.replyText} numberOfLines={2}>
                {message.reply_to.content}
              </Text>
            </View>
          )}
          {urls.length > 0 && (
            <View style={styles.mediaWrap}>
              {urls.map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.mediaImage} resizeMode="cover" />
              ))}
            </View>
          )}
          {hasText && <Text style={styles.bubbleText}>{message.content}</Text>}
        </View>
        {isLastInGroup && (
          <View style={styles.bubbleFooter}>
            <RelativeTime isoDate={message.created_at} style={[styles.bubbleTime, isFromMe ? styles.bubbleTimeMe : styles.bubbleTimeThem]} />
            {isFromMe && showSeen && <Text style={styles.seen}>Seen</Text>}
          </View>
        )}
      </View>
    </View>
  );
}

export default function ChatConversationScreen() {
  const params = useLocalSearchParams<{
    chatId: string;
    username: string;
    otherUserId: string;
    avatarUrl?: string;
  }>();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id) ?? null;
  const setChatUnreadCount = useChatStore((s) => s.setUnreadCount);

  const chatId = params.chatId ?? '';
  const username = params.username ?? 'Unknown';
  const otherUserId = params.otherUserId ?? '';
  const avatarUrl = params.avatarUrl ?? null;

  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [recipientLastReadAt, setRecipientLastReadAt] = useState<string | null>(null);
  const [myLastReadAt, setMyLastReadAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    const { data } = await api.getChatMessages(chatId, 50, 0);
    if (data?.messages) setMessages(data.messages);
    setRecipientLastReadAt(data?.recipient_last_read_at ?? null);
    setMyLastReadAt(data?.my_last_read_at ?? null);
    setLoading(false);
    await api.markChatRead(chatId);
    setMyLastReadAt(new Date().toISOString());
    api.getChatUnreadCount().then(({ data: countData }) => {
      if (countData?.count != null) setChatUnreadCount(countData.count);
    });
  }, [chatId, setChatUnreadCount]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const onRealtimeMessage = useCallback(
    (msg: ApiChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender_id === otherUserId) {
        api.markChatRead(chatId);
        setMyLastReadAt(new Date().toISOString());
        api.getChatUnreadCount().then(({ data }) => {
          if (data?.count != null) setChatUnreadCount(data.count);
        });
      }
    },
    [chatId, otherUserId, setChatUnreadCount]
  );

  useChatMessagesRealtime(chatId || null, onRealtimeMessage);

  const sendMessage = useCallback(async () => {
    const content = (input ?? '').trim();
    if (!content || !chatId || sending) return;
    setSending(true);
    setInput('');
    const { data, error } = await api.sendChatMessage(chatId, { content });
    setSending(false);
    if (error) {
      setInput(content);
      return;
    }
    if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  }, [input, chatId, sending]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages.length]);

  const isFromMe = (msg: ApiChatMessage) => msg.sender_id === currentUserId;
  const isSeen = (msg: ApiChatMessage) => {
    if (msg.sender_id !== currentUserId) return false;
    const readAt = recipientLastReadAt;
    if (!readAt) return false;
    return new Date(msg.created_at).getTime() <= new Date(readAt).getTime();
  };

  const reversedMessages = [...messages].reverse();

  const renderItem = useCallback(
    ({ item, index }: { item: ApiChatMessage; index: number }) => {
      const next = reversedMessages[index + 1]; // older message (above on screen)
      const prev = reversedMessages[index - 1]; // newer message (below on screen)
      const nextSameSender = next?.sender_id === item.sender_id;
      const prevSameSender = prev?.sender_id === item.sender_id;
      // Chronological first = oldest in group = top of group = no next same sender
      const isFirstInGroup = !nextSameSender;
      // Chronological last = newest in group = bottom of group = no prev same sender
      const isLastInGroup = !prevSameSender;
      const showAvatar = !isFromMe(item) && isLastInGroup;

      return (
        <MessageBubble
          message={item}
          isFromMe={isFromMe(item)}
          showSeen={isSeen(item)}
          showAvatar={showAvatar}
          avatarUrl={avatarUrl}
          username={username}
          isFirstInGroup={isFirstInGroup}
          isLastInGroup={isLastInGroup}
        />
      );
    },
    [recipientLastReadAt, reversedMessages, avatarUrl, username]
  );

  const keyExtractor = useCallback((item: ApiChatMessage) => item.id, []);

  if (!chatId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={24} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.title}>Chat</Text>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Chat not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => router.push(`/profile/${username}`)}
          activeOpacity={0.8}>
          <Avatar src={avatarUrl} fallback={username} size="sm" sizePx={32} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {username}
          </Text>
        </TouchableOpacity>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
          <FlatList
            ref={listRef}
            data={reversedMessages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            inverted
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No messages yet. Say hi!</Text>
              </View>
            }
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#737373"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              editable={!sending}
            />
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!input.trim() || sending}
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              activeOpacity={0.7}>
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={20} color="#fff" strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  backBtn: { padding: 8, minWidth: 40 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff', flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  keyboard: { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 8 },
  empty: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#737373' },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end' },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  bubbleRowTight: { marginBottom: 6 },
  bubbleRowSpaced: { marginBottom: 12 },
  avatarSlot: { width: 32, height: 32, marginRight: 6, justifyContent: 'flex-end', alignItems: 'center' },
  bubbleCol: { maxWidth: '80%', minWidth: 0 },
  bubbleColMe: { alignItems: 'flex-end' },
  bubbleColThem: { alignItems: 'flex-start' },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: { backgroundColor: '#3797f0' },
  bubbleThem: { backgroundColor: '#262626' },
  bubbleSingleMe: { borderRadius: 20, borderBottomRightRadius: 4 },
  bubbleFirstMe: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 4 },
  bubbleLastMe: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopRightRadius: 4 },
  bubbleMiddleMe: { borderTopRightRadius: 4, borderBottomRightRadius: 4, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 },
  bubbleSingleThem: { borderRadius: 20, borderBottomLeftRadius: 4 },
  bubbleFirstThem: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4 },
  bubbleLastThem: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopLeftRadius: 4 },
  bubbleMiddleThem: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4, borderTopRightRadius: 20, borderBottomRightRadius: 20 },
  replyPreview: { paddingLeft: 8, marginBottom: 6 },
  replyPreviewMe: { borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.5)' },
  replyPreviewThem: { borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.4)' },
  replyText: { fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  mediaWrap: { marginBottom: 4 },
  mediaImage: { width: 200, height: 200, borderRadius: 12, marginTop: 4 },
  bubbleText: { fontSize: 15, color: '#fff', marginBottom: 0 },
  bubbleFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 4 },
  bubbleTime: { fontSize: 11 },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.8)' },
  bubbleTimeThem: { color: '#737373' },
  seen: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#262626',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#262626',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3797f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#f87171', fontSize: 16 },
});
