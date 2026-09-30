import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalUser, setGlobalUser } from '@/store';

const COLORS = {
  primary: '#0F6E56',
  bg: '#F5F8F6',
  card: '#FFFFFF',
  text: '#14211C',
  muted: '#5B6B64',
  border: '#C4D3CC',
  error: '#B3261E',
};

export default function ProfileScreen() {
  const router = useRouter();

  // Fetch the dynamically logged-in user from our global store!
  const user = globalUser || {
    name: 'Guest User',
    email: 'Not logged in',
    phone: '+1 (555) 000-0000'
  };


  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          // Clear any saved tokens/state here
          setGlobalUser(null);
          router.replace('/login' as any);
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="mail-outline" size={24} color={COLORS.primary} />
            <View style={styles.rowText}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="call-outline" size={24} color={COLORS.primary} />
            <View style={styles.rowText}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{user.phone || 'Not provided'}</Text>
            </View>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: { alignItems: 'center', paddingVertical: 40 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowText: { marginLeft: 16 },
  label: { fontSize: 14, color: COLORS.muted, marginBottom: 2 },
  value: { fontSize: 16, color: COLORS.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 16, marginLeft: 40 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FDECEB', marginHorizontal: 20, marginTop: 40,
    paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F5B8B5'
  },
  logoutPressed: { backgroundColor: '#FAD4D2' },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
