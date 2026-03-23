import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';
import { ChevronBackIcon, LockIcon, CheckmarkCircleIcon } from '@/src/icons/IconLibrary';

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email.trim()) { setError('Enter your email address'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronBackIcon size={22} color={Colors.brandPrimary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <LockIcon size={32} color={Colors.white} />
        </View>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send a reset link</Text>

        {sent ? (
          <View style={styles.successBox}>
            <CheckmarkCircleIcon size={48} color={Colors.brandSuccess} />
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successText}>Check your inbox for the password reset link.</Text>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg, paddingHorizontal: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', height: 44, marginTop: 4 },
  backText: { color: Colors.brandPrimary, fontSize: 17 },
  content: { flex: 1, alignItems: 'center', paddingTop: 40 },
  iconBox: {
    width: 72, height: 72, backgroundColor: Colors.brandPrimary,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  form: { width: '100%', gap: 12 },
  input: {
    height: 48, backgroundColor: Colors.appSurface,
    borderRadius: 14, paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } as any : {}),
  },
  error: { fontSize: 13, color: Colors.brandLive },
  btn: {
    height: 44, backgroundColor: Colors.brandPrimary,
    borderRadius: 999, alignItems: 'center', justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  successBox: { alignItems: 'center', paddingTop: 20, gap: 12 },
  successTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
});
