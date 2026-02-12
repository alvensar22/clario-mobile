import { ChevronRight, Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export function PremiumUpgradeBanner() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/premium')}
      style={styles.banner}
      activeOpacity={0.9}>
      <Crown size={22} color="#fbbf24" strokeWidth={2} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.subtitle}>
          Get unlimited posts in My Interests feed
        </Text>
      </View>
      <ChevronRight size={24} color="#a3a3a3" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', color: '#fff' },
  subtitle: { fontSize: 13, color: '#a3a3a3', marginTop: 2 },
});
