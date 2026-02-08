import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { api } from '@/services/api/client';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const { user, profile, loading, hydrated } = useAuthStore();
  const [interestsChecked, setInterestsChecked] = useState(false);
  const [needsInterests, setNeedsInterests] = useState(false);

  useEffect(() => {
    if (!user || !profile?.username) {
      setInterestsChecked(true);
      return;
    }
    let cancelled = false;
    api.getMyInterests().then(({ data }) => {
      if (cancelled) return;
      setNeedsInterests((data?.interestIds?.length ?? 0) === 0);
      setInterestsChecked(true);
    });
    return () => { cancelled = true; };
  }, [user, profile?.username]);

  if (!hydrated || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!profile?.username) return <Redirect href="/onboarding" />;
  if (!interestsChecked) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }
  if (needsInterests) return <Redirect href="/onboarding/interests" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});
