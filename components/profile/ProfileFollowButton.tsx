import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import { api } from '@/services/api/client';
import { Button } from '@/components/ui/Button';
import type { ApiFollowStatus } from '@/types/api';
import { FollowListModal, type FollowListMode } from './FollowListModal';

interface ProfileFollowButtonProps {
  username: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
  initialFollowingCount: number;
  isOwnProfile: boolean;
}

export function ProfileFollowButton({
  username,
  initialFollowing,
  initialFollowerCount,
  initialFollowingCount,
  isOwnProfile,
}: ProfileFollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followingCount] = useState(initialFollowingCount);
  const [loading, setLoading] = useState(false);
  const [listModal, setListModal] = useState<FollowListMode | null>(null);

  const toggle = useCallback(async () => {
    if (isOwnProfile || loading) return;
    setLoading(true);
    const res = following
      ? await api.unfollowUser(username)
      : await api.followUser(username);
    setLoading(false);
    if (res.data) {
      setFollowing(res.data.following);
      const status = await api.getFollowStatus(username);
      if (status.data) setFollowerCount(status.data.followerCount);
    }
  }, [username, following, isOwnProfile, loading]);

  return (
    <View style={styles.wrap}>
      <View style={styles.counts}>
        <TouchableOpacity
          onPress={() => setListModal('followers')}
          style={styles.countBtn}
          activeOpacity={0.7}>
          <Text style={styles.countNum}>{followerCount}</Text>
          <Text style={styles.countLabel}>followers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setListModal('following')}
          style={styles.countBtn}
          activeOpacity={0.7}>
          <Text style={styles.countNum}>{followingCount}</Text>
          <Text style={styles.countLabel}>following</Text>
        </TouchableOpacity>
      </View>
      {!isOwnProfile && (
        <Button
          variant={following ? 'secondary' : 'primary'}
          onPress={toggle}
          disabled={loading}
          title={loading ? '…' : following ? 'Unfollow' : 'Follow'}
        />
      )}
      {listModal && (
        <FollowListModal
          username={username}
          mode={listModal}
          onClose={() => setListModal(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 16 },
  counts: { flexDirection: 'row', gap: 24 },
  countBtn: {},
  countNum: { fontSize: 15, fontWeight: '600', color: '#fff' },
  countLabel: { fontSize: 13, color: '#a3a3a3', marginTop: 2 },
});
