import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Heart,
  ImagePlus,
  Send,
  Smile,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/feed/Avatar";
import { ImagePreviewModal } from "@/components/feed/ImagePreviewModal";
import { RelativeTime } from "@/components/feed/RelativeTime";
import { useChatMessagesRealtime } from "@/hooks/useChatMessagesRealtime";
import { useChatReactionsRealtime } from "@/hooks/useChatReactionsRealtime";
import { api } from "@/services/api/client";
import { useAuthStore } from "@/store/auth";
import { useChatStore } from "@/store/chat";
import type { ApiChatMessage } from "@/types/api";

const MAX_IMAGES = 5;
const MEDIA_GRID_SIZE = 220;
const MEDIA_GAP = 2;

const EMOJI_GRID = [
  "❤️",
  "👍",
  "😂",
  "😮",
  "😢",
  "🔥",
  "👏",
  "🙏",
  "😊",
  "🥺",
  "😍",
  "🤔",
  "😎",
  "🥳",
  "😭",
  "🤣",
  "💯",
  "✨",
  "🎉",
  "💪",
];

const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥", "👏", "🙏"];

function MessageBubble({
  message,
  isFromMe,
  showSeen,
  showAvatar,
  avatarUrl,
  username,
  isFirstInGroup,
  isLastInGroup,
  currentUserId,
  chatId,
  onPressImage,
  onReaction,
  onOpenReactionPicker,
  onPressReply,
  onPressReplyPreview,
  isHighlighted,
}: {
  message: ApiChatMessage;
  isFromMe: boolean;
  showSeen?: boolean;
  showAvatar: boolean;
  avatarUrl: string | null;
  username: string;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  currentUserId: string | null;
  chatId: string;
  onPressImage?: (images: string[], index: number) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onOpenReactionPicker?: () => void;
  onPressReply?: () => void;
  onPressReplyPreview?: (messageId: string) => void;
  isHighlighted?: boolean;
}) {
  const urls = message.media_urls?.length ? message.media_urls : [];
  const hasText = (message.content ?? "").trim().length > 0;
  const n = urls.length;
  const reactions = message.reactions ?? [];

  const SWIPE_THRESHOLD = 50;
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(15)
        .activeOffsetX(20)
        .failOffsetY([-18, 18])
        .onEnd((e) => {
          "worklet";
          const tx = e.translationX;
          if (isFromMe && tx < -SWIPE_THRESHOLD && onPressReply)
            runOnJS(onPressReply)();
          if (!isFromMe && tx > SWIPE_THRESHOLD && onPressReply)
            runOnJS(onPressReply)();
        }),
    [isFromMe, onPressReply],
  );

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
    <GestureDetector gesture={panGesture}>
      <View
        style={[
          styles.bubbleRow,
          isFromMe ? styles.bubbleRowMe : styles.bubbleRowThem,
          isLastInGroup ? styles.bubbleRowSpaced : styles.bubbleRowTight,
          isHighlighted && styles.bubbleRowHighlight,
        ]}
      >
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
        <View
          style={[
            styles.bubbleCol,
            isFromMe ? styles.bubbleColMe : styles.bubbleColThem,
          ]}
        >
          <View
            style={[
              styles.bubbleWrap,
              reactions.length > 0 && styles.bubbleWrapWithReactions,
            ]}
          >
            <TouchableOpacity
              activeOpacity={1}
              onLongPress={onOpenReactionPicker}
              delayLongPress={400}
              style={[
                styles.bubble,
                isFromMe ? styles.bubbleMe : styles.bubbleThem,
                bubbleRadius(),
              ]}
            >
              {message.reply_to && (
                <TouchableOpacity
                  style={[
                    styles.replyPreview,
                    isFromMe ? styles.replyPreviewMe : styles.replyPreviewThem,
                  ]}
                  onPress={() => onPressReplyPreview?.(message.reply_to!.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.replyLabel}>
                    {message.reply_to.sender_id === currentUserId
                      ? "You"
                      : username}
                  </Text>
                  <Text style={styles.replyText} numberOfLines={2}>
                    {message.reply_to.content}
                  </Text>
                </TouchableOpacity>
              )}
              {urls.length > 0 && (
                <View style={styles.mediaGrid}>
                  {n === 1 && (
                    <TouchableOpacity
                      onPress={() => onPressImage?.(urls, 0)}
                      style={styles.mediaCell1}
                      activeOpacity={0.95}
                    >
                      <Image
                        source={{ uri: urls[0] }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    </TouchableOpacity>
                  )}
                  {n === 2 && (
                    <View style={styles.mediaRow2}>
                      <TouchableOpacity
                        onPress={() => onPressImage?.(urls, 0)}
                        style={styles.mediaCellHalf}
                        activeOpacity={0.95}
                      >
                        <Image
                          source={{ uri: urls[0] }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      </TouchableOpacity>
                      <View style={styles.mediaGap} />
                      <TouchableOpacity
                        onPress={() => onPressImage?.(urls, 1)}
                        style={styles.mediaCellHalf}
                        activeOpacity={0.95}
                      >
                        <Image
                          source={{ uri: urls[1] }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                  {n === 3 && (
                    <View style={styles.mediaRow3}>
                      <TouchableOpacity
                        onPress={() => onPressImage?.(urls, 0)}
                        style={styles.mediaCellLeft3}
                        activeOpacity={0.95}
                      >
                        <Image
                          source={{ uri: urls[0] }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      </TouchableOpacity>
                      <View style={styles.mediaGapVertical} />
                      <View style={styles.mediaRight3}>
                        <TouchableOpacity
                          onPress={() => onPressImage?.(urls, 1)}
                          style={styles.mediaCellRightTop}
                          activeOpacity={0.95}
                        >
                          <Image
                            source={{ uri: urls[1] }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        </TouchableOpacity>
                        <View style={styles.mediaGap} />
                        <TouchableOpacity
                          onPress={() => onPressImage?.(urls, 2)}
                          style={styles.mediaCellRightBottom}
                          activeOpacity={0.95}
                        >
                          <Image
                            source={{ uri: urls[2] }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {n >= 4 && (
                    <View style={styles.mediaGrid4}>
                      {urls.slice(0, 4).map((uri, i) => (
                        <TouchableOpacity
                          key={uri + i}
                          onPress={() => onPressImage?.(urls, i)}
                          style={[
                            styles.mediaCell4,
                            (i === 1 || i === 3) && styles.mediaCell4Right,
                            i >= 2 && styles.mediaCell4Bottom,
                          ]}
                          activeOpacity={0.95}
                        >
                          <Image
                            source={{ uri }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                          {i === 3 && n > 4 && (
                            <View style={styles.mediaMoreOverlay}>
                              <Text style={styles.mediaMoreText}>+{n - 4}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
              {hasText && (
                <Text style={styles.bubbleText}>{message.content}</Text>
              )}
            </TouchableOpacity>
            {reactions.length > 0 && (
              <View
                style={[
                  styles.reactionsRow,
                  isFromMe ? styles.reactionsRowMe : styles.reactionsRowThem,
                ]}
              >
                {reactions.map((r) => (
                  <TouchableOpacity
                    key={r.emoji}
                    style={[
                      styles.reactionPill,
                      r.reacted_by_me && styles.reactionPillMine,
                    ]}
                    onPress={() => onReaction?.(message.id, r.emoji)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                    {r.count > 1 && (
                      <Text style={styles.reactionCount}>{r.count}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {isLastInGroup && (
            <View style={styles.bubbleFooter}>
              <RelativeTime
                isoDate={message.created_at}
                style={[
                  styles.bubbleTime,
                  isFromMe ? styles.bubbleTimeMe : styles.bubbleTimeThem,
                ]}
              />
              {isFromMe && showSeen && <Text style={styles.seen}>Seen</Text>}
            </View>
          )}
        </View>
      </View>
    </GestureDetector>
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

  const chatId = params.chatId ?? "";
  const username = params.username ?? "Unknown";
  const otherUserId = params.otherUserId ?? "";
  const avatarUrl = params.avatarUrl ?? null;

  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [recipientLastReadAt, setRecipientLastReadAt] = useState<string | null>(
    null,
  );
  const [myLastReadAt, setMyLastReadAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingImages, setPendingImages] = useState<
    { id: string; preview: string; url?: string; uploading: boolean }[]
  >([]);
  const [imagePreview, setImagePreview] = useState<{
    images: string[];
    initialIndex: number;
  } | null>(null);
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<
    string | null
  >(null);
  const [replyToMessage, setReplyToMessage] = useState<ApiChatMessage | null>(
    null,
  );
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const listRef = useRef<FlatList>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const inputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current)
        clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

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
    [chatId, otherUserId, setChatUnreadCount],
  );

  useChatMessagesRealtime(chatId || null, onRealtimeMessage);
  useChatReactionsRealtime(chatId || null, currentUserId, setMessages);

  const sendMessage = useCallback(async () => {
    const content = (input ?? "").trim();
    const hasContent = content || pendingImages.length > 0;
    const allUploaded = pendingImages.every((p) => p.url);
    if (!hasContent || !chatId || sending || !allUploaded) return;

    const replyToId = replyToMessage?.id;
    setSending(true);
    const urls = pendingImages
      .map((p) => p.url)
      .filter((u): u is string => !!u);
    setPendingImages([]);
    setInput("");
    setReplyToMessage(null);
    const { data, error } = await api.sendChatMessage(chatId, {
      ...(content ? { content } : {}),
      ...(urls.length ? { media_urls: urls } : {}),
      ...(replyToId ? { reply_to_id: replyToId } : {}),
    });
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
  }, [input, chatId, sending, pendingImages, replyToMessage?.id]);

  const pickImages = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const remaining = MAX_IMAGES - pendingImages.length;
    const toAdd = result.assets.slice(0, remaining).map((asset) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      preview: asset.uri,
      uploading: true as const,
    }));
    setPendingImages((prev) => [...prev, ...toAdd].slice(0, MAX_IMAGES));
    for (let i = 0; i < toAdd.length; i++) {
      const asset = result.assets[i];
      const itemId = toAdd[i]?.id;
      if (!asset?.uri || !itemId) continue;
      const { data: uploadData } = await api.uploadChatImage(asset.uri);
      setPendingImages((prev) =>
        prev.map((p) =>
          p.id === itemId && p.uploading
            ? { ...p, url: uploadData?.url, uploading: false }
            : p,
        ),
      );
    }
  }, [pendingImages.length]);

  const removePendingImage = useCallback((index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const sendHeart = useCallback(async () => {
    if (!chatId || sending) return;
    const replyToId = replyToMessage?.id;
    setSending(true);
    setReplyToMessage(null);
    const { data, error } = await api.sendChatMessage(chatId, {
      content: "❤️",
      ...(replyToId ? { reply_to_id: replyToId } : {}),
    });
    setSending(false);
    if (!error && data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }
  }, [chatId, sending, replyToMessage?.id]);

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

  const handlePressMessageImage = useCallback(
    (images: string[], index: number) => {
      setImagePreview({ images, initialIndex: index });
    },
    [],
  );

  const scrollToMessage = useCallback(
    (messageId: string) => {
      const index = reversedMessages.findIndex((m) => m.id === messageId);
      if (index < 0) return;
      if (highlightTimeoutRef.current)
        clearTimeout(highlightTimeoutRef.current);
      setHighlightedMessageId(messageId);
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedMessageId(null);
        highlightTimeoutRef.current = null;
      }, 2000);
      listRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [reversedMessages],
  );

  const handleScrollToIndexFailed = useCallback(
    (info: {
      index: number;
      highestMeasuredFrameIndex: number;
      averageItemLength: number;
    }) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: true,
      });
    },
    [],
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!chatId) return;
      const { data, error } = await api.toggleChatReaction(
        chatId,
        messageId,
        emoji,
      );
      if (error || !data) return;
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m.reactions ?? [])];
          const idx = reactions.findIndex((r) => r.emoji === emoji);
          if (data.action === "added") {
            if (idx >= 0) {
              reactions[idx] = {
                ...reactions[idx],
                count: reactions[idx].count + 1,
                reacted_by_me: true,
              };
            } else {
              reactions.push({ emoji, count: 1, reacted_by_me: true });
            }
            return { ...m, reactions };
          }
          if (data.action === "removed" && idx >= 0) {
            const r = reactions[idx];
            const nextReactions =
              r.count <= 1
                ? reactions.filter((_, i) => i !== idx)
                : reactions.map((r2, i) =>
                    i === idx
                      ? { ...r2, count: r2.count - 1, reacted_by_me: false }
                      : r2,
                  );
            return { ...m, reactions: nextReactions };
          }
          return m;
        }),
      );
    },
    [chatId],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: ApiChatMessage; index: number }) => {
      const next = reversedMessages[index + 1]; // older message (above on screen)
      const prev = reversedMessages[index - 1]; // newer message (below on screen)
      const nextSameSender = next?.sender_id === item.sender_id;
      const prevSameSender = prev?.sender_id === item.sender_id;
      const isFirstInGroup = !nextSameSender;
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
          currentUserId={currentUserId}
          chatId={chatId}
          onPressImage={handlePressMessageImage}
          onReaction={handleReaction}
          onOpenReactionPicker={() => setReactionPickerMessageId(item.id)}
          onPressReply={() => setReplyToMessage(item)}
          onPressReplyPreview={scrollToMessage}
          isHighlighted={highlightedMessageId === item.id}
        />
      );
    },
    [
      recipientLastReadAt,
      reversedMessages,
      avatarUrl,
      username,
      handlePressMessageImage,
      handleReaction,
      currentUserId,
      chatId,
      scrollToMessage,
      highlightedMessageId,
    ],
  );

  const keyExtractor = useCallback((item: ApiChatMessage) => item.id, []);

  if (!chatId) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
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
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.backBtn}
        >
          <ArrowLeft size={24} color="#fff" strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => router.push(`/profile/${username}`)}
          activeOpacity={0.8}
        >
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
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <FlatList
            ref={listRef}
            data={reversedMessages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            inverted
            onScrollToIndexFailed={handleScrollToIndexFailed}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No messages yet. Say hi!</Text>
              </View>
            }
          />
          {replyToMessage && (
            <View style={styles.replyBar}>
              <TouchableOpacity
                style={styles.replyBarContent}
                onPress={() => scrollToMessage(replyToMessage.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.replyBarLabel}>
                  Replying to{" "}
                  {replyToMessage.sender_id === currentUserId
                    ? "You"
                    : username}
                </Text>
                <Text style={styles.replyBarPreview} numberOfLines={1}>
                  {replyToMessage.content?.trim() ||
                    (replyToMessage.media_urls?.length ? "Photo" : "")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReplyToMessage(null)}
                style={styles.replyBarClose}
                hitSlop={8}
                accessibilityLabel="Cancel reply"
              >
                <X size={20} color="#737373" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}
          {pendingImages.length > 0 && (
            <View style={styles.pendingImagesRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pendingImagesScroll}
              >
                {pendingImages.map((item, idx) => (
                  <View key={item.id} style={styles.pendingImageWrap}>
                    <Image
                      source={{ uri: item.url ?? item.preview }}
                      style={styles.pendingImage}
                      resizeMode="cover"
                    />
                    {item.uploading && (
                      <View style={styles.pendingImageOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => removePendingImage(idx)}
                      style={styles.pendingImageRemove}
                      hitSlop={8}
                    >
                      <X size={14} color="#fff" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity
              onPress={pickImages}
              disabled={pendingImages.length >= MAX_IMAGES}
              style={styles.actionBtn}
              activeOpacity={0.7}
              accessibilityLabel="Add image"
            >
              <ImagePlus
                size={22}
                color={pendingImages.length >= MAX_IMAGES ? "#525252" : "#fff"}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker((v) => !v)}
              style={[
                styles.actionBtn,
                showEmojiPicker && styles.emojiBtnActive,
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Insert emoji"
            >
              <Smile
                size={22}
                color={showEmojiPicker ? "#3797f0" : "#fff"}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor="#737373"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={2000}
              editable={!sending}
            />
            {input.trim() || pendingImages.length > 0 ? (
              <TouchableOpacity
                onPress={sendMessage}
                disabled={sending || pendingImages.some((p) => p.uploading)}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={22} color="#fff" strokeWidth={2} />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={sendHeart}
                disabled={sending}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Heart size={22} color="#fff" strokeWidth={2} fill="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <Modal
            visible={showEmojiPicker}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEmojiPicker(false)}
          >
            <Pressable
              style={styles.emojiBackdrop}
              onPress={() => setShowEmojiPicker(false)}
            >
              <Pressable
                style={styles.emojiPanel}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.emojiGrid}>
                  {EMOJI_GRID.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.emojiCell}
                      onPress={() => insertEmoji(emoji)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Pressable>
          </Modal>
          {imagePreview && (
            <ImagePreviewModal
              visible={!!imagePreview}
              images={imagePreview.images}
              initialIndex={imagePreview.initialIndex}
              onClose={() => setImagePreview(null)}
            />
          )}
          <Modal
            visible={!!reactionPickerMessageId}
            transparent
            animationType="fade"
            onRequestClose={() => setReactionPickerMessageId(null)}
          >
            <Pressable
              style={styles.reactionPickerModalBackdrop}
              onPress={() => setReactionPickerMessageId(null)}
            >
              <Pressable
                style={styles.reactionPickerModalContent}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={styles.reactionPickerModalRow}>
                  {REACTION_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.reactionPickerBtn}
                      onPress={() => {
                        if (reactionPickerMessageId)
                          handleReaction(reactionPickerMessageId, emoji);
                        setReactionPickerMessageId(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#262626",
  },
  backBtn: { padding: 8, minWidth: 40 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: { fontSize: 16, fontWeight: "600", color: "#fff", flex: 1 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  keyboard: { flex: 1 },
  messageList: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 8 },
  empty: { paddingVertical: 24, alignItems: "center" },
  emptyText: { fontSize: 15, color: "#737373" },
  bubbleRow: { flexDirection: "row", alignItems: "flex-end" },
  bubbleRowMe: { justifyContent: "flex-end" },
  bubbleRowThem: { justifyContent: "flex-start" },
  bubbleRowTight: { marginBottom: 6 },
  bubbleRowSpaced: { marginBottom: 12 },
  bubbleRowHighlight: {
    backgroundColor: "rgba(55,151,240,0.15)",
    borderRadius: 12,
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  avatarSlot: {
    width: 32,
    height: 32,
    marginRight: 6,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bubbleCol: { maxWidth: "80%", minWidth: 0 },
  bubbleColMe: { alignItems: "flex-end" },
  bubbleColThem: { alignItems: "flex-start" },
  bubbleWrap: { position: "relative" },
  bubbleWrapWithReactions: { marginBottom: 20 },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMe: { backgroundColor: "#3797f0" },
  bubbleThem: { backgroundColor: "#262626" },
  bubbleSingleMe: { borderRadius: 20, borderBottomRightRadius: 4 },
  bubbleFirstMe: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleLastMe: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopRightRadius: 4,
  },
  bubbleMiddleMe: {
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  bubbleSingleThem: { borderRadius: 20, borderBottomLeftRadius: 4 },
  bubbleFirstThem: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
  },
  bubbleLastThem: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 4,
  },
  bubbleMiddleThem: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  replyPreview: { paddingLeft: 8, marginBottom: 6 },
  replyPreviewMe: {
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.5)",
  },
  replyPreviewThem: {
    borderLeftWidth: 3,
    borderLeftColor: "rgba(255,255,255,0.4)",
  },
  replyLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 2,
    fontWeight: "600",
  },
  replyText: { fontSize: 13, color: "rgba(255,255,255,0.9)" },
  reactionsRow: {
    position: "absolute",
    bottom: 0,
    transform: [{ translateY: 10 }],
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    zIndex: 10,
  },
  reactionsRowMe: { left: 0, justifyContent: "flex-start" },
  reactionsRowThem: { right: 0, justifyContent: "flex-end" },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  reactionPillMine: { backgroundColor: "rgba(55,151,240,0.5)" },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, color: "rgba(255,255,255,0.9)" },
  reactionPickerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    alignSelf: "flex-start",
  },
  reactionPickerMe: { alignSelf: "flex-end" },
  reactionPickerThem: { alignSelf: "flex-start" },
  reactionPickerBtn: { padding: 6 },
  reactionPickerEmoji: { fontSize: 24 },
  reactionPickerModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  reactionPickerModalContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
  },
  reactionPickerModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mediaGrid: {
    marginBottom: 4,
    width: MEDIA_GRID_SIZE,
    overflow: "hidden",
    borderRadius: 10,
  },
  mediaCell1: {
    width: MEDIA_GRID_SIZE,
    height: MEDIA_GRID_SIZE * 0.75,
    backgroundColor: "#171717",
    borderRadius: 10,
    overflow: "hidden",
  },
  mediaRow2: {
    flexDirection: "row",
    width: MEDIA_GRID_SIZE,
    height: MEDIA_GRID_SIZE * 0.75,
  },
  mediaCellHalf: {
    width: (MEDIA_GRID_SIZE - MEDIA_GAP) / 2,
    height: MEDIA_GRID_SIZE * 0.75,
    backgroundColor: "#171717",
    borderRadius: 10,
    overflow: "hidden",
  },
  mediaGap: { width: MEDIA_GAP, height: MEDIA_GAP },
  mediaGapVertical: { width: MEDIA_GAP, height: MEDIA_GAP },
  mediaRow3: {
    flexDirection: "row",
    width: MEDIA_GRID_SIZE,
    height: MEDIA_GRID_SIZE * 0.75,
  },
  mediaCellLeft3: {
    width: (MEDIA_GRID_SIZE - MEDIA_GAP) / 2,
    height: MEDIA_GRID_SIZE * 0.75,
    backgroundColor: "#171717",
    borderRadius: 10,
    overflow: "hidden",
  },
  mediaRight3: {
    width: (MEDIA_GRID_SIZE - MEDIA_GAP) / 2,
    height: MEDIA_GRID_SIZE * 0.75,
    flexDirection: "column",
    marginLeft: MEDIA_GAP,
  },
  mediaCellRightTop: {
    width: "100%",
    height: (MEDIA_GRID_SIZE * 0.75 - MEDIA_GAP) / 2,
    backgroundColor: "#171717",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: MEDIA_GAP,
  },
  mediaCellRightBottom: {
    width: "100%",
    height: (MEDIA_GRID_SIZE * 0.75 - MEDIA_GAP) / 2,
    backgroundColor: "#171717",
    borderRadius: 10,
    overflow: "hidden",
  },
  mediaGrid4: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: MEDIA_GRID_SIZE,
    height: MEDIA_GRID_SIZE * 0.75,
  },
  mediaCell4: {
    width: (MEDIA_GRID_SIZE - MEDIA_GAP) / 2,
    height: (MEDIA_GRID_SIZE * 0.75 - MEDIA_GAP) / 2,
    backgroundColor: "#171717",
    borderRadius: 10,
    overflow: "hidden",
    marginRight: MEDIA_GAP,
    marginBottom: MEDIA_GAP,
  },
  mediaCell4Right: { marginRight: 0 },
  mediaCell4Bottom: { marginBottom: 0 },
  mediaMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaMoreText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  bubbleText: { fontSize: 15, color: "#fff", marginBottom: 0 },
  bubbleFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  bubbleTime: { fontSize: 11 },
  bubbleTimeMe: { color: "rgba(255,255,255,0.8)" },
  bubbleTimeThem: { color: "#737373" },
  seen: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#262626",
    backgroundColor: "#0a0a0a",
    gap: 10,
  },
  replyBarContent: { flex: 1, minWidth: 0 },
  replyBarLabel: {
    fontSize: 12,
    color: "#3797f0",
    fontWeight: "600",
    marginBottom: 2,
  },
  replyBarPreview: { fontSize: 13, color: "#737373" },
  replyBarClose: { padding: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#262626",
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#262626",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#fff",
  },
  actionBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBtnActive: {},
  pendingImagesRow: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  pendingImagesScroll: { flexDirection: "row", gap: 8 },
  pendingImageWrap: {
    position: "relative",
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: "hidden",
  },
  pendingImage: { width: 56, height: 56, borderRadius: 8 },
  pendingImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingImageRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  emojiPanel: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: 280,
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 4,
  },
  emojiCell: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  emojiText: { fontSize: 28 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#f87171", fontSize: 16 },
});
