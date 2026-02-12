import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImagePreviewModal({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImagePreviewModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const current = images[index];
  useEffect(() => {
    if (visible) setIndex(Math.min(initialIndex, images.length - 1));
  }, [visible, initialIndex, images.length]);

  const hasMultiple = images.length > 1;
  const hasPrev = hasMultiple && index > 0;
  const hasNext = hasMultiple && index < images.length - 1;

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(images.length - 1, i + 1));
  }, [images.length]);

  if (!visible || !current) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.contentWrap} onPress={(e) => e.stopPropagation()}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {hasMultiple && (
              <Text style={styles.counter}>
                {index + 1} / {images.length}
              </Text>
            )}
          </View>
          <View style={styles.imageWrap}>
            {hasPrev && (
              <TouchableOpacity
                onPress={goPrev}
                style={[styles.arrow, styles.arrowLeft]}
                activeOpacity={0.8}>
                <MaterialIcons name="chevron-left" size={36} color="#fff" />
              </TouchableOpacity>
            )}
            <Image
              source={{ uri: current }}
              style={styles.image}
              contentFit="contain"
            />
            {hasNext && (
              <TouchableOpacity
                onPress={goNext}
                style={[styles.arrow, styles.arrowRight]}
                activeOpacity={0.8}>
                <MaterialIcons name="chevron-right" size={36} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrap: { width: '100%', flex: 1, justifyContent: 'center' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    zIndex: 10,
  },
  closeBtn: { padding: 8 },
  counter: { fontSize: 15, color: '#a3a3a3' },
  imageWrap: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  arrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    padding: 8,
    zIndex: 2,
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
});
