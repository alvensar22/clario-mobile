import { Crown } from 'lucide-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { PremiumPill } from '@/components/premium/PremiumPill';
import { LogoIcon } from '@/components/ui/LogoIcon';

export type FeedTab = 'explore' | 'following' | 'interests';

const FEED_OPTIONS: { value: FeedTab; label: string }[] = [
  { value: 'explore', label: 'For you' },
  { value: 'following', label: 'Following' },
  { value: 'interests', label: 'My Interests' },
];

interface FeedScreenHeaderProps {
  tab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isPremium?: boolean;
}

export function FeedScreenHeader({ tab, onTabChange, isPremium = false }: FeedScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <LogoIcon size={28} color="#fff" />
        <Text style={styles.logoText}>clario</Text>
        {isPremium ? <PremiumPill /> : null}
      </View>
      <View style={styles.tabRow}>
        {FEED_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onTabChange(opt.value)}
            style={[styles.tab, tab === opt.value && styles.tabActive]}
            activeOpacity={0.7}>
            <Text style={[styles.tabText, tab === opt.value && styles.tabTextActive]}>
              {opt.label}
            </Text>
            {opt.value === 'interests' && !isPremium ? (
              <Crown size={14} color="#fbbf24" strokeWidth={2} style={styles.tabCrown} />
            ) : null}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#262626',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  logoText: { fontSize: 20, fontWeight: '700', color: '#fff' },
  tabRow: { flexDirection: 'row', gap: 10 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 9999 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.12)' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#737373' },
  tabTextActive: { color: '#fff' },
  tabCrown: { marginLeft: 4 },
});
