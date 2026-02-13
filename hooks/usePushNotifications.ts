import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '@/services/api/client';

// Show notifications when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
  }),
});

export type PushPermissionState = 'undetermined' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('undetermined');
  const [registered, setRegistered] = useState(false);
  const lastTokenRef = useRef<string | null>(null);

  const registerForPush = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      setPermission('unsupported');
      return null;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      status = requested;
    }
    setPermission(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');
    if (status !== 'granted') return null;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData?.data ?? null;
      if (token) lastTokenRef.current = token;
      return token;
    } catch {
      return null;
    }
  }, []);

  const registerTokenWithBackend = useCallback(async (token: string) => {
    const { error } = await api.registerExpoPushToken(token);
    if (!error) setRegistered(true);
    return !error;
  }, []);

  return {
    permission,
    registered,
    registerForPush,
    registerTokenWithBackend,
  };
}

/**
 * Registers for push notifications and sends the Expo token to the backend when user is logged in.
 * Call from root layout so token is registered after session load.
 */
export function useRegisterPushTokenWhenLoggedIn(isLoggedIn: boolean) {
  const { registerForPush, registerTokenWithBackend, registered } = usePushNotifications();
  const lastRegisteredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      const token = await registerForPush();
      if (cancelled || !token || token === lastRegisteredRef.current) return;
      lastRegisteredRef.current = token;
      await registerTokenWithBackend(token);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, registerForPush, registerTokenWithBackend]);
}
