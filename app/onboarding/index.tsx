import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/services/api/client';
import { useAuthStore } from '@/store/auth';

export default function OnboardingUsernameScreen() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loadProfile = useAuthStore((s) => s.loadProfile);

  const handleContinue = async () => {
    setError(null);
    const trimmed = username.trim().toLowerCase();
    if (!trimmed) {
      setError('Username is required');
      return;
    }
    if (trimmed.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (trimmed.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setError('Only letters, numbers, and underscores');
      return;
    }
    setLoading(true);
    const { error: err } = await api.updateMe({ username: trimmed });
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    await loadProfile();
    router.replace('/onboarding/interests');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose your username</Text>
        <Text style={styles.subtitle}>Pick a unique username to complete your profile</Text>

        <Input
          label="Username"
          value={username}
          onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ''))}
          placeholder="johndoe"
          autoCapitalize="none"
          autoComplete="username"
          error={!!error}
          containerStyle={styles.input}
        />
        <Text style={styles.hint}>3–20 characters, letters, numbers, and underscores only</Text>

        <Button
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={username.trim().length < 3}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', justifyContent: 'center', paddingHorizontal: 24 },
  content: { maxWidth: 400, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#a3a3a3', marginBottom: 24, textAlign: 'center' },
  input: { marginBottom: 8 },
  hint: { fontSize: 12, color: '#737373', marginBottom: 24 },
  btn: {},
});
