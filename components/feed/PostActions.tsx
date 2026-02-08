import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { api } from '@/services/api/client';
import type { ApiPost } from '@/types/api';
import { PostComments } from './PostComments';

interface PostActionsProps {
  post: ApiPost;
}

export function PostActions({ post }: PostActionsProps) {
  const [liked, setLiked] = useState(!!post.liked);
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);
  const [showComments, setShowComments] = useState(false);

  const toggleLike = useCallback(async () => {
    const res = liked ? await api.unlikePost(post.id) : await api.likePost(post.id);
    if (res.data) {
      setLiked(res.data.liked);
      setLikeCount(res.data.count);
    }
  }, [post.id, liked]);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity onPress={toggleLike} style={styles.action} activeOpacity={0.7}>
          <MaterialIcons
            name={liked ? 'favorite' : 'favorite-border'}
            size={18}
            color={liked ? '#f87171' : '#737373'}
          />
          <Text style={styles.count}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowComments((c) => !c)}
          style={styles.action}
          activeOpacity={0.7}>
          <MaterialIcons name="chat-bubble-outline" size={18} color="#737373" />
          <Text style={styles.count}>{commentCount}</Text>
        </TouchableOpacity>
      </View>
      {showComments && (
        <PostComments
          postId={post.id}
          onCommentAdded={() => setCommentCount((n) => n + 1)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: { fontSize: 16 },
  count: { fontSize: 13, color: '#737373' },
});
