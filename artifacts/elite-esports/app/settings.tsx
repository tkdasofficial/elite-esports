import React, { useState } from 'react';
import {
  View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/services/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingRow {
  icon: string;
  label: string;
  type: 'toggle' | 'arrow' | 'danger';
  value?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const handleChangePassword = () => {
    Alert.prompt(
      'Change Password',
      'Enter your new password',
      async (newPass) => {
        if (newPass && newPass.length >= 6) {
          const { error } = await supabase.auth.updateUser({ password: newPass });
          Alert.alert(error ? 'Error' : 'Success', error ? error.message : 'Password updated!');
        } else {
          Alert.alert('Error', 'Password must be at least 6 characters');
        }
      },
      'secure-text',
    );
  };

  const sections: { title: string; rows: SettingRow[] }[] = [
    {
      title: 'Preferences',
      rows: [
        {
          icon: isDark ? 'moon' : 'sunny',
          label: isDark ? 'Dark Mode' : 'Light Mode',
          type: 'toggle',
          value: isDark,
          onToggle: () => toggleTheme(),
        },
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          type: 'toggle',
          value: notifEnabled,
          onToggle: setNotifEnabled,
        },
      ],
    },
    {
      title: 'Account',
      rows: [
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          type: 'arrow',
          onPress: Platform.OS === 'ios' ? handleChangePassword : undefined,
        },
      ],
    },
    {
      title: 'Legal',
      rows: [
        { icon: 'document-text-outline', label: 'Terms & Conditions', type: 'arrow' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', type: 'arrow' },
        { icon: 'information-circle-outline', label: 'About', type: 'arrow' },
      ],
    },
    {
      title: 'Danger Zone',
      rows: [
        {
          icon: 'log-out-outline',
          label: 'Sign Out',
          type: 'danger',
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
                    onPress={row.onPress}
                    activeOpacity={row.type === 'toggle' ? 1 : 0.75}
                    disabled={row.type === 'toggle' || !row.onPress}
                  >
                    <View style={[styles.iconBox, row.type === 'danger' && styles.dangerIconBox]}>
                      <Ionicons name={row.icon as any} size={18} color={row.type === 'danger' ? Colors.status.error : Colors.primary} />
                    </View>
                    <Text style={[styles.rowLabel, row.type === 'danger' && styles.dangerLabel]}>{row.label}</Text>
                    {row.type === 'toggle' && (
                      <Switch
                        value={row.value}
                        onValueChange={row.onToggle}
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
