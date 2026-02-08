import { Redirect, useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

import { useAuthStore } from '@/store/auth';

export default function ProfileTabScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
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

  return <Redirect href={`/profile/${profile.username}`} />;
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  container: { flex: 1, backgroundColor: '#000', padding: 24, paddingTop: 64 },
  title: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 8 },
  signOut: { fontSize: 16, color: '#f87171', fontWeight: '500' },
});
