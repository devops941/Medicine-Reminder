import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

notifee.onBackgroundEvent(async ({ type }) => {
  // Background PRESS is handled by the OS launching the app — startup flow navigates
  if (type === EventType.DISMISSED) return;
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await notifee.requestPermission();
      await notifee.createChannel({
        id: 'alarms_custom',
        name: 'Medicine Alarms',
        importance: AndroidImportance.HIGH,
        sound: 'alert',
        vibration: true,
        bypassDnd: true,
      });

      // Handle cold-start: app opened by tapping a notification
      const initial = await notifee.getInitialNotification();
      if (initial) {
        router.replace('/(tabs)' as any);
      }
    })();

    const unsubscribe = notifee.onForegroundEvent(({ type }) => {
      if (type === EventType.PRESS) {
        router.push('/(tabs)' as any);
      }
    });

    return unsubscribe;
  }, [router]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
