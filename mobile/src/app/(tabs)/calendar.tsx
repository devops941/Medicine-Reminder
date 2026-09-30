import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '@/config';
import { globalUser } from '@/store';

const COLORS = {
  primary: '#0F6E56',
  bg: '#F5F8F6',
  card: '#FFFFFF',
  text: '#14211C',
  muted: '#5B6B64',
  error: '#B3261E',
  success: '#2D8A4E',
  border: '#C4D3CC'
};

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState<any>({});
  const [missedData, setMissedData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMissed, setSelectedMissed] = useState<any[]>([]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const user = globalUser || { name: 'Guest', _id: 'default_user' };
      const res = await fetch(`${API_URL}/api/medicines?userId=${user._id}`);
      const medicines = await res.json();
      
      const todayStr = new Date().toISOString().split('T')[0];
      const marks: any = {};
      const missed: any = {};

      // For simplicity, we'll analyze the last 30 days up to today
      const now = new Date();
      for (let i = 0; i <= 30; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        let totalExpected = 0;
        let missedPills: any[] = [];
        
        medicines.forEach((med: any) => {
          if (!med.time) return;
          const times = med.time.split(', ');
          
          times.forEach((tStr: string) => {
            // For today, only count it if the time has passed
            if (dateStr === todayStr) {
              const match = tStr.trim().match(/(\d+):(\d+)\s+(AM|PM)/i);
              if (match) {
                let h = parseInt(match[1]);
                if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
                if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
                
                const timeObj = new Date(d);
                timeObj.setHours(h, parseInt(match[2]), 0, 0);
                if (timeObj.getTime() > new Date().getTime()) {
                  return; // skip future times today
                }
              }
            }
            
            totalExpected++;
            const historyEntry = med.history?.find((h: any) => h.date === dateStr && h.time === tStr);
            if (!historyEntry || historyEntry.status !== 'taken') {
              missedPills.push({ name: med.name, time: tStr, dosage: med.dosage });
            }
          });
        });

        if (totalExpected > 0) {
          if (missedPills.length === 0) {
            marks[dateStr] = { selected: true, selectedColor: COLORS.success };
          } else {
            marks[dateStr] = { selected: true, selectedColor: COLORS.error };
            missed[dateStr] = missedPills;
          }
        }
      }

      setMarkedDates(marks);
      setMissedData(missed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  const handleDayPress = (day: any) => {
    if (missedData[day.dateString]) {
      setSelectedDate(day.dateString);
      setSelectedMissed(missedData[day.dateString]);
      setModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History Report</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} size="large" />
      ) : (
        <View style={styles.calendarContainer}>
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: COLORS.primary,
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: COLORS.primary,
              selectedDotColor: '#ffffff',
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.text,
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '500',
              textDayFontSize: 16,
              textMonthFontSize: 18,
            }}
          />
          
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>All Taken</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.error }]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Missed on {selectedDate}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </Pressable>
            </View>
            
            <FlatList
              data={selectedMissed}
              keyExtractor={(item, index) => `${item.name}-${index}`}
              renderItem={({ item }) => (
                <View style={styles.missedItem}>
                  <Ionicons name="alert-circle" size={24} color={COLORS.error} />
                  <View style={styles.missedInfo}>
                    <Text style={styles.missedName}>{item.name} ({item.dosage})</Text>
                    <Text style={styles.missedTime}>{item.time}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, paddingTop: 10, backgroundColor: COLORS.bg },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  calendarContainer: { margin: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.card, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  legend: { flexDirection: 'row', justifyContent: 'center', padding: 16, gap: 24, borderTopWidth: 1, borderColor: COLORS.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 14, color: COLORS.muted, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  missedItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F5F8F6' },
  missedInfo: { marginLeft: 12 },
  missedName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  missedTime: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
});
