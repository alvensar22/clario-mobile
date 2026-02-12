import { Crown } from 'lucide-react-native';
import { View, StyleSheet } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, number> = { sm: 14, md: 16, lg: 24 };

interface PremiumBadgeProps {
  size?: Size;
}

export function PremiumBadge({ size = 'sm' }: PremiumBadgeProps) {
  const iconSize = SIZES[size];
  return (
    <View style={[styles.wrap, { width: iconSize + 8, height: iconSize + 8, borderRadius: (iconSize + 8) / 2 }]}>
      <Crown size={iconSize} color="#fbbf24" strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
