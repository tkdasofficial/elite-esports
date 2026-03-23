import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';
import { ChevronBackIcon, CheckmarkCircleIcon } from '@/src/icons/IconLibrary';

export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (password.length < 8) { setError('Minimum 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) setError(err.message);
    else setDone(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronBackIcon size={22} color={Colors.brandPrimary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>New Password</Text>
        <Text style={styles.subtitle}>Choose a strong password for your account</Text>
        {done ? (
          <View style={styles.successBox}>
            <CheckmarkCircleIcon size={52} color={Colors.brandSuccess} />
            <Text style={styles.successText}>Password updated!</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.btnText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="New Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleReset} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Update Password</Text>}
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
  content: { flex: 1, paddingTop: 32, gap: 8 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 16 },
  form: { gap: 12 },
  input: {
    height: 48, backgroundColor: Colors.appSurface, borderRadius: 14,
    paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } as any : {}),
  },
  error: { fontSize: 13, color: Colors.brandLive },
  btn: { height: 44, backgroundColor: Colors.brandPrimary, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  btnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  successBox: { alignItems: 'center', gap: 16, paddingTop: 40 },
  successText: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
});
