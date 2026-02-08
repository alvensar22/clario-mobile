import { Image } from 'expo-image';
import { View, Text, StyleSheet } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, number> = { sm: 32, md: 40, lg: 96 };

interface AvatarProps {
  src?: string | null;
  fallback?: string;
  size?: Size;
}

export function Avatar({ src, fallback = '?', size = 'md' }: AvatarProps) {
  const px = SIZES[size];
  const initials = fallback
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <View style={[styles.outer, { width: px, height: px, borderRadius: px / 2 }]}>
      {src ? (
        <Image
          source={{ uri: src }}
          style={{ width: px, height: px, borderRadius: px / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size === 'sm' ? 12 : size === 'md' ? 14 : 18 }]}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
    backgroundColor: '#262626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#a3a3a3', fontWeight: '600' },
});
