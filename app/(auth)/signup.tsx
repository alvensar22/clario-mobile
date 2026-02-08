import { router } from 'expo-router';
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LogoIcon } from '@/components/ui/LogoIcon';
import { useAuthStore } from '@/store/auth';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSubmit = async () => {
    setError(null);
    if (!email?.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const err = await signUp(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <LogoIcon size={64} color="#fff" />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join Clario and connect with your interests</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
          />
          <Text style={styles.hint}>Must be at least 6 characters</Text>
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="new-password"
          />

          <Button
            title="Create account"
            onPress={handleSubmit}
            loading={loading}
            style={styles.btn}
          />
        </View>

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}>
            Sign in
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48, paddingTop: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 24, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#a3a3a3' },
  form: { maxWidth: 400, width: '100%', alignSelf: 'center' },
  errorBox: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorText: { color: '#f87171', fontSize: 14 },
  hint: { fontSize: 12, color: '#737373', marginTop: -8, marginBottom: 16 },
  btn: { marginTop: 8 },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#a3a3a3' },
  link: { color: '#fff', fontWeight: '600' },
});
