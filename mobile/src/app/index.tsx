import { ActivityIndicator, View } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { loadUserFromStorage } from '@/store';

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const navigated = useRef(false);

  useEffect(() => {
    if (rootNavigationState?.key && !navigated.current) {
      navigated.current = true;
      loadUserFromStorage().then(user => {
        if (user) {
          router.replace('/(tabs)' as any);
        } else {
          router.replace('/login' as any);
        }
      });
    }
  }, [rootNavigationState?.key, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#0F6E56" />
    </View>
  );
}
