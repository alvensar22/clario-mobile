# Push & In-App Notifications (clario-mobile)

Push notifications and in-app notifications (bell, list) use **Expo Notifications** and the **clario-web** API. In-app updates can be **realtime** via Supabase Realtime when configured.

## Flow

1. When the user is logged in, the app requests notification permission (if not already granted).
2. The app gets an **Expo push token** via `expo-notifications`.
3. The token is sent to **clario-web** with `POST /api/notifications/push/expo` (Bearer auth).
4. When someone likes, comments, or follows, the web backend creates an in-app notification and **immediately** sends a push to all registered Expo tokens for that user (fire-and-forget, no delay).
5. Tapping a notification opens the app and navigates to the post or profile.

## Realtime in-app updates

- If **EXPO_PUBLIC_SUPABASE_URL** and **EXPO_PUBLIC_SUPABASE_ANON_KEY** are set (same project as clario-web), the app subscribes to Supabase Realtime for the `notifications` table. New notifications then update the **bell badge** and the **notifications list** live without refresh.
- If these env vars are not set, the bell and list still work; they update when you open the screen or pull-to-refresh.
- clario-web must have the `notifications` table in the Realtime publication (migration 014).

## Setup

- **clario-web** must have run migration `015_expo_push_tokens.sql` and have `expo-server-sdk` installed. See **clario-web** `NOTIFICATIONS_SETUP.md`.
- **clario-mobile** uses `expo-notifications` and `expo-device`; the token is registered automatically after login in `app/_layout.tsx` via `useRegisterPushTokenWhenLoggedIn`.

## Permissions

- **iOS**: The app will prompt for notification permission when the user is first logged in. User can change it in Settings.
- **Android**: Notification permission is requested the same way; channels are configured via the `expo-notifications` plugin in `app.json`.

## Testing

1. Log in on a physical device (Expo push does not work on simulator for iOS; Android emulator may work with Google Play services).
2. Ensure **clario-web** is running and the migration/API are in place.
3. Trigger a like, comment, or follow from another account; the device should receive a push notification.
4. Tap the notification to open the app and navigate to the post or profile.
