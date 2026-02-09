import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import { ComposerCard } from './ComposerCard';
import { FeedEmpty } from './FeedEmpty';
import type { FeedTab } from './FeedScreenHeader';

interface FeedListHeaderProps {
  showComposer: boolean;
  currentUser: { username: string; avatar_url: string | null };
  loading: boolean;
  refreshing: boolean;
  postsLength: number;
  tab: FeedTab;
}

export function FeedListHeader({
  showComposer,
  currentUser,
  loading,
  refreshing,
  postsLength,
  tab,
}: FeedListHeaderProps) {
  return (
    <>
      {refreshing ? (
        <View style={styles.refreshingWrap}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.refreshingText}>Refreshing...</Text>
        </View>
      ) : null}
      {showComposer ? (
        <View style={styles.composerWrap}>
          <ComposerCard currentUser={currentUser} />
        </View>
      ) : null}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : postsLength === 0 ? (
        <FeedEmpty variant={tab} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  refreshingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  refreshingText: { fontSize: 14, color: '#737373' },
  composerWrap: { paddingTop: 12, paddingBottom: 4 },
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 15, color: '#737373' },
});
