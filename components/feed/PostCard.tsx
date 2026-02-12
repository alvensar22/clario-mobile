import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import type { ApiPost } from '@/types/api';
import { Avatar } from './Avatar';
import { ImagePreviewModal } from './ImagePreviewModal';
import { PostActions } from './PostActions';
import { PostCardMenu } from './PostCardMenu';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { RelativeTime } from './RelativeTime';


interface PostCardProps {
  post: ApiPost;
  currentUserId?: string | null;
  onRefresh?: () => void;
  onDelete?: (postId: string) => void;
}

const MEDIA_THUMB_WIDTH = 280;

export function PostCard({ post, currentUserId, onRefresh, onDelete }: PostCardProps) {
  const router = useRouter();
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const username = post.author?.username ?? 'unknown';
  const avatarUrl = post.author?.avatar_url ?? null;
  const isAuthorPremium = post.author?.is_premium === true;
  const interestName = post.interest?.name;
  const isOwnPost =
    !!currentUserId && !!post.user_id && String(post.user_id) === String(currentUserId);

  const mediaUrls =
    post.media_urls?.length ? post.media_urls : post.media_url ? [post.media_url] : [];
  const hasMultipleMedia = mediaUrls.length > 1;

  return (
    <>
      <Link href={post?.id ? `/post/${post.id}` : '/'} asChild>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
        <View>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                router.push(`/profile/${username}`);
              }}>
              <Avatar src={avatarUrl} fallback={username} size="md" />
            </TouchableOpacity>
            <View style={styles.body}>
              <View style={styles.headerRow}>
                <View style={styles.metaRow}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      router.push(`/profile/${username}`);
                    }}
                    style={styles.authorRow}>
                    <Text style={styles.author}>@{username}</Text>
                    {isAuthorPremium ? (
                      <View style={styles.badgeWrap}>
                        <PremiumBadge size="sm" />
                      </View>
                    ) : null}
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
                {isOwnPost ? (
                  <View onStartShouldSetResponder={() => true}>
                    <PostCardMenu
                      post={post}
                      onDelete={(id) => {
                        onDelete?.(id);
                        onRefresh?.();
                      }}
                      onEditSuccess={onRefresh}
                    />
                  </View>
                ) : null}
              </View>
              <Text style={styles.content}>{post.content}</Text>
              {mediaUrls.length > 0 ? (
                hasMultipleMedia ? (
                  <View style={styles.mediaScrollWrap} onStartShouldSetResponder={() => true}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.mediaScrollContent}>
                      {mediaUrls.map((uri, i) => (
                        <TouchableOpacity
                          key={uri + i}
                          onPress={(e) => {
                            e?.stopPropagation?.();
                            setPreviewIndex(i);
                            setShowImagePreview(true);
                          }}
                          style={styles.mediaThumbWrap}
                          activeOpacity={0.95}>
                          <Image
                            source={{ uri }}
                            style={styles.mediaThumb}
                            contentFit="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={(e) => {
                      e?.stopPropagation?.();
                      setPreviewIndex(0);
                      setShowImagePreview(true);
                    }}
                    style={styles.mediaWrap}
                    activeOpacity={0.95}>
                    <Image
                      source={{ uri: mediaUrls[0] }}
                      style={styles.media}
                      contentFit="cover"
                    />
                  </TouchableOpacity>
                )
              ) : null}
              <View onStartShouldSetResponder={() => true} collapsable={false}>
                <PostActions post={post} />
              </View>
            </View>
          </View>
        </View>
        </TouchableOpacity>
      </Link>

      <ImagePreviewModal
        visible={showImagePreview}
        images={mediaUrls}
        initialIndex={previewIndex}
        onClose={() => setShowImagePreview(false)}
      />
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
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  author: { fontSize: 15, fontWeight: '600', color: '#fff' },
  badgeWrap: { marginLeft: 2 },
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
  mediaScrollWrap: { marginTop: 12 },
  mediaScrollContent: { gap: 8, paddingRight: 16 },
  mediaThumbWrap: {
    width: MEDIA_THUMB_WIDTH,
    aspectRatio: 16 / 10,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
  },
  mediaThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#171717',
  },
});
