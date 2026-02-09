import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.9;

import { FeedComposer } from "@/components/feed/FeedComposer";
import { api } from "@/services/api/client";
import { useAuthStore } from "@/store/auth";
import { useFeedStore } from "@/store/feed";
import type { ApiInterest } from "@/types/api";

export default function CreateScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const [showModal, setShowModal] = useState(false);
  const [interests, setInterests] = useState<ApiInterest[]>([]);

  useFocusEffect(
    useCallback(() => {
      setShowModal(true);
      return () => setShowModal(false);
    }, []),
  );

  useEffect(() => {
    api.getInterests().then(({ data }) => setInterests(data ?? []));
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    router.replace("/(tabs)");
  }, [router]);

  const handlePostSuccess = useCallback(() => {
    useFeedStore.getState().requestFeedRefresh();
    closeModal();
  }, [closeModal]);

  const currentUser = profile
    ? { username: profile.username ?? "", avatar_url: profile.avatar_url }
    : { username: "", avatar_url: null };

  if (!profile) {
    return null;
  }

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={closeModal}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardWrap}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <Pressable style={styles.backdrop} onPress={closeModal}>
          <Pressable
            style={[styles.sheet, { height: SHEET_HEIGHT }]}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
              <View style={styles.header}>
                <Text style={styles.title}>New post</Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    closeModal();
                  }}
                  style={styles.closeBtn}
                  hitSlop={12}
                  accessibilityLabel="Close"
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.composerWrap}
                bounces={false}
              >
                <FeedComposer
                  currentUser={currentUser}
                  interests={interests}
                  onSuccess={handlePostSuccess}
                />
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardWrap: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#000",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#262626",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  closeBtn: {
    padding: 8,
  },
  composerWrap: {
    paddingHorizontal: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
});
