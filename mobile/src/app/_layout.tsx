import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.DISMISSED) {
    console.log('User dismissed alarm', detail.notification);
  }
});

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
    })();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
