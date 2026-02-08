import { View, Text, StyleSheet } from 'react-native';

type FeedVariant = 'following' | 'interests' | 'explore';

interface FeedEmptyProps {
  variant?: FeedVariant;
}

export function FeedEmpty({ variant = 'explore' }: FeedEmptyProps) {
  const isFocus = variant === 'following' || variant === 'interests';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isFocus ? 'No posts in your focus yet' : 'No posts yet'}
      </Text>
      <Text style={styles.subtitle}>
        {isFocus
          ? 'Follow creators or explore more topics.'
          : 'Be the first to share something.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#737373',
    textAlign: 'center',
    lineHeight: 20,
  },
});
