import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/services/supabase';

function ChangePasswordModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    if (newPass.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (newPass !== confirm) { Alert.alert('Error', 'Passwords do not match'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Success', 'Password updated!'); setNewPass(''); setConfirm(''); onClose(); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.card}>
          <Text style={modal.title}>Change Password</Text>
          <View style={modal.inputWrapper}>
            <TextInput style={modal.input} value={newPass} onChangeText={setNewPass} placeholder="New password" placeholderTextColor={Colors.text.muted} secureTextEntry />
          </View>
          <View style={modal.inputWrapper}>
            <TextInput style={modal.input} value={confirm} onChangeText={setConfirm} placeholder="Confirm password" placeholderTextColor={Colors.text.muted} secureTextEntry />
          </View>
          <View style={modal.btnRow}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modal.saveBtn, loading && { opacity: 0.6 }]} onPress={handleChange} disabled={loading} activeOpacity={0.85}>
              <Text style={modal.saveText}>{loading ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showPassModal, setShowPassModal] = useState(false);

  const sections = [
    {
      title: 'Preferences',
      rows: [
        { icon: isDark ? 'moon' : 'sunny', label: isDark ? 'Dark Mode' : 'Light Mode', type: 'toggle' as const, value: isDark, onToggle: () => toggleTheme() },
        { icon: 'notifications-outline', label: 'Notifications', type: 'toggle' as const, value: notifEnabled, onToggle: (v: boolean) => setNotifEnabled(v) },
      ],
    },
    {
      title: 'Account',
      rows: [
        { icon: 'lock-closed-outline', label: 'Change Password', type: 'arrow' as const, onPress: () => setShowPassModal(true) },
      ],
    },
    {
      title: 'Legal',
      rows: [
        { icon: 'document-text-outline', label: 'Terms & Conditions', type: 'arrow' as const, onPress: undefined },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', type: 'arrow' as const, onPress: undefined },
        { icon: 'information-circle-outline', label: 'About', type: 'arrow' as const, onPress: undefined },
      ],
    },
    {
      title: 'Danger Zone',
      rows: [
        {
          icon: 'log-out-outline', label: 'Sign Out', type: 'danger' as const,
          onPress: () => Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut },
          ]),
        },
      ],
    },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <ChangePasswordModal visible={showPassModal} onClose={() => setShowPassModal(false)} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <View key={row.label}>
                  {i > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.row}
                    onPress={row.type !== 'toggle' ? (row as any).onPress : undefined}
                    activeOpacity={row.type === 'toggle' ? 1 : 0.75}
                    disabled={row.type === 'toggle' || !(row as any).onPress}
                  >
                    <View style={[styles.iconBox, row.type === 'danger' && styles.dangerIconBox]}>
                      <Ionicons name={row.icon as any} size={18} color={row.type === 'danger' ? Colors.status.error : Colors.primary} />
                    </View>
                    <Text style={[styles.rowLabel, row.type === 'danger' && styles.dangerLabel]}>{row.label}</Text>
                    {row.type === 'toggle' && (
                      <Switch
                        value={(row as any).value}
                        onValueChange={(row as any).onToggle}
                        trackColor={{ false: Colors.background.surface, true: Colors.primary }}
                        thumbColor="#fff"
                      />
                    )}
                    {(row.type === 'arrow' || row.type === 'danger') && (
                      <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.version}>Elite eSports v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: Colors.background.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(254,76,17,0.1)', alignItems: 'center', justifyContent: 'center' },
  dangerIconBox: { backgroundColor: 'rgba(239,68,68,0.1)' },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  dangerLabel: { color: Colors.status.error },
  divider: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: 64 },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 8 },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: Colors.background.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border.default },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 20 },
  inputWrapper: { backgroundColor: Colors.background.elevated, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 14, height: 50, justifyContent: 'center', marginBottom: 12 },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background.elevated, borderWidth: 1, borderColor: Colors.border.default },
  cancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  saveBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary },
  saveText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
