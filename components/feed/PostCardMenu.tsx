import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

import { api } from '@/services/api/client';
import type { ApiPost } from '@/types/api';
import { PostEditModal } from './PostEditModal';

interface PostCardMenuProps {
  post: ApiPost;
  onDelete?: (postId: string) => void;
  onEditSuccess?: () => void;
}

export function PostCardMenu({ post, onDelete, onEditSuccess }: PostCardMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const handleEdit = useCallback(() => {
    closeMenu();
    setEditOpen(true);
  }, [closeMenu]);

  const handleEditSuccess = useCallback(() => {
    setEditOpen(false);
    onEditSuccess?.();
  }, [onEditSuccess]);

  const handleDelete = useCallback(() => {
    closeMenu();
    Alert.alert('Delete post', 'Delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          const res = await api.deletePost(post.id);
          setDeleting(false);
          if (!res.error) {
            onDelete?.(post.id);
          } else {
            Alert.alert('Error', res.error);
          }
        },
      },
    ]);
  }, [post.id, onDelete, closeMenu]);

  return (
    <>
      <TouchableOpacity
        onPress={openMenu}
        style={styles.trigger}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Post options">
        <MaterialIcons name="more-horiz" size={22} color="#737373" />
      </TouchableOpacity>

      <Modal visible={menuOpen} transparent animationType="slide">
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuBackdrop} onPress={closeMenu} />
          <View style={[styles.menuSheet, { height: SCREEN_HEIGHT * 0.5 }]}>
          <View style={styles.menuHandle} />
          <View style={styles.menuPanel}>
            <Text style={styles.menuTitle}>Post options</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEdit}
              activeOpacity={0.7}>
              <MaterialIcons name="edit" size={22} color="#e5e5e5" />
              <Text style={styles.menuItemText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={handleDelete}
              disabled={deleting}
              activeOpacity={0.7}>
              {deleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <MaterialIcons name="delete-outline" size={22} color="#ef4444" />
              )}
              <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.menuCancelBtn}
            onPress={closeMenu}
            activeOpacity={0.7}>
            <Text style={styles.menuCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        </View>
      </Modal>

      {editOpen && (
        <PostEditModal
          post={post}
          onClose={() => setEditOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 4,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuSheet: {
    width: '100%',
    backgroundColor: '#171717',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  menuHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#404040',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  menuPanel: {
    borderRadius: 14,
    backgroundColor: '#262626',
    overflow: 'hidden',
    marginBottom: 12,
  },
  menuTitle: {
    fontSize: 13,
    color: '#737373',
    paddingVertical: 14,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuItemDanger: {},
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#404040',
    marginHorizontal: 16,
  },
  menuItemText: { fontSize: 17, color: '#e5e5e5' },
  menuItemTextDanger: { color: '#ef4444' },
  menuCancelBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#262626',
    alignItems: 'center',
  },
  menuCancelText: { fontSize: 17, fontWeight: '600', color: '#fff' },
});
