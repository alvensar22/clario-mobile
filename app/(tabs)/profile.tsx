import { useRouter } from "expo-router";
import { LogOutIcon } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AppTabHeader } from "@/components/AppTabHeader";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { api } from "@/services/api/client";
import { useAuthStore } from "@/store/auth";
import type {
  ApiFollowStatus,
  ApiInterest,
  ApiPost,
  ApiPublicProfile,
} from "@/types/api";

export default function ProfileTabScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const loadProfile = useAuthStore((s) => s.loadProfile);
  const loading = useAuthStore((s) => s.loading);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signOut = useAuthStore((s) => s.signOut);

  const [profileData, setProfileData] = useState<ApiPublicProfile | null>(null);
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [follow, setFollow] = useState<ApiFollowStatus | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const username = profile?.username;
    if (!username) {
      setProfileData(null);
      setInterests([]);
      setPosts([]);
      setFollow(null);
      return;
    }
    const [profileRes, interestsRes, postsRes, followRes] = await Promise.all([
      api.getUserByUsername(username),
      api.getPublicProfileInterests(username),
      api.getUserPosts(username),
      api.getFollowStatus(username),
    ]);
    if (profileRes.data) {
      setProfileData(profileRes.data);
      setInterests(interestsRes.data?.interests ?? []);
      setPosts(postsRes.data?.posts ?? []);
      setFollow(followRes.data ?? null);
    }
  }, [profile?.username]);

  useEffect(() => {
    if (!hydrated || loading) return;
    if (!profile?.username) {
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    load().finally(() => setDataLoading(false));
  }, [hydrated, loading, profile?.username, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    await load();
    setRefreshing(false);
  }, [load, loadProfile]);

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  if (!hydrated || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!profile?.username) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.signOut}>Log out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (dataLoading && !profileData) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Could not load profile.</Text>
        <TouchableOpacity onPress={() => load()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPremium = profileData?.is_premium === true;

  return (
    <View style={styles.wrapper}>
      <AppTabHeader
        showPremiumPill={isPremium}
        rightTrailingElement={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutIconBtn} hitSlop={12}>
            <LogOutIcon size={22} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
        }
      />
      <ProfileContent
        profile={profileData}
        interests={interests}
        posts={posts}
        follow={follow}
        isOwnProfile={true}
        currentUserId={user?.id ?? null}
        username={profile.username!}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEditProfile={() => router.push("/profile/edit")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 24,
    paddingTop: 64,
  },
  title: { fontSize: 20, fontWeight: "600", color: "#fff", marginBottom: 8 },
  signOut: { fontSize: 16, color: "#f87171", fontWeight: "500" },
  error: { color: "#f87171", marginBottom: 12 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  retryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  wrapper: { flex: 1, backgroundColor: "#000" },
  logoutIconBtn: { padding: 8 },
});
