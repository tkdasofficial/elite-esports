import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/services/supabase';
import { AuthInput } from '@/features/auth/components/AuthInput';
import type { AppColors } from '@/utils/colors';

const COUNTRY_CODES: Record<string, string> = {
  india: '+91', 'in': '+91', usa: '+1', 'us': '+1', uk: '+44',
  canada: '+1', australia: '+61', pakistan: '+92', bangladesh: '+880',
  uae: '+971', russia: '+7', china: '+86', japan: '+81',
};
function getCountryCode(country: string): string {
  return COUNTRY_CODES[country.trim().toLowerCase()] ?? '+91';
}

interface KYCData {
  email:         string;
  fullName:      string;
  username:      string;
  country:       string;
  region:        string;
  city:          string;
  zip:           string;
  phone:         string;
  referralCode:  string;
  kycCompleted:  boolean;
}

export default function AccountInfoScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [data, setData]       = useState<KYCData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  /* Editable personal fields */
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry]   = useState('');
  const [region, setRegion]     = useState('');
  const [city, setCity]         = useState('');
  const [zip, setZip]           = useState('');
  const [phone, setPhone]       = useState('');

  /* Email change */
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail]           = useState('');
  const [emailSaving, setEmailSaving]     = useState(false);
  const [emailMsg, setEmailMsg]           = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.back(); return; }

      const meta = authUser.user_metadata ?? {};

      /* Strip country code from phone if present */
      const rawPhone = meta.phone ?? '';
      const cleanPhone = rawPhone.replace(/^\+\d{1,3}/, '');

      const kycData: KYCData = {
        email:        authUser.email ?? '',
        fullName:     meta.full_name ?? '',
        username:     meta.username ?? '',
        country:      meta.country ?? '',
        region:       meta.region ?? '',
        city:         meta.city ?? '',
        zip:          meta.zip ?? '',
        phone:        cleanPhone,
        referralCode: meta.referral_code ?? '',
        kycCompleted: meta.kyc_completed === true,
      };

      setData(kycData);
      setFullName(kycData.fullName);
      setUsername(kycData.username);
      setCountry(kycData.country);
      setRegion(kycData.region);
      setCity(kycData.city);
      setZip(kycData.zip);
      setPhone(kycData.phone);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load account info.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const name  = fullName.trim();
    const uname = username.trim().toLowerCase().replace(/\s+/g, '');

    if (!name)                        { setError('Full name is required.'); return; }
    if (!country.trim())              { setError('Country is required.'); return; }
    if (uname && uname.length < 3)    { setError('Username must be at least 3 characters.'); return; }
    if (uname && !/^[a-z0-9_]+$/.test(uname)) {
      setError('Username can only contain letters, numbers and underscores.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      /* Check username uniqueness if it changed */
      if (uname && uname !== (data?.username ?? '').toLowerCase()) {
        const { data: taken } = await supabase
          .from('users')
          .select('id')
          .eq('username', uname)
          .neq('id', user!.id)
          .maybeSingle();
        if (taken) {
          setError('That username is already taken. Please choose another.');
          setSaving(false);
          return;
        }
      }

      const countryCode = getCountryCode(country);
      const phoneVal    = phone.trim() ? `${countryCode}${phone.trim()}` : '';

      const { error: updateErr } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          username:  uname || undefined,
          country:   country.trim(),
          region:    region.trim(),
          city:      city.trim(),
          zip:       zip.trim(),
          phone:     phoneVal,
        },
      });

      if (updateErr) throw updateErr;

      /* Also update name + username in public users table */
      if (user?.id) {
        await supabase
          .from('users')
          .upsert(
            { id: user.id, name, ...(uname ? { username: uname } : {}) },
            { onConflict: 'id' }
          );
      }

      /* Refresh local state */
      await loadData();
      setEditing(false);
      Alert.alert('Saved', 'Your account information has been updated.');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (data) {
      setFullName(data.fullName);
      setUsername(data.username);
      setCountry(data.country);
      setRegion(data.region);
      setCity(data.city);
      setZip(data.zip);
      setPhone(data.phone);
    }
    setError('');
    setEditing(false);
  };

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) { setEmailMsg('Please enter a new email address.'); return; }
    if (trimmed === (data?.email ?? '').toLowerCase()) {
      setEmailMsg('This is already your current email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailMsg('Please enter a valid email address.');
      return;
    }
    setEmailSaving(true);
    setEmailMsg('');
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ email: trimmed });
      if (updateErr) throw updateErr;
      setEmailMsg('✓ A confirmation link was sent to your new email. Click it to complete the change.');
      setNewEmail('');
    } catch (e: any) {
      setEmailMsg(e?.message ?? 'Failed to request email change. Try again.');
    } finally {
      setEmailSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Account Info" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Account Info"
        rightElement={!editing ? (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ width: 48, alignItems: 'center' }}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : undefined}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* KYC badge */}
          {data?.kycCompleted && (
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={styles.badgeText}>KYC Verified</Text>
            </View>
          )}

          {/* ── Account credentials ── */}
          <SectionTitle label="Account" colors={colors} styles={styles} />
          <View style={styles.card}>
            {/* Email row with inline change form */}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="mail-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{data?.email ?? '—'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => { setChangingEmail(v => !v); setEmailMsg(''); setNewEmail(''); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.changeEmailBtn}>
                  {changingEmail ? 'Cancel' : 'Change'}
                </Text>
              </TouchableOpacity>
            </View>

            {changingEmail && (
              <View style={styles.changeEmailWrap}>
                <AuthInput
                  label="New Email Address"
                  value={newEmail}
                  onChangeText={v => { setNewEmail(v); setEmailMsg(''); }}
                  placeholder="you@example.com"
                  iconName="mail-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  onSubmitEditing={handleChangeEmail}
                  returnKeyType="send"
                />
                {!!emailMsg && (
                  <Text style={[
                    styles.emailMsgText,
                    { color: emailMsg.startsWith('✓') ? '#22C55E' : colors.status.error },
                  ]}>{emailMsg}</Text>
                )}
                <TouchableOpacity
                  style={[styles.saveBtn, (!newEmail.trim() || emailSaving) && styles.btnDisabled, { marginTop: 10 }]}
                  onPress={handleChangeEmail}
                  disabled={!newEmail.trim() || emailSaving}
                  activeOpacity={0.85}
                >
                  {emailSaving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveText}>Send Confirmation</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            <Divider colors={colors} />
            <InfoRow
              icon="at-outline"
              label="Username"
              value={data?.username ? `@${data.username}` : '—'}
              colors={colors}
              styles={styles}
            />
            {data?.referralCode ? (
              <>
                <Divider colors={colors} />
                <InfoRow
                  icon="gift-outline"
                  label="Referral Code Used"
                  value={data.referralCode}
                  colors={colors}
                  styles={styles}
                />
              </>
            ) : null}
          </View>

          {/* ── Personal details (editable) ── */}
          <SectionTitle label="Personal Details" colors={colors} styles={styles} />

          {editing ? (
            <View style={styles.editCard}>
              <View style={styles.fieldGap}>
                <AuthInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={v => { setFullName(v); setError(''); }}
                  placeholder="Your full name"
                  iconName="person-outline"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldGap}>
                <AuthInput
                  label="Username"
                  value={username}
                  onChangeText={v => { setUsername(v.toLowerCase().replace(/\s/g, '')); setError(''); }}
                  placeholder="alex_gamer"
                  iconName="at-outline"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.fieldGap}>
                <AuthInput
                  label="Country"
                  value={country}
                  onChangeText={v => { setCountry(v); setError(''); }}
                  placeholder="e.g. India"
                  iconName="earth-outline"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldGap}>
                <AuthInput
                  label="State / Region"
                  value={region}
                  onChangeText={setRegion}
                  placeholder="e.g. Maharashtra"
                  iconName="map-outline"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldGap}>
                <AuthInput
                  label="City"
                  value={city}
                  onChangeText={setCity}
                  placeholder="e.g. Mumbai"
                  iconName="business-outline"
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.fieldGap}>
                <AuthInput
                  label="ZIP / Postal Code"
                  value={zip}
                  onChangeText={setZip}
                  placeholder="e.g. 400001"
                  iconName="location-outline"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.fieldGap}>
                <AuthInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Without country code"
                  iconName="call-outline"
                  keyboardType="phone-pad"
                />
              </View>

              {!!error && (
                <View style={styles.errorWrap}>
                  <Ionicons name="alert-circle-outline" size={15} color={colors.status.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancel}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.saveText}>Save Changes</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.card}>
              <InfoRow icon="person-outline" label="Full Name" value={data?.fullName || '—'} colors={colors} styles={styles} />
              <Divider colors={colors} />
              <InfoRow icon="earth-outline" label="Country" value={data?.country || '—'} colors={colors} styles={styles} />
              {data?.region ? (
                <>
                  <Divider colors={colors} />
                  <InfoRow icon="map-outline" label="State / Region" value={data.region} colors={colors} styles={styles} />
                </>
              ) : null}
              {data?.city ? (
                <>
                  <Divider colors={colors} />
                  <InfoRow icon="business-outline" label="City" value={data.city} colors={colors} styles={styles} />
                </>
              ) : null}
              {data?.zip ? (
                <>
                  <Divider colors={colors} />
                  <InfoRow icon="location-outline" label="ZIP Code" value={data.zip} colors={colors} styles={styles} />
                </>
              ) : null}
              {data?.phone ? (
                <>
                  <Divider colors={colors} />
                  <InfoRow icon="call-outline" label="Phone" value={data.phone} colors={colors} styles={styles} />
                </>
              ) : null}

              <Divider colors={colors} />
              <TouchableOpacity style={styles.editRow} onPress={() => setEditing(true)} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.editRowText}>Edit Personal Details</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ── Small helper components ── */

function SectionTitle({ label, colors, styles }: { label: string; colors: AppColors; styles: any }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

function InfoRow({
  icon, label, value, colors, styles, note, onPress,
}: {
  icon: string; label: string; value: string;
  colors: AppColors; styles: any; note?: string; onPress?: () => void;
}) {
  const C = onPress ? TouchableOpacity : View;
  return (
    <C style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
        {note ? <Text style={styles.infoNote}>{note}</Text> : null}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={14} color={colors.text.muted} />}
    </C>
  );
}

function Divider({ colors }: { colors: AppColors }) {
  return <View style={{ height: 1, backgroundColor: colors.border.default, marginHorizontal: 16 }} />;
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scroll:    { padding: 16 },

    badge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: '#22C55E18',
      borderWidth: 1, borderColor: '#22C55E44',
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
    },
    badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#22C55E' },

    sectionTitle: {
      fontSize: 12, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, textTransform: 'uppercase',
      letterSpacing: 0.8, marginBottom: 8, marginTop: 16, paddingHorizontal: 4,
    },

    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16, borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden',
    },
    editCard: {
      backgroundColor: colors.background.card,
      borderRadius: 16, borderWidth: 1, borderColor: colors.border.default,
      padding: 16,
    },
    fieldGap: { marginBottom: 12 },

    infoRow: {
      flexDirection: 'row', alignItems: 'center',
      gap: 12, paddingHorizontal: 16, paddingVertical: 14,
    },
    infoIconBox: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    infoText: { flex: 1 },
    infoLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginBottom: 2 },
    infoValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    infoNote:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },

    editRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    editRowText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    errorWrap: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 6, marginBottom: 12, marginTop: 4,
    },
    errorText: {
      color: colors.status.error, fontSize: 13,
      fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18,
    },

    changeEmailBtn: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary,
    },
    changeEmailWrap: {
      paddingHorizontal: 16, paddingBottom: 14,
    },
    emailMsgText: {
      fontSize: 12, fontFamily: 'Inter_400Regular',
      lineHeight: 18, marginTop: 6,
    },

    editActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
    cancelBtn: {
      flex: 1, height: 46, borderRadius: 23,
      backgroundColor: colors.background.elevated,
      borderWidth: 1, borderColor: colors.border.default,
      alignItems: 'center', justifyContent: 'center',
    },
    cancelText: { color: colors.text.secondary, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    saveBtn: {
      flex: 2, height: 46, borderRadius: 23,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.5 },
    saveText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  });
}
