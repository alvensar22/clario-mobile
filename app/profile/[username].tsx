import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
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
import { ProfileContent } from '@/components/profile/ProfileContent';

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

  const handleMessage = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await api.createOrGetChat(profile.id);
    if (error || !data?.chatId) return;
    router.push({
      pathname: '/chats/[chatId]',
      params: {
        chatId: data.chatId,
        username: profile.username ?? username ?? '',
        otherUserId: profile.id,
        avatarUrl: profile.avatar_url ?? '',
      },
    });
  }, [profile, username, router]);

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
      <ProfileContent
        profile={profile}
        interests={interests}
        posts={posts}
        follow={follow}
        isOwnProfile={isOwnProfile}
        currentUserId={currentUserId}
        username={username!}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEditProfile={isOwnProfile ? () => router.push('/profile/edit') : undefined}
        onMessage={!isOwnProfile ? handleMessage : undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: { color: '#f87171', fontSize: 16, marginBottom: 16 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
