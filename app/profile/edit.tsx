import { useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { api } from '@/services/api/client';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/feed/Avatar';
import { Button } from '@/components/ui/Button';

export default function ProfileEditScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const loadProfile = useAuthStore((s) => s.loadProfile);

  const [bio, setBio] = useState(profile?.bio ?? '');
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);

  useEffect(() => {
    setBio(profile?.bio ?? '');
    setAvatarUrl(profile?.avatar_url ?? null);
  }, [profile?.bio, profile?.avatar_url]);

  const pickAndUploadAvatar = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setUploadingAvatar(true);
    const { data, error } = await api.uploadAvatar(result.assets[0].uri);
    setUploadingAvatar(false);
    if (error) {
      Alert.alert('Upload failed', error);
      return;
    }
    if (data?.avatarUrl) {
      setAvatarUrl(data.avatarUrl);
      await loadProfile();
    }
  }, [loadProfile]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const saveBio = useCallback(async () => {
    setSavingBio(true);
    const { error } = await api.updateMe({ bio: bio.trim() || undefined });
    setSavingBio(false);
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    await loadProfile();
  }, [bio]);

  if (!profile?.username) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Complete onboarding first.</Text>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Edit Profile',
          headerTitleStyle: { color: '#fff', fontSize: 17, fontWeight: '600' },
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avatar</Text>
        <View style={styles.avatarRow}>
          <Avatar src={avatarUrl} fallback={profile.username} size="xl" />
          <TouchableOpacity
            onPress={pickAndUploadAvatar}
            disabled={uploadingAvatar}
            style={styles.changeAvatarBtn}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="photo-camera" size={20} color="#fff" />
                <Text style={styles.changeAvatarText}>Change</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          placeholderTextColor="#737373"
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>
        <Button
          title={savingBio ? 'Saving…' : 'Save Bio'}
          onPress={saveBio}
          loading={savingBio}
          disabled={savingBio}
          variant="primary"
          style={styles.saveBioBtn}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.sectionHint}>Control what you see in your feed.</Text>
        <TouchableOpacity
          onPress={() => router.push('/onboarding/interests')}
          style={styles.interestsLink}>
          <Text style={styles.interestsLinkText}>Edit interests</Text>
          <MaterialIcons name="chevron-right" size={24} color="#a3a3a3" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          variant="secondary"
          title="View Profile"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  error: { color: '#f87171', marginBottom: 12 },
  link: { color: '#fff', fontSize: 16 },
  container: { flex: 1, backgroundColor: '#000' },
  content: { padding: 20, paddingBottom: 48 },
  section: {
    marginBottom: 28,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#171717',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 12 },
  sectionHint: { fontSize: 14, color: '#a3a3a3', marginBottom: 12 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#404040',
  },
  changeAvatarText: { fontSize: 15, fontWeight: '500', color: '#fff' },
  bioInput: {
    backgroundColor: '#262626',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 12, color: '#737373', marginTop: 6, marginBottom: 12 },
  saveBioBtn: { alignSelf: 'flex-start' },
  interestsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#262626',
  },
  interestsLinkText: { fontSize: 15, color: '#fff', fontWeight: '500' },
  footer: { marginTop: 16 },
});
