import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { api } from '@/services/api/client';
import type { ApiPost } from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { PostActions } from '@/components/feed/PostActions';
import { RelativeTime } from '@/components/feed/RelativeTime';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PostPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);

  const loadPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await api.getPost(id);
    setLoading(false);
    if (error || !data) return;
    setPost(data);
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  if (!id) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Invalid post</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const username = post.author?.username ?? 'unknown';
  const avatarUrl = post.author?.avatar_url ?? null;
  const interestName = post.interest?.name;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBack} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => router.push(`/profile/${username}`)}>
            <Avatar src={avatarUrl} fallback={username} size="md" />
          </TouchableOpacity>
          <View style={styles.body}>
            <View style={styles.metaRow}>
              <TouchableOpacity
                onPress={() =>
                  router.push(`/profile/${username}`)
                }>
                <Text style={styles.author}>@{username}</Text>
              </TouchableOpacity>
              <Text style={styles.dot}>·</Text>
              <RelativeTime isoDate={post.created_at} />
              {interestName ? (
                <>
                  <Text style={styles.dot}>·</Text>
                  <View style={styles.interestTag}>
                    <Text style={styles.interestText}>{interestName}</Text>
                  </View>
                </>
              ) : null}
            </View>
            <Text style={styles.content}>{post.content}</Text>
            {post.media_url ? (
              <TouchableOpacity
                onPress={() => setImagePreviewVisible(true)}
                style={styles.mediaWrap}
                activeOpacity={0.95}>
                <Image
                  source={{ uri: post.media_url }}
                  style={styles.media}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ) : null}
            <View style={styles.actionsWrap}>
              <PostActions post={post} />
            </View>
          </View>
        </View>
      </ScrollView>

      {imagePreviewVisible && post.media_url ? (
        <Pressable
          style={styles.imageModalBackdrop}
          onPress={() => setImagePreviewVisible(false)}>
          <Image
            source={{ uri: post.media_url }}
            style={styles.imageModalImage}
            contentFit="contain"
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', padding: 24 },
  errorText: { fontSize: 16, color: '#a3a3a3', marginBottom: 16 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  backBtnText: { fontSize: 16, color: '#fff', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  headerBack: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: { flexDirection: 'row', gap: 12 },
  body: { flex: 1, minWidth: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  author: { fontSize: 15, fontWeight: '600', color: '#fff' },
  dot: { fontSize: 13, color: '#737373' },
  interestTag: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: 'rgba(38,38,38,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  interestText: { fontSize: 12, color: '#a3a3a3' },
  content: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 22,
    color: '#e5e5e5',
  },
  mediaWrap: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 10,
    backgroundColor: '#171717',
  },
  actionsWrap: { marginTop: 12 },
  imageModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  imageModalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
});
