import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';

import type { ApiPublicProfile, ApiInterest, ApiPost, ApiFollowStatus } from '@/types/api';
import { Avatar } from '@/components/feed/Avatar';
import { PostCard } from '@/components/feed/PostCard';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { ProfileFollowButton } from '@/components/profile/ProfileFollowButton';
import { Button } from '@/components/ui/Button';

interface ProfileContentProps {
  profile: ApiPublicProfile;
  interests: ApiInterest[];
  posts: ApiPost[];
  follow: ApiFollowStatus | null;
  isOwnProfile: boolean;
  currentUserId: string | null;
  username: string;
  onRefresh: () => void | Promise<void>;
  refreshing?: boolean;
  onEditProfile?: () => void;
  onUpgradePremium?: () => void;
  onLogout?: () => void;
  isPremium?: boolean;
}

export function ProfileContent({
  profile,
  interests,
  posts,
  follow,
  isOwnProfile,
  currentUserId,
  username,
  onRefresh,
  refreshing = false,
  onEditProfile,
  onUpgradePremium,
  onLogout,
  isPremium = false,
}: ProfileContentProps) {
  const displayName = profile.username ?? 'unknown';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }>
      <View style={styles.top}>
        <Avatar src={profile.avatar_url} fallback={displayName} size="xl" />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            {profile.is_premium ? (
              <View style={styles.premiumBadge}>
                <PremiumBadge size="sm" />
              </View>
            ) : null}
          </View>
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
              username={username}
              initialFollowing={follow.following}
              initialFollowerCount={follow.followerCount}
              initialFollowingCount={follow.followingCount}
              isOwnProfile={isOwnProfile}
            />
          )}
          {isOwnProfile && onEditProfile && (
            <Button
              variant="secondary"
              title="Edit Profile"
              onPress={onEditProfile}
              style={styles.editBtn}
            />
          )}
          {isOwnProfile && (onUpgradePremium != null || onLogout != null) && (
            <View style={styles.actionsRow}>
              {onUpgradePremium != null && (
                <TouchableOpacity
                  onPress={onUpgradePremium}
                  style={styles.premiumLink}
                  activeOpacity={0.7}
                >
                  <Text style={styles.premiumLinkText}>
                    {isPremium ? 'Premium' : 'Upgrade to Premium'}
                  </Text>
                </TouchableOpacity>
              )}
              {onLogout != null && (
                <TouchableOpacity
                  onPress={onLogout}
                  style={styles.logoutBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.logoutText}>Log out</Text>
                </TouchableOpacity>
              )}
            </View>
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
              onRefresh={onRefresh}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingBottom: 48 },
  top: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  info: { width: '100%', maxWidth: 400, marginTop: 20 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  displayName: { fontSize: 24, fontWeight: '600', color: '#fff' },
  premiumBadge: {},
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
  editBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  premiumLink: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: 'rgba(251, 191, 36, 0.6)',
  },
  premiumLinkText: { fontSize: 14, fontWeight: '600', color: '#fbbf24' },
  logoutBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  logoutText: { fontSize: 15, fontWeight: '500', color: '#f87171' },
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
