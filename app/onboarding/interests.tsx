import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { api } from '@/services/api/client';
import type { ApiInterest } from '@/types/api';
import { useAuthStore } from '@/store/auth';

export default function OnboardingInterestsScreen() {
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadProfile = useAuthStore((s) => s.loadProfile);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [interestsRes, myRes] = await Promise.all([
        api.getInterests(),
        api.getMyInterests(),
      ]);
      if (cancelled) return;
      setLoading(false);
      if (interestsRes.error) {
        setError(interestsRes.error);
        return;
      }
      setInterests(interestsRes.data ?? []);
      setSelectedIds(new Set(myRes.data?.interestIds ?? []));
    })();
    return () => { cancelled = true; };
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await api.putMyInterests({ interestIds: Array.from(selectedIds) });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await loadProfile();
    router.replace('/(tabs)');
  }, [selectedIds, loadProfile]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Choose your interests</Text>
      <Text style={styles.subtitle}>
        Select what you care about. We'll use this to tailor your feed.
      </Text>

      <View style={styles.chips}>
        {interests.map((interest) => {
          const isSelected = selectedIds.has(interest.id);
          return (
            <TouchableOpacity
              key={interest.id}
              onPress={() => toggle(interest.id)}
              style={[styles.chip, isSelected && styles.chipSelected]}
              activeOpacity={0.8}>
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {interest.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        activeOpacity={0.9}>
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save and continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  container: { padding: 24, paddingTop: 64, paddingBottom: 48 },
  title: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#a3a3a3', marginBottom: 32, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  chip: {
    borderWidth: 1,
    borderColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  chipSelected: { backgroundColor: '#fff' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#fff' },
  chipTextSelected: { color: '#000' },
  errorText: { color: '#f87171', fontSize: 14, textAlign: 'center', marginTop: 16 },
  saveBtn: {
    alignSelf: 'center',
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 9999,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#000' },
});
