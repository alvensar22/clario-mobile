import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { AppTabHeader } from '@/components/AppTabHeader';
import { ActivityList } from '@/components/activity/ActivityList';
import { useAuthStore } from '@/store/auth';
import { api } from '@/services/api/client';
import type { ApiActivityItem } from '@/types/api';

const PAGE_SIZE = 10;

export default function ActivityScreen() {
  const profile = useAuthStore((s) => s.profile);
  const [items, setItems] = useState<ApiActivityItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitial = useCallback(async () => {
    const { data, error: err } = await api.getActivity(PAGE_SIZE, 0);
    if (err) {
      setError(err);
      setItems([]);
      setHasMore(false);
      return;
    }
    setError(null);
    setItems(data?.activity ?? []);
    setHasMore(data?.hasMore ?? false);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchInitial().finally(() => setLoading(false));
  }, [fetchInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const { data, error: err } = await api.getActivity(PAGE_SIZE, 0);
    setRefreshing(false);
    if (err) return;
    setItems(data?.activity ?? []);
    setHasMore(data?.hasMore ?? false);
  }, []);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || items.length === 0) return;
    const { data } = await api.getActivity(PAGE_SIZE, items.length);
    if (data?.activity?.length) {
      setItems((prev) => [...prev, ...data.activity]);
    }
    setHasMore(data?.hasMore ?? false);
  }, [hasMore, items.length]);

  return (
    <View style={styles.container}>
      <AppTabHeader showPremiumPill={profile?.is_premium ?? false} />
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>
          Your likes, comments, and follows
        </Text>
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#737373" />
        </View>
      ) : (
        <ActivityList
          items={items}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#737373',
  },
  errorWrap: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
