import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Avatar } from './Avatar';

interface ComposerCardProps {
  currentUser: { username: string; avatar_url: string | null };
}

export function ComposerCard({ currentUser }: ComposerCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(tabs)/create')}
      activeOpacity={0.85}>
      <Avatar src={currentUser.avatar_url} fallback={currentUser.username} size="md" />
      <View style={styles.placeholderWrap}>
        <Text style={styles.placeholder}>Start a thread...</Text>
        <Text style={styles.hint}>Tap to write a post</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color="#525252" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#262626',
  },
  placeholderWrap: { flex: 1, minWidth: 0 },
  placeholder: {
    fontSize: 16,
    color: '#737373',
  },
  hint: {
    fontSize: 13,
    color: '#525252',
    marginTop: 2,
  },
});
