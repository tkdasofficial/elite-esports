import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/store/authStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const { user, login } = useUserStore();
  const { session } = useAuthStore();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!session?.user) return;
    const trimmed = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (trimmed.length < 3) { Alert.alert('Username must be at least 3 characters'); return; }

    setLoading(true);
    const { error } = await supabase.from('profiles').upsert({
      id: session.user.id,
      username: trimmed,
      bio: bio.trim(),
      phone: phone.trim(),
    });
    setLoading(false);

    if (error) { Alert.alert('Error', error.message); return; }

    if (user) {
      login({ ...user, username: trimmed, bio: bio.trim(), phone: phone.trim() });
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.brandPrimary} size="small" /> : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LetterAvatar name={username || user?.username || '?'} size="xl" />
          <Text style={styles.avatarHint}>Your avatar is generated from your username</Text>
        </View>

        {/* Fields */}
        <Text style={styles.sectionLabel}>ACCOUNT INFO</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={t => setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="your_username"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValueDisabled}>{user?.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, styles.mt]}>BIO</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about yourself..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveBtn: { fontSize: 17, color: Colors.brandPrimary, fontWeight: '500' },
  scroll: { paddingHorizontal: 16, paddingTop: 16 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  avatarHint: { fontSize: 13, color: Colors.textMuted },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 8, letterSpacing: 0.06 },
  mt: { marginTop: 24 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4, fontWeight: '500' },
  input: { fontSize: 16, color: Colors.textPrimary, paddingVertical: 4 },
  fieldValueDisabled: { fontSize: 16, color: Colors.textMuted, paddingVertical: 4 },
  divider: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 16 },
  bioInput: { paddingHorizontal: 16, paddingTop: 14, fontSize: 16, color: Colors.textPrimary, minHeight: 96, textAlignVertical: 'top' },
  charCount: { textAlign: 'right', fontSize: 12, color: Colors.textMuted, padding: 8 },
});
