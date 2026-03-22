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

const GoogleIcon = () => (
  <View style={iconStyles.google}>
    <Text style={iconStyles.googleG}>G</Text>
  </View>
);

const FacebookIcon = () => (
  <View style={iconStyles.facebook}>
    <Text style={iconStyles.facebookF}>f</Text>
  </View>
);

export default function SignUp() {
  const insets = useSafeAreaInsets();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  const [error, setError] = useState('');

  const handleSignUp = async () => {
    setError('');
    if (!email.trim()) { setError('Email is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (err) {
      if (err.message.includes('already registered') || err.message.includes('already exists')) {
        setError('An account with this email already exists.');
      } else {
        setError(err.message);
      }
    } else {
      router.replace('/(auth)/verify-email');
    }
  };

  const handleSocial = (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    setTimeout(() => {
      setSocialLoading(null);
      setError('Social sign-in is not available in the preview. Please use email.');
    }, 500);
  };

  const busy = loading || !!socialLoading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => showEmail
            ? (setShowEmail(false), setError(''), setEmail(''), setPassword(''))
            : router.back()
          }
        >
          <Ionicons name="chevron-back" size={20} color={Colors.brandPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.brand}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>{showEmail ? 'Create Account' : 'Join Elite'}</Text>
          <Text style={styles.subtitle}>
            {showEmail ? 'Enter your email and a password' : "The world's premier gaming platform"}
          </Text>
        </View>

        {!showEmail ? (
          <View style={styles.methods}>
            <TouchableOpacity
              style={styles.socialBtnGoogle}
              onPress={() => handleSocial('google')}
              disabled={busy}
            >
              <View style={styles.socialIconCircle}>
                {socialLoading === 'google'
                  ? <ActivityIndicator color="#333" size="small" />
                  : <GoogleIcon />}
              </View>
              <Text style={styles.googleText}>Continue with Google</Text>
              <View style={{ width: 32 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialBtnFacebook}
              onPress={() => handleSocial('facebook')}
              disabled={busy}
            >
              <View style={styles.socialIconCircleFb}>
                {socialLoading === 'facebook'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <FacebookIcon />}
              </View>
              <Text style={styles.facebookText}>Continue with Facebook</Text>
              <View style={{ width: 32 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.emailBtn} onPress={() => setShowEmail(true)} disabled={busy}>
              <View style={styles.emailIconCircle}>
                <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
              </View>
              <Text style={styles.emailBtnText}>Continue with Email</Text>
              <View style={{ width: 32 }} />
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or</Text>
              <View style={styles.divLine} />
            </View>

            <TouchableOpacity style={styles.altBtn} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.altBtnText}>
                Have an account? <Text style={styles.altBtnBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}
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
                autoFocus
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
                  autoComplete="new-password"
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.hint}>Minimum 6 characters. Profile set up after sign in.</Text>

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
              <Text style={styles.linkText} onPress={() => router.replace('/(auth)/login')}>Sign In</Text>
            </Text>
          </View>
        )}
      </ScrollView>

      <Text style={[styles.legal, { paddingBottom: insets.bottom + 12 }]}>
        By continuing you agree to our{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/terms')}>Terms</Text>
        {' '}and{' '}
        <Text style={styles.legalLink} onPress={() => router.push('/privacy')}>Privacy Policy</Text>.
      </Text>
    </KeyboardAvoidingView>
  );
}

const iconStyles = StyleSheet.create({
  google: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ddd',
  },
  googleG: { fontSize: 12, fontWeight: '700', color: '#4285F4' },
  facebook: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  facebookF: { fontSize: 13, fontWeight: '900', color: '#1877F2' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', height: 40, marginTop: 4 },
  backText: { color: Colors.brandPrimary, fontSize: 15 },
  brand: { alignItems: 'center', paddingTop: 24, paddingBottom: 32 },
  logo: { width: 60, height: 60, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.6, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  methods: { gap: 10 },
  socialIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ddd',
  },
  socialIconCircleFb: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1464D0', alignItems: 'center', justifyContent: 'center',
  },
  emailIconCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.appFill, alignItems: 'center', justifyContent: 'center',
  },
  socialBtnGoogle: {
    height: 44, backgroundColor: '#FFFFFF', borderRadius: 999,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    paddingHorizontal: 12, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
  },
  googleText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  socialBtnFacebook: {
    height: 44, backgroundColor: '#1877F2', borderRadius: 999,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    paddingHorizontal: 12, gap: 10,
  },
  facebookText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#fff' },
  emailBtn: {
    height: 44, backgroundColor: Colors.appElevated, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder, flexDirection: 'row',
    paddingHorizontal: 12, gap: 10,
  },
  emailBtnText: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.appBorder },
  divText: { fontSize: 11, color: Colors.textMuted },
  altBtn: {
    height: 44, backgroundColor: Colors.appElevated, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  altBtnText: { fontSize: 14, color: Colors.textSecondary },
  altBtnBold: { color: Colors.brandPrimary, fontWeight: '600' },
  form: { gap: 10 },
  inputCard: { backgroundColor: Colors.appSurface, borderRadius: 14, overflow: 'hidden' },
  input: { height: 48, paddingHorizontal: 16, fontSize: 15, color: Colors.textPrimary },
  inputDivider: { height: 1, backgroundColor: 'rgba(84,84,88,0.36)' },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 14 },
  hint: { fontSize: 11, color: Colors.textMuted, paddingHorizontal: 4 },
  error: { fontSize: 12, color: Colors.brandLive, paddingHorizontal: 4 },
  ctaBtn: {
    height: 44, backgroundColor: Colors.brandPrimary, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brandPrimary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  switchText: { textAlign: 'center', fontSize: 13, color: Colors.textMuted, paddingTop: 2 },
  linkText: { color: Colors.brandPrimary, fontWeight: '500' },
  legal: {
    textAlign: 'center', fontSize: 11, color: Colors.textFaint,
    paddingHorizontal: 24, lineHeight: 17,
  },
  legalLink: { color: Colors.textMuted },
});
