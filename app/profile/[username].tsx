import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { api } from '@/services/api/client';
import { useAuthStore } from '@/store/auth';
import type {
  ApiPublicProfile,
  ApiInterest,
  ApiPost,
  ApiFollowStatus,
} from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { PostCard } from '@/components/feed/PostCard';
import { ProfileFollowButton } from '@/components/profile/ProfileFollowButton';
import { Button } from '@/components/ui/Button';

export default function ProfileByUsernameScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);

  const [profile, setProfile] = useState<ApiPublicProfile | null>(null);
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [follow, setFollow] = useState<ApiFollowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) return;
    const [profileRes, interestsRes, postsRes, followRes] = await Promise.all([
      api.getUserByUsername(username),
      api.getPublicProfileInterests(username),
      api.getUserPosts(username),
      api.getFollowStatus(username),
    ]);
    if (profileRes.error || !profileRes.data?.username) {
      setError(profileRes.error ?? 'User not found');
      setProfile(null);
      setInterests([]);
      setPosts([]);
      setFollow(null);
      return;
    }
    setError(null);
    setProfile(profileRes.data);
    setInterests(interestsRes.data?.interests ?? []);
    setPosts(postsRes.data?.posts ?? []);
    setFollow(followRes.data ?? null);
  }, [username]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  if (loading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error ?? 'User not found'}</Text>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile.username ?? 'unknown';
  const isOwnProfile = currentUserId === profile.id;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `@${profile.username}`,
          headerTitleStyle: { color: '#fff', fontSize: 17, fontWeight: '600' },
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }>
      <View style={styles.top}>
        <Avatar
          src={profile.avatar_url}
          fallback={displayName}
          size="xl"
        />
        <View style={styles.info}>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.handle}>@{profile.username}</Text>
          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>No bio yet.</Text>
          )}
          {interests.length > 0 ? (
            <View style={styles.interestWrap}>
              <Text style={styles.interestLabel}>Interests</Text>
              <View style={styles.interestChips}>
                {interests.map((i) => (
                  <View key={i.id} style={styles.chip}>
                    <Text style={styles.chipText}>{i.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Text style={styles.interestEmpty}>No interests yet.</Text>
          )}
          {follow && (
            <ProfileFollowButton
              username={username!}
              initialFollowing={follow.following}
              initialFollowerCount={follow.followerCount}
              initialFollowingCount={follow.followingCount}
              isOwnProfile={isOwnProfile}
            />
          )}
          {isOwnProfile && (
            <Button
              variant="secondary"
              title="Edit Profile"
              onPress={() => router.push('/profile/edit')}
              style={styles.editBtn}
            />
          )}
        </View>
      </View>

      <View style={styles.postsSection}>
        <Text style={styles.postsTitle}>Posts</Text>
        <Text style={styles.postsSubtitle}>
          {isOwnProfile ? 'Your posts appear here' : `${displayName}'s posts`}
        </Text>
        {posts.length === 0 ? (
          <View style={styles.emptyPosts}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>
              {isOwnProfile
                ? 'Share something from the Create tab.'
                : 'Check back later.'}
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onRefresh={load}
            />
          ))
        )}
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  errorText: { color: '#f87171', fontSize: 16, marginBottom: 16 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 48 },
  top: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  info: { width: '100%', maxWidth: 400, marginTop: 20 },
  displayName: { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 4 },
  handle: { fontSize: 14, color: '#a3a3a3', marginBottom: 12 },
  bio: { fontSize: 15, lineHeight: 22, color: '#d4d4d4', marginBottom: 16 },
  bioEmpty: { fontSize: 14, fontStyle: 'italic', color: '#737373', marginBottom: 16 },
  interestWrap: { marginBottom: 16 },
  interestLabel: { fontSize: 13, fontWeight: '600', color: '#a3a3a3', marginBottom: 8 },
  interestChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: 'rgba(38,38,38,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, color: '#a3a3a3' },
  interestEmpty: { fontSize: 13, fontStyle: 'italic', color: '#737373', marginBottom: 16 },
  editBtn: { alignSelf: 'flex-start' },
  postsSection: {
    borderTopWidth: 1,
    borderTopColor: '#262626',
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  postsTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 4 },
  postsSubtitle: { fontSize: 14, color: '#a3a3a3', marginBottom: 20 },
  emptyPosts: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#737373' },
});
