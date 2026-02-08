import { router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const profile = useAuthStore((s) => s.profile);
  const signOut = useAuthStore((s) => s.signOut);

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {profile?.username ? (
        <Text style={styles.username}>@{profile.username}</Text>
      ) : null}
      <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
        <Text style={styles.signOut}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 24, paddingTop: 64 },
  title: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 8 },
  username: { fontSize: 16, color: '#a3a3a3', marginBottom: 24 },
  signOut: { fontSize: 16, color: '#f87171', fontWeight: '500' },
});
