import React, { useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, Modal, TextInput, KeyboardAvoidingView, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/services/supabase';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePassword = () => {
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const confirmPasswordChange = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    setShowPasswordModal(false);
    Alert.alert(error ? 'Error' : 'Success', error ? error.message : 'Password updated successfully!');
  };

  const sections = [
    {
      title: 'Preferences',
      rows: [
        { icon: isDark ? 'moon' : 'sunny', label: isDark ? 'Dark Mode' : 'Light Mode', type: 'toggle' as const, value: isDark, onToggle: () => toggleTheme() },
        { icon: 'notifications-outline', label: 'Notifications', type: 'toggle' as const, value: notifEnabled, onToggle: setNotifEnabled },
      ],
    },
    {
      title: 'Account',
      rows: [
        { icon: 'lock-closed-outline', label: 'Change Password', type: 'arrow' as const, onPress: handleChangePassword },
      ],
    },
    {
      title: 'Legal',
      rows: [
        { icon: 'document-text-outline', label: 'Terms & Conditions', type: 'arrow' as const },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', type: 'arrow' as const },
        { icon: 'information-circle-outline', label: 'About', type: 'arrow' as const },
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
                    {row.type === 'arrow' && <Ionicons name="chevron-forward" size={16} color={Colors.text.muted} />}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.version}>Elite eSports v1.0.0 Alpha</Text>
      </ScrollView>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPasswordModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Text style={styles.modalSubtitle}>Enter your new password (min. 6 characters)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New password"
                placeholderTextColor={Colors.text.muted}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={confirmPasswordChange}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowPasswordModal(false)}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm, passwordLoading && styles.modalBtnDisabled]}
                  onPress={confirmPasswordChange}
                  disabled={passwordLoading}
                >
                  <Text style={styles.modalBtnConfirmText}>{passwordLoading ? 'Saving…' : 'Update'}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.background.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: Colors.border.default },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 6 },
  modalSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 20 },
  modalInput: { backgroundColor: Colors.background.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, color: Colors.text.primary, fontFamily: 'Inter_400Regular', fontSize: 15, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: Colors.background.surface, borderWidth: 1, borderColor: Colors.border.default },
  modalBtnCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  modalBtnConfirm: { backgroundColor: Colors.primary },
  modalBtnConfirmText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  modalBtnDisabled: { opacity: 0.6 },
});
