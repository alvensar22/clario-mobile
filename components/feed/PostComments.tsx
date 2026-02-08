import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { api } from '@/services/api/client';
import type { ApiComment } from '@/types/api';
import { Avatar } from './Avatar';
import { RelativeTime } from './RelativeTime';

const LIMIT = 5;

interface PostCommentsProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function PostComments({ postId, onCommentAdded }: PostCommentsProps) {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getComments(postId);
    setLoading(false);
    if (res.data?.comments) setComments(res.data.comments);
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = useCallback(async () => {
    const text = content.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    const res = await api.addComment(postId, text);
    setSubmitting(false);
    if (res.data) {
      setComments((prev) => [...prev, res.data!]);
      setContent('');
      onCommentAdded?.();
    }
  }, [postId, content, submitting, onCommentAdded]);

  const displayComments = showAll ? comments : comments.slice(0, LIMIT);
  const hasMore = !showAll && comments.length > LIMIT;
  const moreCount = comments.length - LIMIT;

  return (
    <View style={styles.container}>
      {loading ? (
        <Text style={styles.muted}>Loading comments…</Text>
      ) : displayComments.length === 0 ? (
        <Text style={styles.muted}>No comments yet.</Text>
      ) : (
        <>
          <ScrollView style={styles.commentList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {displayComments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <Avatar
                  src={c.author?.avatar_url ?? undefined}
                  fallback={c.author?.username ?? '?'}
                  size="sm"
                />
                <View style={styles.commentBody}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>@{c.author?.username ?? 'unknown'}</Text>
                    <Text style={styles.dot}>·</Text>
                    <RelativeTime isoDate={c.created_at} style={styles.commentTime} />
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          {hasMore && (
            <TouchableOpacity onPress={() => setShowAll(true)}>
              <Text style={styles.moreLink}>
                {moreCount} more comment{moreCount !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
          {showAll && comments.length > LIMIT && (
            <TouchableOpacity onPress={() => setShowAll(false)}>
              <Text style={styles.moreLink}>Show less</Text>
            </TouchableOpacity>
          )}
        </>
      )}
      <View style={styles.inputRow}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Add a comment…"
          placeholderTextColor="#737373"
          maxLength={500}
          style={styles.input}
        />
        <TouchableOpacity
          onPress={submit}
          disabled={!content.trim() || submitting}
          style={[styles.postBtn, (!content.trim() || submitting) && styles.postBtnDisabled]}>
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(38,38,38,0.6)' },
  muted: { fontSize: 13, color: '#737373', marginBottom: 8 },
  commentList: { maxHeight: 220, marginBottom: 8 },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  commentBody: { flex: 1, minWidth: 0 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: '#fff' },
  dot: { fontSize: 13, color: '#737373' },
  commentTime: { fontSize: 12 },
  commentContent: { fontSize: 13, color: '#d4d4d4', marginTop: 2 },
  moreLink: { fontSize: 12, color: '#737373', marginBottom: 8 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: 'rgba(23,23,23,0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
  },
  postBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#404040',
  },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
