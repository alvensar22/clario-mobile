import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { api } from '@/services/api/client';
import type { ApiInterest } from '@/types/api';
import { Avatar } from './Avatar';

const MAX_LENGTH = 500;

interface FeedComposerProps {
  currentUser: { username: string; avatar_url: string | null };
  interests: ApiInterest[];
  onSuccess: () => void;
}

export function FeedComposer({ currentUser, interests, onSuccess }: FeedComposerProps) {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [interestId, setInterestId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInterestPicker, setShowInterestPicker] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo library access is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setError(null);
    setMediaUri(result.assets[0].uri);
    setUploading(true);
    const res = await api.uploadPostImage(result.assets[0].uri, result.assets[0].fileName ?? 'image.jpg');
    setUploading(false);
    if (res.error) {
      setError(res.error);
      setMediaUri(null);
      return;
    }
    if (res.data?.url) setMediaUrl(res.data.url);
  };

  const removeImage = () => {
    setMediaUrl(null);
    setMediaUri(null);
  };

  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed || posting) return;
    setError(null);
    setPosting(true);
    const { error: err } = await api.createPost({
      content: trimmed,
      media_url: mediaUrl ?? undefined,
      interest_id: interestId ?? undefined,
    });
    setPosting(false);
    if (err) {
      setError(err);
      return;
    }
    setContent('');
    setMediaUrl(null);
    setMediaUri(null);
    setInterestId(null);
    onSuccess();
  };

  const selectedInterest = interests.find((i) => i.id === interestId);
  const atLimit = content.length >= MAX_LENGTH;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <View style={styles.row}>
        <Avatar src={currentUser.avatar_url} fallback={currentUser.username} size="md" />
        <View style={styles.inputWrap}>
          <TextInput
            value={content}
            onChangeText={(t) => setContent(t.slice(0, MAX_LENGTH))}
            placeholder="What's on your mind?"
            placeholderTextColor="#737373"
            maxLength={MAX_LENGTH}
            multiline
            style={styles.input}
          />
          {mediaUri ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: mediaUri }} style={styles.preview} contentFit="cover" />
              <TouchableOpacity onPress={removeImage} style={styles.removeBtn}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={styles.toolbarLeft}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploading}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {uploading ? (
              <ActivityIndicator size="small" color="#737373" />
            ) : (
              <MaterialIcons name="image" size={22} color="#737373" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowInterestPicker((v) => !v)}
            style={[styles.interestBtn, selectedInterest && styles.interestBtnActive]}>
            <Text style={[styles.interestBtnText, selectedInterest && styles.interestBtnTextActive]}>
              {selectedInterest ? selectedInterest.name : 'Topic'}
            </Text>
          </TouchableOpacity>
          {showInterestPicker ? (
            <View style={styles.interestDropdown}>
              <ScrollView
                style={styles.interestScroll}
                contentContainerStyle={styles.interestScrollContent}
                nestedScrollEnabled
                showsVerticalScrollIndicator={true}
                bounces={false}
                keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                  onPress={() => {
                    setInterestId(null);
                    setShowInterestPicker(false);
                  }}
                  style={styles.interestItem}>
                  <Text style={styles.interestItemText}>None</Text>
                </TouchableOpacity>
                {interests.map((i) => (
                  <TouchableOpacity
                    key={i.id}
                    onPress={() => {
                      setInterestId(i.id);
                      setShowInterestPicker(false);
                    }}
                    style={styles.interestItem}>
                    <Text
                      style={[
                        styles.interestItemText,
                        interestId === i.id && styles.interestItemTextActive,
                      ]}>
                      {i.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
        <View style={styles.toolbarRight}>
          {content.length >= MAX_LENGTH * 0.9 ? (
            <Text style={[styles.count, atLimit && styles.countOver]}>{content.length}/{MAX_LENGTH}</Text>
          ) : null}
          <TouchableOpacity
            onPress={handlePost}
            disabled={!content.trim() || posting}
            style={[styles.postBtn, (!content.trim() || posting) && styles.postBtnDisabled]}>
            {posting ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  row: { flexDirection: 'row', gap: 16 },
  inputWrap: { flex: 1, minWidth: 0 },
  input: {
    minHeight: 32,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 0,
    lineHeight: 24,
  },
  previewWrap: {
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#262626',
    position: 'relative',
  },
  preview: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#171717' },
  removeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    gap: 14,
  },
  toolbarLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { padding: 10 },
  interestBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  interestBtnActive: { backgroundColor: 'rgba(38,38,38,0.8)' },
  interestBtnText: { fontSize: 14, color: '#737373' },
  interestBtnTextActive: { color: '#a3a3a3' },
  interestDropdown: {
    position: 'absolute',
    left: 0,
    top: 48,
    minWidth: 180,
    maxHeight: 220,
    backgroundColor: '#0a0a0a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    zIndex: 10,
    overflow: 'hidden',
  },
  interestScroll: { maxHeight: 220 },
  interestScrollContent: { paddingVertical: 8, paddingBottom: 14 },
  interestItem: { paddingHorizontal: 18, paddingVertical: 14 },
  interestItemText: { fontSize: 14, color: '#a3a3a3' },
  interestItemTextActive: { color: '#fff', fontWeight: '600' },
  count: { fontSize: 13, color: '#737373' },
  countOver: { color: '#f87171' },
  postBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#fff',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { fontSize: 15, fontWeight: '600', color: '#000' },
  errorText: { fontSize: 14, color: '#f87171', marginTop: 16 },
});
