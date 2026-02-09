import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { api } from '@/services/api/client';
import type { ApiInterest, ApiPost } from '@/types/api';

interface PostEditModalProps {
  post: ApiPost;
  onClose: () => void;
  onSuccess: () => void;
}

export function PostEditModal({ post, onClose, onSuccess }: PostEditModalProps) {
  const [content, setContent] = useState(post.content);
  const [interestId, setInterestId] = useState<string | null>(post.interest_id ?? null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(post.media_url ?? null);
  const [interests, setInterests] = useState<ApiInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInterestPicker, setShowInterestPicker] = useState(false);

  useEffect(() => {
    api.getInterests().then((res) => {
      if (res.data) setInterests(res.data);
      setLoading(false);
    });
  }, []);

  const selectedInterest = interests.find((i) => i.id === interestId);

  const handleSave = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Content is required');
      return;
    }
    setError(null);
    setSaving(true);
    const res = await api.updatePost(post.id, {
      content: trimmed,
      interest_id: interestId ?? null,
      media_url: mediaUrl ?? null,
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onSuccess();
  }, [post.id, content, interestId, mediaUrl, onSuccess]);

  return (
    <Modal visible transparent animationType="fade">
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit post</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={24} color="#a3a3a3" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              value={content}
              onChangeText={setContent}
              placeholder="What's on your mind?"
              placeholderTextColor="#737373"
              multiline
              maxLength={500}
              editable={!saving}
            />
            {mediaUrl ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: mediaUrl }} style={styles.preview} contentFit="cover" />
                <TouchableOpacity
                  onPress={() => setMediaUrl(null)}
                  style={styles.removeMedia}
                  disabled={saving}>
                  <MaterialIcons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : null}
            {!loading && (
              <View style={styles.interestSection}>
                <Text style={styles.interestLabel}>Topic</Text>
                <TouchableOpacity
                  onPress={() => setShowInterestPicker((v) => !v)}
                  style={[styles.interestBtn, selectedInterest && styles.interestBtnActive]}
                  disabled={saving}>
                  <Text style={[styles.interestBtnText, selectedInterest && styles.interestBtnTextActive]}>
                    {selectedInterest ? selectedInterest.name : 'None'}
                  </Text>
                </TouchableOpacity>
                {showInterestPicker ? (
                  <View style={styles.interestDropdown}>
                    <ScrollView
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      style={styles.interestScroll}>
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
            )}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn} disabled={saving}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}>
              {saving ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  panel: {
    flex: 1,
    marginTop: 80,
    backgroundColor: '#171717',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#262626',
  },
  title: { fontSize: 18, fontWeight: '600', color: '#fff' },
  scroll: { flex: 1, maxHeight: 400 },
  input: {
    minHeight: 100,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  previewWrap: { marginTop: 12, position: 'relative' },
  preview: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 12,
    backgroundColor: '#262626',
  },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interestSection: { marginTop: 16 },
  interestLabel: { fontSize: 13, color: '#737373', marginBottom: 6 },
  interestBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#404040',
    alignSelf: 'flex-start',
  },
  interestBtnActive: { borderColor: '#737373', backgroundColor: '#262626' },
  interestBtnText: { fontSize: 14, color: '#737373' },
  interestBtnTextActive: { color: '#e5e5e5' },
  interestDropdown: {
    marginTop: 6,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#404040',
    backgroundColor: '#262626',
    overflow: 'hidden',
  },
  interestScroll: { maxHeight: 200 },
  interestItem: { paddingVertical: 12, paddingHorizontal: 14 },
  interestItemText: { fontSize: 15, color: '#e5e5e5' },
  interestItemTextActive: { color: '#fff', fontWeight: '600' },
  errorText: { marginTop: 12, fontSize: 14, color: '#ef4444' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#262626',
  },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { fontSize: 15, color: '#a3a3a3' },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 9999,
    backgroundColor: '#fff',
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#000' },
});
