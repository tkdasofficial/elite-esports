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
    if (!email.trim() || !password || !confirm) { setError('Please fill in all fields'); return; }
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
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        {/* Brand */}
        <View style={styles.brand}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the Elite eSports community</Text>
        </View>

        {/* Form */}
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
              autoComplete="email"
            />
            <View style={styles.inputDivider} />
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="Password (min 8 chars)"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry={!showPw}
                autoComplete="new-password"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputDivider} />
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry={!showPw}
              autoComplete="new-password"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} size="small" />
              : <Text style={styles.ctaBtnText}>Create Account</Text>}
          </TouchableOpacity>

          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={styles.linkText} onPress={() => router.back()}>Sign In</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Legal */}
      <Text style={[styles.legal, { paddingBottom: insets.bottom + 16 }]}>
        By continuing you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms</Text>
        {' '}and{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', height: 44, marginTop: 4 },
  backText: { color: Colors.brandPrimary, fontSize: 17 },
  brand: { alignItems: 'center', paddingTop: 32, paddingBottom: 40 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.8, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  form: { gap: 12 },
  inputCard: { backgroundColor: Colors.appSurface, borderRadius: 14, overflow: 'hidden' },
  input: { height: 52, paddingHorizontal: 16, fontSize: 17, color: Colors.textPrimary },
  inputDivider: { height: 1, backgroundColor: 'rgba(84,84,88,0.36)' },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 14 },
  error: { fontSize: 13, color: Colors.brandLive, paddingHorizontal: 4 },
  ctaBtn: {
    height: 54, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaBtnText: { fontSize: 17, fontWeight: '600', color: Colors.white },
  switchText: { textAlign: 'center', fontSize: 14, color: Colors.textMuted, paddingTop: 4 },
  linkText: { color: Colors.brandPrimary, fontWeight: '500' },
  legal: { textAlign: 'center', fontSize: 12, color: Colors.textFaint, paddingHorizontal: 24, lineHeight: 18 },
  legalLink: { color: Colors.textMuted },
});
