import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import notifee from '@notifee/react-native';
import { globalUser, loadUserFromStorage } from '@/store';
import { API_URL } from '@/config';
import { scheduleNotificationsForMed } from '@/utils/notifications';

async function restoreMedicineNotifications() {
  const user = globalUser || await loadUserFromStorage();
  if (!user) return;
  try {
    const userId = user.id || user._id;
    const res = await fetch(`${API_URL}/api/medicines?userId=${userId}`);
    if (!res.ok) return;
    const medicines: { _id: string; name: string; dosage: string; time: string }[] = await res.json();

    const scheduledIds = await notifee.getTriggerNotificationIds();
    const scheduledSet = new Set(scheduledIds);

    for (const med of medicines) {
      if (!med.time) continue;
      const timeParts = med.time.split(', ');

      const needsRestore = timeParts.some((_: string, i: number) => !scheduledSet.has(`${med._id}-${i}`));
      if (!needsRestore) continue;

      await scheduleNotificationsForMed(med);
    }
  } catch (e) {
    console.error('Failed to restore notifications:', e);
  }
}

export default function TabsLayout() {
  useEffect(() => {
    restoreMedicineNotifications();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        restoreMedicineNotifications();
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0F6E56', headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pills"
        options={{
          title: 'Meds',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="pill" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
