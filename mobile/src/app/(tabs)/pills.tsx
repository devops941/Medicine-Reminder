import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import notifee, { TriggerType, RepeatFrequency, TimestampTrigger, AndroidImportance, AndroidCategory } from '@notifee/react-native';
import { API_URL } from '@/config';

const COLORS = {
  primary: '#0F6E56',
  bg: '#F5F8F6',
  card: '#FFFFFF',
  text: '#14211C',
  muted: '#5B6B64',
  border: '#C4D3CC',
  error: '#B3261E',
};

type Medicine = {
  _id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
};

export default function PillsScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [times, setTimes] = useState<Date[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/medicines`);
      const data = await res.json();
      setMedicines(data);
    } catch (e) {
      console.error('Failed to fetch medicines:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const onTimeSelected = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setTimes([...times, selectedDate]);
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setDosage('');
    setFrequency('');
    setTimes([]);
  };

  const handleEditMedicine = (med: Medicine) => {
    setEditingId(med._id);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    
    // Parse time string back to Date objects
    if (med.time) {
      const parsedTimes = med.time.split(', ').map(tStr => {
        const d = new Date();
        const match = tStr.match(/(\d+):(\d+)\s+(AM|PM)/i);
        if (match) {
          let h = parseInt(match[1]);
          if (match[3].toUpperCase() === 'PM' && h !== 12) h += 12;
          if (match[3].toUpperCase() === 'AM' && h === 12) h = 0;
          d.setHours(h, parseInt(match[2]), 0, 0);
        }
        return d;
      });
      setTimes(parsedTimes);
    } else {
      setTimes([]);
    }
    setModalVisible(true);
  };

  const handleSaveMedicine = async () => {
    if (!name.trim() || times.length === 0) {
      Alert.alert('Error', 'Please fill in Name and select at least one Time');
      return;
    }
    
    setSaving(true);
    const timeString = times.map(formatTime).join(', ');
    try {
      const url = editingId ? `${API_URL}/api/medicines/${editingId}` : `${API_URL}/api/medicines`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          dosage: dosage.trim() || '1 pill', 
          frequency: frequency.trim() || 'Daily', 
          time: timeString 
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save (Status ${res.status})`);
      }
      
      const savedMed = await res.json();

      // Schedule alarms with notifee
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        
        // Calculate the next timestamp for this alarm
        const now = new Date();
        const triggerTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), t.getHours(), t.getMinutes(), 0);
        if (triggerTime.getTime() <= now.getTime()) {
          triggerTime.setDate(triggerTime.getDate() + 1); // If it's already passed today, schedule for tomorrow
        }

        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: triggerTime.getTime(),
          repeatFrequency: RepeatFrequency.DAILY,
        };

        await notifee.createTriggerNotification({
          id: `${savedMed._id}-${i}`,
          title: "Time for your Medicine! 💊",
          body: `It's time to take ${savedMed.name} (${savedMed.dosage})`,
          android: {
            channelId: 'alarms_custom',
            fullScreenAction: {
              id: 'default',
            },
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.ALARM,
            pressAction: {
              id: 'default',
            },
            // This loops the sound like a real alarm until the user opens/dismisses
            loopSound: true,
          },
        }, trigger);
      }
      
      resetForm();
      setModalVisible(false);
      fetchMedicines();
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e?.message || 'Could not save medicine. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMedicine = () => {
    Alert.alert('Delete', 'Are you sure you want to delete this medicine?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            await fetch(`${API_URL}/api/medicines/${editingId}`, { method: 'DELETE' });
            
            // Cancel notifications
            if (editingId) {
              for (let i = 0; i < times.length; i++) {
                await notifee.cancelNotification(`${editingId}-${i}`).catch(() => {});
              }
            }
            
            resetForm();
            setModalVisible(false);
            fetchMedicines();
          } catch(e) {
            Alert.alert('Error', 'Could not delete medicine');
          } finally {
            setSaving(false);
          }
        }
      }
    ]);
  };

  const renderMedicine = ({ item }: { item: Medicine }) => (
    <Pressable style={styles.card} onPress={() => handleEditMedicine(item)}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="pill" size={28} color={COLORS.primary} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.cardDetailText}>{item.dosage} • {item.frequency}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Medicines</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={item => item._id}
          renderItem={renderMedicine}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="pill" size={60} color={COLORS.muted} />
              <Text style={styles.emptyText}>No medicines added yet</Text>
            </View>
          }
        />
      )}

      <Pressable style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Medicine' : 'Add Medicine'}</Text>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </Pressable>
          </View>
          
          <View style={styles.form}>
            <Text style={styles.label}>Medicine Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Paracetamol"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Time(s) to Take</Text>
            <View style={styles.timeChipsContainer}>
              {times.map((t, i) => (
                <View key={i} style={styles.timeChip}>
                  <Text style={styles.timeChipText}>{formatTime(t)}</Text>
                  <Pressable onPress={() => setTimes(times.filter((_, idx) => idx !== i))}>
                    <Ionicons name="close-circle" size={20} color={COLORS.error} />
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addTimeBtn} onPress={() => setShowPicker(true)}>
                <Ionicons name="time" size={20} color={COLORS.primary} />
                <Text style={styles.addTimeText}>Pick Time</Text>
              </Pressable>
            </View>
            
            {showPicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
                onChange={onTimeSelected}
              />
            )}

            <Text style={styles.label}>Dosage (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1 Tablet"
              value={dosage}
              onChangeText={setDosage}
            />

            <Text style={styles.label}>Frequency (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Daily"
              value={frequency}
              onChangeText={setFrequency}
            />

            <Pressable style={styles.saveButton} onPress={handleSaveMedicine} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>{editingId ? 'Update Medicine' : 'Save Medicine'}</Text>}
            </Pressable>
            
            {editingId && (
              <Pressable style={styles.deleteButton} onPress={handleDeleteMedicine} disabled={saving}>
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 20, paddingTop: 10, backgroundColor: COLORS.bg },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  listContent: { padding: 20, paddingTop: 10, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.muted },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { marginLeft: 16, flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  cardTime: { fontSize: 14, color: COLORS.primary, marginTop: 4, fontWeight: '600' },
  cardDetails: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderColor: COLORS.border },
  cardDetailText: { color: COLORS.muted, fontSize: 14, fontWeight: '500' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  modalSafe: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.text },
  timeChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  timeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F3F0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, gap: 6 },
  timeChipText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  addTimeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F8F6', borderWidth: 1, borderColor: COLORS.border, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, gap: 4 },
  addTimeText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  saveButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 32 },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDECEB', padding: 16, borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#F5B8B5', gap: 8 },
  deleteButtonText: { color: COLORS.error, fontSize: 16, fontWeight: '600' },
});
