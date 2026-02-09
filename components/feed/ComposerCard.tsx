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
      style={styles.trigger}
      onPress={() => router.push('/(tabs)/create')}
      activeOpacity={0.7}>
      <View style={styles.row}>
        <Avatar src={currentUser.avatar_url} fallback={currentUser.username} size="md" />
        <Text style={styles.placeholder} numberOfLines={1}>
          What's on your mind?
        </Text>
      </View>
      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="image" size={20} color="#737373" />
          </View>
          <View style={styles.topicPill}>
            <Text style={styles.topicText}>Topic</Text>
          </View>
        </View>
        <View style={styles.postBtn}>
          <Text style={styles.postBtnText}>Post</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeholder: {
    flex: 1,
    fontSize: 15,
    color: '#737373',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    padding: 6,
  },
  topicPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#404040',
  },
  topicText: {
    fontSize: 13,
    color: '#737373',
  },
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  postBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
