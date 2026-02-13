import { View, Text, StyleSheet } from 'react-native';

import { AppTabHeader } from '@/components/AppTabHeader';
import { SearchContent } from '@/components/search/SearchContent';
import { useAuthStore } from '@/store/auth';

export default function SearchScreen() {
  const profile = useAuthStore((s) => s.profile);
  return (
    <View style={styles.container}>
      <AppTabHeader showPremiumPill={profile?.is_premium ?? false} />
      <View style={styles.titleRow}>
        <Text style={styles.title}>Search</Text>
      </View>
      <SearchContent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  titleRow: {
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
});
