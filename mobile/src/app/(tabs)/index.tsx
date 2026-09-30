import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { API_URL } from '@/config';
import { globalUser } from '@/store';

const COLORS = {
  primary: '#0F6E56',
  bg: '#F5F8F6',
  card: '#FFFFFF',
  text: '#14211C',
  muted: '#5B6B64',
  border: '#E8F3F0',
  success: '#E2F3E7',
  successText: '#2D8A4E',
  warning: '#FDF1D8',
  warningText: '#C48119',
};

type ScheduleItem = {
  id: string;
  medId: string;
  name: string;
  dosage: string;
  timeStr: string;
  timeObj: Date;
  status: 'Taken' | 'Due' | 'Upcoming';
};

export default function HomeScreen() {
  const router = useRouter();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [takenItems, setTakenItems] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState('');
  const toastAnim = useState(new Animated.Value(0))[0];

  const user = globalUser || { name: 'Guest' };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const takenCount = schedule.filter(s => s.status === 'Taken').length;
  const totalCount = schedule.length;
  const progress = totalCount > 0 ? takenCount / totalCount : 0;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true })
    ]).start();
  };

  const parseTime = (tStr: string) => {
    const d = new Date();
    const match = tStr.trim().match(/(\d+):(\d+)\s+(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
      if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
      d.setHours(h, parseInt(match[2]), 0, 0);
    }
    return d;
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/medicines?userId=${user.id || user._id}`);
      const data = await res.json();

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      let newSchedule: ScheduleItem[] = [];

      data.forEach((med: any) => {
        if (!med.time) return;
        const times = med.time.split(', ');
        times.forEach((tStr: string) => {
          const timeObj = parseTime(tStr);
          const diffMinutes = (timeObj.getTime() - now.getTime()) / (1000 * 60);

          let status: 'Taken' | 'Due' | 'Upcoming' = 'Upcoming';

          // Check history for today
          const historyEntry = med.history?.find((h: any) => h.date === todayStr && h.time === tStr);
          if (historyEntry && historyEntry.status === 'taken') {
            status = 'Taken';
          } else {
            if (diffMinutes < -60) status = 'Due'; // Should have taken
            else if (diffMinutes <= 60) status = 'Due';
          }

          newSchedule.push({
            id: `${med._id}-${tStr}`,
            medId: med._id,
            name: med.name,
            dosage: med.dosage,
            timeStr: tStr,
            timeObj,
            status
          });
        });
      });

      // Sort by time
      newSchedule.sort((a, b) => a.timeObj.getTime() - b.timeObj.getTime());
      setSchedule(newSchedule);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMedicines();
    }, [])
  );

  const handleMarkTaken = async (item: ScheduleItem) => {
    const isTaken = item.status === 'Taken';
    const newStatus = isTaken ? 'skipped' : 'taken';
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      await fetch(`${API_URL}/api/medicines/${item.medId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayStr, time: item.timeStr, status: newStatus })
      });

      if (isTaken) {
        showToast(`Unmarked ${item.name}`);
      } else {
        showToast(`Marked ${item.name} as Taken!`);
      }

      // Update local schedule state directly
      setSchedule(prev => prev.map(s => {
        if (s.id === item.id) {
          return { ...s, status: newStatus === 'taken' ? 'Taken' : (s.timeObj.getTime() < new Date().getTime() ? 'Due' : 'Upcoming') };
        }
        return s;
      }));

    } catch (e) {
      console.error('Failed to log history', e);
    }
  };

  const renderItem = ({ item }: { item: ScheduleItem }) => {
    const isTaken = item.status === 'Taken';
    let statusStyle, statusText;

    if (isTaken) {
      statusStyle = styles.chipTaken;
      statusText = <Text style={styles.chipTextTaken}>Taken</Text>;
    } else if (item.status === 'Due') {
      statusStyle = styles.chipDue;
      statusText = <Text style={styles.chipTextDue}>Due</Text>;
    } else {
      statusStyle = styles.chipUpcoming;
      statusText = <Text style={styles.chipTextUpcoming}>Upcoming</Text>;
    }

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => handleMarkTaken(item)}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="pill" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardLeft}>
          <Text style={styles.medNameText}>{item.name}</Text>
          <Text style={styles.dosageText}>{item.dosage} • {item.timeStr}</Text>
        </View>
        <View style={[styles.chip, statusStyle]}>
          {statusText}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.dateText}>{todayDateFormatted}</Text>
            <Text style={styles.name}>{getGreeting()}, {user.name}</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressCardHeader}>
            <View>
              <Text style={styles.progressTitle}>Daily Progress</Text>
              <Text style={styles.progressText}>{takenCount} of {totalCount} medications taken</Text>
            </View>
            <View style={styles.progressBadge}>
              <Ionicons name="trophy" size={20} color={COLORS.primary} />
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Schedule</Text>
      </View>

      <FlatList
        data={schedule}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchMedicines} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={64} color={COLORS.muted} />
              <Text style={styles.emptyTitle}>No medicines for today!</Text>
              <Text style={styles.emptySub}>Tap the + button below to schedule your medications.</Text>
            </View>
          ) : null
        }
      />

      <Pressable style={styles.fab} onPress={() => router.push('/(tabs)/pills')}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>

      <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }]}>
        <Ionicons name="checkmark-circle" size={24} color="#FFF" />
        <Text style={styles.toastText}>{toastMsg}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 24, paddingTop: 16, backgroundColor: COLORS.bg },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextContainer: { flex: 1 },
  dateText: { fontSize: 13, color: COLORS.muted, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
  name: { fontSize: 26, color: COLORS.text, fontWeight: '800' },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },

  progressCard: { marginTop: 24, backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  progressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressTitle: { color: COLORS.text, fontWeight: '800', fontSize: 18, marginBottom: 4 },
  progressText: { color: COLORS.muted, fontSize: 14, fontWeight: '500' },
  progressBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F3F0', justifyContent: 'center', alignItems: 'center' },
  progressBarBg: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },

  sectionHeader: { paddingHorizontal: 24, marginTop: 12, marginBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },

  listContent: { padding: 24, paddingTop: 8, paddingBottom: 120 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.8 },
  iconContainer: { width: 52, height: 52, borderRadius: 18, backgroundColor: '#E8F3F0', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardLeft: { flex: 1, justifyContent: 'center' },
  medNameText: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  dosageText: { fontSize: 14, color: COLORS.muted, fontWeight: '600' },

  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  chipTaken: { backgroundColor: COLORS.success },
  chipDue: { backgroundColor: COLORS.warning },
  chipUpcoming: { backgroundColor: '#F5F8F6' },
  chipTextTaken: { color: COLORS.successText, fontWeight: '700', fontSize: 13 },
  chipTextDue: { color: COLORS.warningText, fontWeight: '700', fontSize: 13 },
  chipTextUpcoming: { color: COLORS.muted, fontWeight: '700', fontSize: 13 },

  fab: { position: 'absolute', bottom: 32, right: 32, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },

  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginTop: 20 },
  emptySub: { fontSize: 15, color: COLORS.muted, textAlign: 'center', marginTop: 10, lineHeight: 24 },

  toast: { position: 'absolute', bottom: 120, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: '#14211C', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 12 },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '600', marginLeft: 10 },
});
