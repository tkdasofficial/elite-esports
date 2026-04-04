import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { AuthInput } from '@/features/auth/components/AuthInput';
import type { AppColors } from '@/utils/colors';

const COUNTRY_CODES: Record<string, string> = {
  india: '+91', 'in': '+91',
  usa: '+1', 'us': '+1', 'united states': '+1', 'united states of america': '+1',
  uk: '+44', 'united kingdom': '+44', england: '+44',
  canada: '+1', ca: '+1',
  australia: '+61', au: '+61',
  pakistan: '+92', pk: '+92',
  bangladesh: '+880', bd: '+880',
  nepal: '+977', np: '+977',
  'sri lanka': '+94', lk: '+94',
  germany: '+49', de: '+49',
  france: '+33', fr: '+33',
  brazil: '+55', br: '+55',
  indonesia: '+62', id: '+62',
  philippines: '+63', ph: '+63',
  malaysia: '+60', my: '+60',
  singapore: '+65', sg: '+65',
  uae: '+971', 'united arab emirates': '+971', ae: '+971',
  russia: '+7', ru: '+7',
  china: '+86', cn: '+86',
  japan: '+81', jp: '+81',
  'south korea': '+82', kr: '+82',
};

function getCountryCode(country: string): string {
  const key = country.trim().toLowerCase();
  return COUNTRY_CODES[key] ?? '+91';
}

export default function KYCScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('India');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const email = user?.email ?? '';
  const countryCode = getCountryCode(country);

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  const isReady =
    fullName.trim().length > 0 &&
    username.trim().length >= 3 &&
    country.trim().length > 0 &&
    termsAccepted &&
    privacyAccepted;

  const handleComplete = async () => {
    const name = fullName.trim();
    const uname = username.trim().toLowerCase().replace(/\s+/g, '');
    const countryVal = country.trim();
    const regionVal = region.trim();
    const cityVal = city.trim();
    const zipVal = zip.trim();
    const phoneVal = phone.trim();

    if (!name) { setError('Please enter your full name.'); return; }
    if (!uname || uname.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!/^[a-z0-9_]+$/.test(uname)) { setError('Username can only contain letters, numbers, and underscores.'); return; }
    if (!countryVal) { setError('Please enter your country.'); return; }
    if (!termsAccepted) { setError('Please accept the Terms of Service to continue.'); return; }
    if (!privacyAccepted) { setError('Please accept the Privacy Policy to continue.'); return; }
    if (!user?.id) { setError('Not authenticated. Please sign in again.'); return; }

    setError('');
    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('username', uname)
        .neq('id', user.id)
        .maybeSingle();

      if (existing) {
        setError('This username is already taken. Please choose another.');
        setLoading(false);
        return;
      }

      const { error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name,
          username: uname,
          avatar_url: '0',
        }, { onConflict: 'id' });

      if (upsertError) {
        setError(upsertError.message);
        setLoading(false);
        return;
      }

      await supabase.auth.updateUser({
        data: {
          full_name: name,
          username: uname,
          country: countryVal,
          region: regionVal,
          city: cityVal,
          zip: zipVal,
          phone: phoneVal ? `${countryCode}${phoneVal}` : '',
          terms_accepted: true,
          privacy_accepted: true,
          kyc_completed: true,
        },
      });

      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="person-circle-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us a bit about yourself to get started
            </Text>
          </View>

          {/* ── Section: Personal Info ── */}
          <SectionLabel label="Personal Info" colors={colors} />

          <View style={styles.fieldWrap}>
            <AuthInput
              label="Full Name"
              value={fullName}
              onChangeText={v => { setFullName(v); setError(''); }}
              placeholder="e.g. Alex Jordan"
              iconName="person-outline"
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>

          <View style={styles.fieldWrap}>
            <AuthInput
              label="Username"
              value={username}
              onChangeText={v => { setUsername(v.toLowerCase().replace(/\s/g, '')); setError(''); }}
              placeholder="e.g. alex_gamer"
              iconName="at-outline"
              autoCapitalize="none"
              autoComplete="username"
            />
          </View>

          {/* ── Section: Location ── */}
          <SectionLabel label="Location" colors={colors} />

          <View style={styles.fieldWrap}>
            <AuthInput
              label="Country"
              value={country}
              onChangeText={v => { setCountry(v); setError(''); }}
              placeholder="e.g. India"
              iconName="globe-outline"
              autoCapitalize="words"
            />
          </View>

          <View style={[styles.fieldWrap, styles.rowFields]}>
            <View style={styles.halfField}>
              <AuthInput
                label="Region / State"
                value={region}
                onChangeText={v => { setRegion(v); setError(''); }}
                placeholder="e.g. Maharashtra"
                iconName="map-outline"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.halfField}>
              <AuthInput
                label="City"
                value={city}
                onChangeText={v => { setCity(v); setError(''); }}
                placeholder="e.g. Mumbai"
                iconName="location-outline"
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <AuthInput
              label="Zip / Postal Code"
              value={zip}
              onChangeText={v => { setZip(v); setError(''); }}
              placeholder="e.g. 400001"
              iconName="pin-outline"
              keyboardType="number-pad"
            />
          </View>

          {/* ── Section: Contact ── */}
          <SectionLabel label="Contact" colors={colors} />

          {/* Email — locked */}
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={[styles.lockedField]}>
              <View style={styles.lockedIcon}>
                <Ionicons name="mail-outline" size={18} color={colors.text.muted} />
              </View>
              <Text style={styles.lockedText} numberOfLines={1}>{email}</Text>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={12} color={colors.text.muted} />
              </View>
            </View>
          </View>

          {/* Phone with locked country code */}
          <View style={styles.fieldWrap}>
            <Text style={styles.inputLabel}>WHATSAPP NUMBER</Text>
            <View style={styles.phoneRow}>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{countryCode}</Text>
                <Ionicons name="lock-closed" size={11} color={colors.text.muted} style={{ marginLeft: 3 }} />
              </View>
              <View style={[styles.phoneInputWrap, { flex: 1 }]}>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={v => { setPhone(v.replace(/[^0-9]/g, '')); setError(''); }}
                  placeholder="Phone number"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </View>
            <Text style={styles.phoneHint}>Used for WhatsApp notifications</Text>
          </View>

          {/* ── Section: Agreements ── */}
          <SectionLabel label="Agreements" colors={colors} />

          <CheckboxRow
            checked={termsAccepted}
            onToggle={() => setTermsAccepted(v => !v)}
            label="I agree to the "
            linkLabel="Terms of Service"
            onLink={() => router.push('/terms')}
            colors={colors}
            styles={styles}
          />

          <CheckboxRow
            checked={privacyAccepted}
            onToggle={() => setPrivacyAccepted(v => !v)}
            label="I agree to the "
            linkLabel="Privacy Policy"
            onLink={() => router.push('/privacy')}
            colors={colors}
            styles={styles}
          />

          {/* ── Error ── */}
          {!!error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Submit ── */}
          <TouchableOpacity
            style={[styles.btn, (!isReady || loading) && styles.btnDisabled]}
            onPress={handleComplete}
            disabled={!isReady || loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={styles.btnInner}>
                  <Text style={styles.btnText}>Complete Setup</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SectionLabel({ label, colors }: { label: string; colors: AppColors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 8, gap: 10 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary, letterSpacing: 1 }}>
        {label.toUpperCase()}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border.default }} />
    </View>
  );
}

function CheckboxRow({
  checked, onToggle, label, linkLabel, onLink, colors, styles,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  linkLabel: string;
  onLink: () => void;
  colors: AppColors;
  styles: any;
}) {
  return (
    <TouchableOpacity
      style={styles.checkRow}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={13} color="#000" />}
      </View>
      <Text style={styles.checkLabel}>
        {label}
        <Text onPress={onLink} style={styles.checkLink}>{linkLabel}</Text>
      </Text>
    </TouchableOpacity>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingTop: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 28,
    },
    iconWrap: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: colors.background.elevated,
      borderWidth: 1.5, borderColor: colors.primary + '35',
      alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    title: {
      fontSize: 24, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, textAlign: 'center', marginBottom: 6,
    },
    subtitle: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, textAlign: 'center', lineHeight: 21,
    },
    fieldWrap: { marginBottom: 14 },
    rowFields: {
      flexDirection: 'row',
      gap: 10,
    },
    halfField: { flex: 1 },
    inputLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, marginBottom: 8,
      letterSpacing: 0.6, textTransform: 'uppercase',
    },
    lockedField: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: 27, borderWidth: 1.5, borderColor: colors.border.default,
      height: 54, overflow: 'hidden', opacity: 0.7,
    },
    lockedIcon: {
      width: 48, alignItems: 'center', justifyContent: 'center',
    },
    lockedText: {
      flex: 1, color: colors.text.secondary,
      fontSize: 15, fontFamily: 'Inter_400Regular',
    },
    lockedBadge: {
      width: 48, alignItems: 'center', justifyContent: 'center',
    },
    phoneRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'stretch',
    },
    codeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: 27, borderWidth: 1.5, borderColor: colors.border.default,
      height: 54,
      paddingHorizontal: 14,
      gap: 4,
      opacity: 0.7,
    },
    codeText: {
      color: colors.text.secondary,
      fontSize: 15, fontFamily: 'Inter_600SemiBold',
    },
    phoneInputWrap: {
      backgroundColor: colors.background.elevated,
      borderRadius: 27, borderWidth: 1.5, borderColor: colors.border.default,
      height: 54, justifyContent: 'center', paddingHorizontal: 18,
    },
    phoneInput: {
      color: colors.text.primary, fontSize: 15,
      fontFamily: 'Inter_400Regular',
    },
    phoneHint: {
      fontSize: 11, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, marginTop: 5, paddingHorizontal: 4,
    },
    checkRow: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 12, marginBottom: 14, paddingHorizontal: 2,
    },
    checkbox: {
      width: 22, height: 22, borderRadius: 6,
      borderWidth: 1.5, borderColor: colors.border.default,
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center',
      marginTop: 1,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkLabel: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, lineHeight: 21,
    },
    checkLink: {
      color: colors.primary, fontFamily: 'Inter_600SemiBold',
    },
    errorWrap: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 6, marginBottom: 16, paddingHorizontal: 4,
    },
    errorText: {
      color: colors.status.error, fontSize: 13,
      fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18,
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: 25, height: 52,
      alignItems: 'center', justifyContent: 'center', marginTop: 8,
    },
    btnDisabled: { opacity: 0.45 },
    btnInner: { flexDirection: 'row', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  });
}
