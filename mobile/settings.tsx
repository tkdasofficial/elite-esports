import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useUserStore } from '@/src/store/userStore';
import { Colors } from '@/src/theme/colors';

const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Bengali'];
const NOTIFICATION_OPTS = ['All', 'Matches Only', 'None'];

interface RowProps {
  icon: string;
  label: string;
  iconBg?: string;
  iconColor?: string;
  value?: string;
  toggle?: boolean;
  toggleOn?: boolean;
  onToggle?: () => void;
  onPress?: () => void;
  danger?: boolean;
}

function Row({ icon, label, iconBg, iconColor, value, toggle, toggleOn, onToggle, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={toggle && !onPress}>
      <View style={[styles.rowIcon, iconBg ? { backgroundColor: iconBg } : {}]}>
        <Ionicons name={icon as any} size={17} color={iconColor || Colors.textSecondary} />
      </View>
      <Text style={[styles.rowLabel, danger && { color: Colors.brandLive }]}>{label}</Text>
      {toggle ? (
        <Switch value={toggleOn} onValueChange={onToggle} thumbColor={Colors.white} trackColor={{ false: Colors.appElevated, true: Colors.brandPrimary }} />
      ) : (
        <View style={styles.rowRight}>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuthStore();
  const { logout } = useUserStore();
  const [notifications, setNotifications] = useState('All');
  const [language, setLanguage] = useState('English');
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [showLang, setShowLang] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { logout(); await signOut(); } },
    ]);
  };

  const Picker = ({ visible, options, current, onSelect, onClose }: any) => (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
          <View style={styles.handle} />
          {options.map((opt: string) => (
            <TouchableOpacity key={opt} style={styles.pickerRow} onPress={() => { onSelect(opt); onClose(); }}>
              <Text style={styles.pickerText}>{opt}</Text>
              {opt === current && <View style={styles.check}><View style={styles.checkInner} /></View>}
            </TouchableOpacity>
          ))}
          <View style={{ height: insets.bottom + 8 }} />
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <Row icon="notifications" label="Notifications" iconBg={`${Colors.brandWarning}25`} iconColor={Colors.brandWarning} value={notifications} onPress={() => setShowNotif(true)} />
          <View style={styles.divider} />
          <Row icon="globe" label="Language" iconBg={`${Colors.brandSuccess}25`} iconColor={Colors.brandSuccess} value={language} onPress={() => setShowLang(true)} />
          <View style={styles.divider} />
          <Row icon="eye" label="Online Status" iconBg={`${Colors.brandPrimary}25`} iconColor={Colors.brandPrimaryLight} toggle toggleOn={onlineStatus} onToggle={() => setOnlineStatus(v => !v)} />
        </View>

        <Text style={[styles.sectionLabel, styles.mt]}>PRIVACY & SECURITY</Text>
        <View style={styles.card}>
          <Row icon="shield" label="Privacy Policy" onPress={() => router.push('/privacy')} />
          <View style={styles.divider} />
          <Row icon="person-remove" label="Blocked Users" onPress={() => router.push('/blocked-users')} />
        </View>

        <Text style={[styles.sectionLabel, styles.mt]}>SUPPORT</Text>
        <View style={styles.card}>
          <Row icon="help-circle" label="Help Center" onPress={() => router.push('/help')} />
          <View style={styles.divider} />
          <Row icon="information-circle" label="About Elite Esports" onPress={() => router.push('/about')} />
          <View style={styles.divider} />
          <Row icon="phone-portrait" label="App Version" value="1.0.0" />
        </View>

        <Text style={[styles.sectionLabel, styles.mt]}>LEGAL</Text>
        <View style={styles.card}>
          <Row icon="document-text" label="Terms & Conditions" onPress={() => router.push('/terms')} />
        </View>

        <View style={[styles.card, styles.mt]}>
          <Row icon="log-out" label="Sign Out" iconBg={`${Colors.brandLive}25`} iconColor={Colors.brandLive} danger onPress={handleSignOut} />
        </View>

        <Text style={styles.footer}>Elite Esports Platform · v1.0.0 · Build 2026.03</Text>
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      <Picker visible={showNotif} options={NOTIFICATION_OPTS} current={notifications} onSelect={setNotifications} onClose={() => setShowNotif(false)} />
      <Picker visible={showLang} options={LANGUAGES} current={language} onSelect={setLanguage} onClose={() => setShowLang(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, letterSpacing: 0.06 },
  mt: { marginTop: 24 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.appElevated, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16, color: Colors.textPrimary },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 14, color: Colors.textMuted },
  divider: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 66 },
  footer: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 32, opacity: 0.5 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: Colors.appCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 4 },
  handle: { width: 40, height: 5, backgroundColor: Colors.appElevated, borderRadius: 3, alignSelf: 'center', marginVertical: 12 },
  pickerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.appBorder,
  },
  pickerText: { fontSize: 16, color: Colors.textPrimary },
  check: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.brandPrimary, alignItems: 'center', justifyContent: 'center' },
  checkInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.white },
});
