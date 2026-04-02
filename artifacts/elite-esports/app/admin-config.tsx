import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAppConfig, AppConfig } from '@/hooks/useAppConfig';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/store/AuthContext';
import { router } from 'expo-router';
import type { AppColors } from '@/utils/colors';

const ADMIN_ID = '6771dad2-8719-48c0-8907-3bb6da336835';

const EMAIL_FIELDS: { key: keyof AppConfig; label: string; placeholder: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'support_email',  label: 'Support Email',  placeholder: 'help@example.com',   icon: 'headset-outline' },
  { key: 'queries_email',  label: 'Queries Email',  placeholder: 'info@example.com',   icon: 'chatbox-outline' },
  { key: 'legal_email',    label: 'Legal Email',    placeholder: 'legal@example.com',  icon: 'briefcase-outline' },
];

const SOCIAL_FIELDS: { key: keyof AppConfig; label: string; placeholder: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'youtube_url',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourpage',   icon: 'logo-youtube',   color: '#FF0000' },
  { key: 'facebook_url',  label: 'Facebook',  placeholder: 'https://facebook.com/yourpage',   icon: 'logo-facebook',  color: '#1877F2' },
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/yourpage',  icon: 'logo-instagram', color: '#E1306C' },
  { key: 'twitch_url',    label: 'Twitch',    placeholder: 'https://twitch.tv/yourpage',      icon: 'logo-twitch',    color: '#9146FF' },
  { key: 'twitter_url',   label: 'X (Twitter)', placeholder: 'https://x.com/yourpage',        icon: 'logo-twitter',   color: '#000000' },
  { key: 'snapchat_url',  label: 'Snapchat',  placeholder: 'https://snapchat.com/add/you',    icon: 'logo-snapchat',  color: '#FFFC00' },
  { key: 'linkedin_url',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/you',icon: 'logo-linkedin',  color: '#0A66C2' },
];

export default function AdminConfigScreen() {
  const { user }    = useAuth();
  const { colors }  = useTheme();
  const styles      = useMemo(() => createStyles(colors), [colors]);
  const insets      = useSafeAreaInsets();
  const { config, loading } = useAppConfig();

  const [form, setForm]       = useState<Partial<AppConfig>>({});
  const [saving, setSaving]   = useState(false);

  /* Redirect non-admins away */
  useEffect(() => {
    if (user && user.id !== ADMIN_ID) {
      Alert.alert('Access Denied', 'You do not have admin privileges.');
      router.back();
    }
  }, [user]);

  /* Populate form once config loads */
  useEffect(() => {
    if (!loading) setForm({ ...config });
  }, [loading]);

  const update = (key: keyof AppConfig, val: string) =>
    setForm(prev => ({ ...prev, [key]: val.trim() === '' ? null : val.trim() }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('app_config')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', 'main');
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'App config has been updated successfully.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Admin — App Config" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Contact Emails ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="mail-outline" size={15} color={colors.primary} />
          <Text style={styles.sectionTitle}>Contact Emails</Text>
        </View>
        <Text style={styles.sectionHint}>Leave blank to hide the field from users.</Text>
        <View style={styles.card}>
          {EMAIL_FIELDS.map((f, i) => (
            <React.Fragment key={f.key}>
              {i > 0 && <View style={styles.fieldDivider} />}
              <View style={styles.field}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name={f.icon} size={14} color={colors.primary} />
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={(form[f.key] as string) ?? ''}
                  onChangeText={v => update(f.key, v)}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.text.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </React.Fragment>
          ))}
        </View>

        {/* ── Social Links ── */}
        <View style={styles.sectionHeader}>
          <Ionicons name="share-social-outline" size={15} color={colors.primary} />
          <Text style={styles.sectionTitle}>Social Media Links</Text>
        </View>
        <Text style={styles.sectionHint}>Add full URLs. Leave blank to hide the platform button.</Text>
        <View style={styles.card}>
          {SOCIAL_FIELDS.map((f, i) => (
            <React.Fragment key={f.key}>
              {i > 0 && <View style={styles.fieldDivider} />}
              <View style={styles.field}>
                <View style={styles.fieldLabelRow}>
                  <View style={[styles.socialDot, { backgroundColor: f.color }]}>
                    <Ionicons name={f.icon} size={13} color={f.color === '#FFFC00' ? '#000' : '#fff'} />
                  </View>
                  <Text style={styles.fieldLabel}>{f.label}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={(form[f.key] as string) ?? ''}
                  onChangeText={v => update(f.key, v)}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.text.muted}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </React.Fragment>
          ))}
        </View>

      </ScrollView>

      {/* ── Floating Save Button ── */}
      <View style={[styles.saveCta, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 16 },

    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      marginBottom: 5, marginLeft: 2,
    },
    sectionTitle: {
      fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.text.primary,
      textTransform: 'uppercase', letterSpacing: 1,
    },
    sectionHint: {
      fontSize: 12, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, marginBottom: 10, marginLeft: 2,
    },

    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16, borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden', marginBottom: 24,
    },

    fieldDivider: { height: 1, backgroundColor: colors.border.subtle },
    field: { paddingHorizontal: 14, paddingVertical: 12 },
    fieldLabelRow: {
      flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8,
    },
    fieldLabel: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary,
    },
    socialDot: {
      width: 22, height: 22, borderRadius: 6,
      alignItems: 'center', justifyContent: 'center',
    },

    input: {
      backgroundColor: colors.background.elevated,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.primary,
      borderWidth: 1, borderColor: colors.border.subtle,
    },

    saveCta: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 16, paddingTop: 10,
      backgroundColor: colors.background.dark + 'F5',
      borderTopWidth: 1, borderTopColor: colors.border.default,
    },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14, height: 52,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: {
      color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold',
    },
  });
}
