import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  FlatList, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/services/supabase';
import { useTheme } from '@/store/ThemeContext';
import { useAuth } from '@/store/AuthContext';
import { AvatarSVG, AVATAR_NAMES, AVATAR_COUNT } from '@/components/AvatarSVG';
import { AuthInput } from '@/features/auth/components/AuthInput';
import type { AppColors } from '@/utils/colors';

const AVATAR_COLS = 4;
const AVATARS = Array.from({ length: AVATAR_COUNT }, (_, i) => i);

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const oauthName: string =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    '';

  const oauthUsername: string = (() => {
    const raw: string =
      user?.user_metadata?.user_name ||
      user?.user_metadata?.preferred_username ||
      user?.user_metadata?.login ||
      '';
    return raw.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  })();

  const [fullName, setFullName] = useState(oauthName);
  const [username, setUsername] = useState(oauthUsername);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topPad = insets.top;

  const gradientColors: [string, string, string] = isDark
    ? ['#150400', '#0A0A0A', '#0A0A0A']
    : [colors.primary + '18', colors.background.dark, colors.background.dark];

  const handleComplete = async () => {
    const name = fullName.trim();
    const uname = username.trim().toLowerCase().replace(/\s+/g, '');

    if (!name) { setError('Please enter your full name.'); return; }
    if (!uname || uname.length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!/^[a-z0-9_]+$/.test(uname)) { setError('Username can only contain letters, numbers, and underscores.'); return; }
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
          avatar_url: String(avatarIndex),
        }, { onConflict: 'id' });

      if (upsertError) {
        setError(upsertError.message);
        setLoading(false);
        return;
      }

      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const renderAvatar = useCallback(({ item }: { item: number }) => {
    const selected = item === avatarIndex;
    return (
      <TouchableOpacity
        style={[styles.avatarCell, selected && styles.avatarCellSelected]}
        onPress={() => setAvatarIndex(item)}
        activeOpacity={0.75}
      >
        <AvatarSVG index={item} size={52} />
        {selected && (
          <View style={styles.avatarCheck}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          </View>
        )}
        <Text style={[styles.avatarLabel, selected && styles.avatarLabelSelected]} numberOfLines={1}>
          {AVATAR_NAMES[item] ?? `#${item}`}
        </Text>
      </TouchableOpacity>
    );
  }, [avatarIndex, colors, styles]);

  const isReady = fullName.trim().length > 0 && username.trim().length >= 3;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient colors={gradientColors} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <AvatarSVG index={avatarIndex} size={52} />
            </View>
            <Text style={styles.title}>Set Up Your Profile</Text>
            <Text style={styles.subtitle}>Almost there! Tell us who you are.</Text>
          </View>

          <View style={styles.section}>
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
          </View>

          <Text style={styles.sectionTitle}>Choose Your Avatar</Text>
          <Text style={styles.sectionSub}>Stored on your profile — shows everywhere in the app</Text>

          <FlatList
            data={AVATARS}
            keyExtractor={String}
            renderItem={renderAvatar}
            numColumns={AVATAR_COLS}
            scrollEnabled={false}
            contentContainerStyle={styles.avatarGrid}
          />

          {!!error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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

function createStyles(colors: AppColors) {
  const CELL_GAP = 10;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    headerRow: { alignItems: 'center', marginBottom: 28 },
    iconWrap: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: colors.background.elevated,
      borderWidth: 2, borderColor: colors.primary + '50',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, textAlign: 'center', marginBottom: 6,
    },
    subtitle: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, textAlign: 'center', lineHeight: 20,
    },
    section: { marginBottom: 24 },
    fieldWrap: { marginBottom: 14 },
    sectionTitle: {
      fontSize: 15, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, marginBottom: 4,
    },
    sectionSub: {
      fontSize: 12, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, marginBottom: 14, lineHeight: 18,
    },
    avatarGrid: {
      gap: CELL_GAP,
      marginBottom: 24,
    },
    avatarCell: {
      flex: 1,
      margin: CELL_GAP / 2,
      backgroundColor: colors.background.elevated,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border.default,
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      position: 'relative',
    },
    avatarCellSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '18',
    },
    avatarCheck: {
      position: 'absolute',
      top: 6,
      right: 6,
    },
    avatarLabel: {
      marginTop: 6,
      fontSize: 10,
      fontFamily: 'Inter_500Medium',
      color: colors.text.muted,
      textAlign: 'center',
    },
    avatarLabelSelected: {
      color: colors.primary,
      fontFamily: 'Inter_700Bold',
    },
    errorWrap: {
      flexDirection: 'row', alignItems: 'flex-start',
      gap: 6, marginBottom: 14, paddingHorizontal: 4,
    },
    errorText: {
      color: colors.status.error, fontSize: 13,
      fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18,
    },
    btn: {
      backgroundColor: colors.primary, borderRadius: 25, height: 52,
      alignItems: 'center', justifyContent: 'center',
    },
    btnDisabled: { opacity: 0.45 },
    btnInner: { flexDirection: 'row', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
  });
}
