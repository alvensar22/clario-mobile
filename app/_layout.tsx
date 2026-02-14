import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import 'react-native-reanimated';

import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';
import { useRegisterPushTokenWhenLoggedIn } from '@/hooks/usePushNotifications';
import { useAuthStore } from '@/store/auth';

export default function RootLayout() {
  const router = useRouter();
  const loadSession = useAuthStore((s) => s.loadSession);
  const user = useAuthStore((s) => s.user);
  useRegisterPushTokenWhenLoggedIn(!!user);
  useNotificationsRealtime(user?.id ?? null);
  const responseListenerRef = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { postId?: string; type?: string; url?: string };
      if (data?.postId) {
        router.push(`/post/${data.postId}`);
      } else if (data?.url) {
        const path = data.url.replace(/^https?:\/\/[^/]+/, '') || '/';
        if (path.startsWith('/post/')) router.push(path as '/post/[id]');
        else if (path.startsWith('/profile/')) router.push(`/profile/${path.split('/').pop()}`);
      }
    });
    return () => {
      if (responseListenerRef.current) {
        Notifications.removeNotificationSubscription(responseListenerRef.current);
      }
    };
  }, [router]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
        <Stack.Screen name="premium" options={{ title: 'Premium' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="chats" options={{ title: 'Messages' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
