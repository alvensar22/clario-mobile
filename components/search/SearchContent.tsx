import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { api } from '@/services/api/client';
import type {
  ApiSearchResult,
  ApiSearchUser,
  ApiInterest,
  ApiPost,
} from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { RelativeTime } from '@/components/feed/RelativeTime';

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 1;

export function SearchContent() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef('');

  const runSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResult({ users: [], interests: [], posts: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await api.search(trimmed);
    setLoading(false);
    if (err) {
      setError(err);
      setResult(null);
      return;
    }
    setResult(data ?? { users: [], interests: [], posts: [] });
    lastQueryRef.current = trimmed;
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = inputValue.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResult(null);
      lastQueryRef.current = '';
      return;
    }
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      if (trimmed !== lastQueryRef.current) runSearch(trimmed);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, runSearch]);

  const hasQuery = inputValue.trim().length >= MIN_QUERY_LENGTH;
  const hasResults =
    result &&
    (result.users.length > 0 ||
      result.interests.length > 0 ||
      result.posts.length > 0);
  const emptyAfterSearch = hasQuery && result && !hasResults && !loading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.inputWrap}>
        <MaterialIcons
          name="search"
          size={22}
          color="#737373"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Search people, topics, posts..."
          placeholderTextColor="#737373"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#737373" />
        </View>
      ) : null}

      {!loading && emptyAfterSearch ? (
        <Text style={styles.emptyText}>
          No results for "{inputValue.trim()}"
        </Text>
      ) : null}

      {!loading && hasResults && result ? (
        <View style={styles.sections}>
          {result.users.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>People</Text>
              {result.users.map((u) => (
                <SearchUserResult
                  key={u.id}
                  user={u}
                  onPress={() => router.push(`/profile/${u.username ?? 'unknown'}`)}
                />
              ))}
            </View>
          ) : null}
          {result.interests.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Topics</Text>
              {result.interests.map((i) => (
                <SearchInterestResult
                  key={i.id}
                  interest={i}
                  onPress={() => router.push('/(tabs)')}
                />
              ))}
            </View>
          ) : null}
          {result.posts.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Posts</Text>
              {result.posts.map((post) => (
                <SearchPostResult
                  key={post.id}
                  post={post}
                  onPress={() => router.push(`/post/${post.id}`)}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {!loading && !hasQuery ? (
        <Text style={styles.hintText}>
          Enter a search term to find people, topics, and posts.
        </Text>
      ) : null}
    </ScrollView>
  );
}

function SearchUserResult({
  user,
  onPress,
}: {
  user: ApiSearchUser;
  onPress: () => void;
}) {
  const username = user.username ?? 'unknown';
  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={onPress}
      activeOpacity={0.7}>
      <Avatar src={user.avatar_url} fallback={username} size="md" />
      <Text style={styles.resultLabel}>@{username}</Text>
    </TouchableOpacity>
  );
}

function SearchInterestResult({
  interest,
  onPress,
}: {
  interest: ApiInterest;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.interestIconWrap}>
        <Text style={styles.interestIcon}>#</Text>
      </View>
      <Text style={styles.resultLabel}>{interest.name}</Text>
    </TouchableOpacity>
  );
}

function SearchPostResult({
  post,
  onPress,
}: {
  post: ApiPost;
  onPress: () => void;
}) {
  const username = post.author?.username ?? 'unknown';
  const snippet =
    post.content.length > 120
      ? post.content.slice(0, 120) + '…'
      : post.content;
  return (
    <TouchableOpacity
      style={styles.postRow}
      onPress={onPress}
      activeOpacity={0.7}>
      <Avatar src={post.author?.avatar_url} fallback={username} size="sm" />
      <View style={styles.postBody}>
        <View style={styles.postMeta}>
          <Text style={styles.postAuthor}>@{username}</Text>
          <Text style={styles.postDot}>·</Text>
          <RelativeTime isoDate={post.created_at} />
          {post.interest?.name ? (
            <>
              <Text style={styles.postDot}>·</Text>
              <View style={styles.postTag}>
                <Text style={styles.postTagText}>{post.interest.name}</Text>
              </View>
            </>
          ) : null}
        </View>
        <Text style={styles.postSnippet} numberOfLines={3}>
          {snippet}
        </Text>
        {(post.like_count ?? 0) > 0 || (post.comment_count ?? 0) > 0 ? (
          <Text style={styles.postStats}>
            {post.like_count ?? 0} likes · {post.comment_count ?? 0} comments
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, minHeight: 400 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#262626',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginBottom: 16,
  },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#a3a3a3',
    marginTop: 24,
  },
  sections: { gap: 28 },
  section: { gap: 4 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#737373',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  resultLabel: { fontSize: 16, fontWeight: '500', color: '#fff' },
  interestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#404040',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestIcon: { fontSize: 18, color: '#a3a3a3' },
  postRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  postBody: { flex: 1, minWidth: 0 },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  postAuthor: { fontSize: 13, fontWeight: '600', color: '#fff' },
  postDot: { fontSize: 13, color: '#737373' },
  postTag: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: 'rgba(38,38,38,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  postTagText: { fontSize: 12, color: '#a3a3a3' },
  postSnippet: {
    marginTop: 4,
    fontSize: 14,
    color: '#a3a3a3',
    lineHeight: 20,
  },
  postStats: {
    marginTop: 4,
    fontSize: 12,
    color: '#737373',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 15,
    color: '#737373',
    marginTop: 32,
  },
});
