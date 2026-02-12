import { Crown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

export function PremiumPill() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push('/premium')}
      style={styles.pill}
      activeOpacity={0.8}>
      <Crown size={14} color="#fbbf24" strokeWidth={2} />
      <Text style={styles.text}>Premium</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.5)',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  text: { fontSize: 12, fontWeight: '600', color: '#fbbf24' },
});
