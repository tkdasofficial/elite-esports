import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setError('');
    if (!email.trim() || !password || !confirm) { setError('Fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (err) { setError(err.message); }
    else { router.replace('/(auth)/verify-email'); }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Elite eSports community</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.divider} />
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.flex1]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password (min 8 chars)"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPw}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPw}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.disabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.ctaText}>Create Account</Text>}
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={styles.link} onPress={() => router.back()}>Sign In</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', height: 44, marginTop: 4 },
  backText: { color: Colors.brandPrimary, fontSize: 17 },
  brand: { alignItems: 'center', paddingTop: 24, paddingBottom: 36 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.6, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  form: { gap: 12 },
  inputCard: { backgroundColor: Colors.appSurface, borderRadius: 14, overflow: 'hidden' },
  input: { height: 52, paddingHorizontal: 16, fontSize: 17, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: 'rgba(84,84,88,0.36)' },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
  eyeBtn: { padding: 14 },
  error: { fontSize: 13, color: Colors.brandLive, paddingHorizontal: 4 },
  ctaBtn: {
    height: 54, backgroundColor: Colors.brandPrimary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brandPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  disabled: { opacity: 0.4 },
  ctaText: { fontSize: 17, fontWeight: '600', color: Colors.white },
  switchText: { textAlign: 'center', fontSize: 14, color: Colors.textMuted },
  link: { color: Colors.brandPrimary, fontWeight: '500' },
});
