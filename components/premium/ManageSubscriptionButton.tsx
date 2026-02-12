import { Crown } from 'lucide-react-native';
import { useState } from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';

import { api } from '@/services/api/client';

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  const handleManage = async () => {
    setLoading(true);
    try {
      const res = await api.getPremiumPortalUrl();
      if (res.error) throw new Error(res.error);
      if (res.data?.url) {
        const opened = await Linking.canOpenURL(res.data.url)
          ? Linking.openURL(res.data.url)
          : Promise.resolve(false);
        if (!opened) throw new Error('Could not open link');
        return;
      }
      throw new Error('No portal URL received');
    } catch (e) {
      Alert.alert(
        'Error',
        e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleManage}
      disabled={loading}
      style={[styles.button, loading && styles.buttonDisabled]}
      activeOpacity={0.8}>
      {loading ? (
        <ActivityIndicator size="small" color="#000" />
      ) : (
        <>
          <Crown size={20} color="#b45309" strokeWidth={2} />
          <Text style={styles.label}>Manage subscription</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  buttonDisabled: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: '600', color: '#000' },
});
