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

export default function Login() {
  const insets = useSafeAreaInsets();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (err) {
      if (err.message.includes('Email not confirmed')) setError('Verify your email first — check your inbox.');
      else if (err.message.includes('Invalid login credentials')) setError('Incorrect email or password.');
      else setError(err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Back button */}
        {showEmail && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { setShowEmail(false); setError(''); setEmail(''); setPassword(''); }}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Brand */}
        <View style={styles.brand}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>{showEmail ? 'Sign In' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>
            {showEmail ? 'Enter your email and password' : 'Sign in to Elite eSports'}
          </Text>
        </View>

        {/* Auth area */}
        {!showEmail ? (
          <View style={styles.methods}>
            <TouchableOpacity style={styles.socialBtnGoogle} onPress={() => setError('OAuth not supported in native app — use email')}>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtnApple} onPress={() => setError('OAuth not supported in native app — use email')}>
              <Text style={styles.appleText}>Continue with Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.emailBtn} onPress={() => setShowEmail(true)}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.emailIcon} />
              <Text style={styles.emailBtnText}>Continue with Email</Text>
            </TouchableOpacity>
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or</Text>
              <View style={styles.divLine} />
            </View>
            <TouchableOpacity style={styles.signupBtn} onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupBtnText}>
                New here? <Text style={styles.signupBtnBold}>Create Account</Text>
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
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
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPw}
                  autoComplete="password"
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
              onPress={handleEmailSubmit}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.ctaBtnText}>Sign In</Text>}
            </TouchableOpacity>

            <Text style={styles.switchText}>
              No account?{' '}
              <Text style={styles.linkText} onPress={() => router.push('/(auth)/signup')}>Sign Up</Text>
            </Text>
          </View>
        )}
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
  logo: {
    width: 72, height: 72,
    borderRadius: 18,
    marginBottom: 20,
  },
  title: { fontSize: 30, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.8, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  methods: { gap: 12 },
  socialBtnGoogle: {
    height: 54, backgroundColor: '#FFFFFF',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  socialBtnApple: {
    height: 54, backgroundColor: '#1C1C1E',
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  appleText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  emailBtn: {
    height: 54, backgroundColor: Colors.appElevated,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder,
    flexDirection: 'row',
  },
  emailIcon: { position: 'absolute', left: 18 },
  emailBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.appBorder },
  divText: { fontSize: 12, color: Colors.textMuted },
  signupBtn: {
    height: 54, backgroundColor: Colors.appElevated,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  signupBtnText: { fontSize: 16, color: Colors.textSecondary },
  signupBtnBold: { color: Colors.brandPrimary, fontWeight: '600' },
  form: { gap: 12 },
  inputCard: {
    backgroundColor: Colors.appSurface,
    borderRadius: 14, overflow: 'hidden',
  },
  input: {
    height: 52, paddingHorizontal: 16,
    fontSize: 17, color: Colors.textPrimary,
  },
  inputDivider: { height: 1, backgroundColor: 'rgba(84,84,88,0.36)', marginHorizontal: 0 },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 14 },
  error: { fontSize: 13, color: Colors.brandLive, paddingHorizontal: 4 },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 14, color: Colors.brandPrimary, fontWeight: '500' },
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
