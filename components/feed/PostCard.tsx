import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';

import type { ApiPost } from '@/types/api';
import { Avatar } from './Avatar';
import { PostActions } from './PostActions';
import { RelativeTime } from './RelativeTime';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: ApiPost;
  currentUserId?: string | null;
  onRefresh?: () => void;
}

export function PostCard({ post, currentUserId, onRefresh }: PostCardProps) {
  const router = useRouter();
  const [showImagePreview, setShowImagePreview] = useState(false);
  const username = post.author?.username ?? 'unknown';
  const avatarUrl = post.author?.avatar_url ?? null;
  const interestName = post.interest?.name;

  return (
    <>
      <View style={styles.card}>
        <View style={styles.row}>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              router.push({ pathname: '/profile/[username]', params: { username } });
            }}>
            <Avatar src={avatarUrl} fallback={username} size="md" />
          </TouchableOpacity>
          <View style={styles.body}>
            <View style={styles.headerRow}>
              <View style={styles.metaRow}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({ pathname: '/profile/[username]', params: { username } });
                  }}>
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
            </View>
            <Text style={styles.content}>{post.content}</Text>
            {post.media_url ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setShowImagePreview(true);
                }}
                style={styles.mediaWrap}
                activeOpacity={0.95}>
                <Image
                  source={{ uri: post.media_url }}
                  style={styles.media}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ) : null}
            <View onStartShouldSetResponder={() => true}>
              <PostActions post={post} />
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={showImagePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePreview(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowImagePreview(false)}>
          <Image
            source={{ uri: post.media_url! }}
            style={styles.modalImage}
            contentFit="contain"
          />
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(38,38,38,0.6)',
  },
  row: { flexDirection: 'row', gap: 12 },
  body: { flex: 1, minWidth: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
});
