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
        {/* Back button */}
        {showEmail ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { setShowEmail(false); setError(''); setEmail(''); setPassword(''); }}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Brand */}
        <View style={styles.brand}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>{showEmail ? 'Create Account' : 'Join Elite'}</Text>
          <Text style={styles.subtitle}>
            {showEmail ? 'Enter your email and a password' : "The world's premier gaming platform"}
          </Text>
        </View>

        {/* Auth area */}
        {!showEmail ? (
          <View style={styles.methods}>
            {/* Google */}
            <TouchableOpacity
              style={styles.socialBtnGoogle}
              onPress={() => handleSocial('google')}
              disabled={busy}
            >
              {socialLoading === 'google'
                ? <ActivityIndicator color="#333" size="small" style={styles.socialIcon} />
                : <View style={styles.socialIcon}><GoogleIcon /></View>
              }
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Facebook */}
            <TouchableOpacity
              style={styles.socialBtnFacebook}
              onPress={() => handleSocial('facebook')}
              disabled={busy}
            >
              {socialLoading === 'facebook'
                ? <ActivityIndicator color="#fff" size="small" style={styles.socialIcon} />
                : <View style={styles.socialIcon}><FacebookIcon /></View>
              }
              <Text style={styles.facebookText}>Continue with Facebook</Text>
            </TouchableOpacity>

            {/* Email */}
            <TouchableOpacity style={styles.emailBtn} onPress={() => setShowEmail(true)} disabled={busy}>
              <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.emailIcon} />
              <Text style={styles.emailBtnText}>Continue with Email</Text>
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
                  <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.hint}>Minimum 6 characters. Your profile is set up after sign in.</Text>

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

      <Text style={[styles.legal, { paddingBottom: insets.bottom + 16 }]}>
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
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#ddd',
  },
  googleG: { fontSize: 13, fontWeight: '700', color: '#4285F4' },
  facebook: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  facebookF: { fontSize: 14, fontWeight: '900', color: '#1877F2' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', height: 44, marginTop: 4 },
  backText: { color: Colors.brandPrimary, fontSize: 17 },
  brand: { alignItems: 'center', paddingTop: 32, paddingBottom: 40 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.8, marginBottom: 4 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center' },
  methods: { gap: 12 },
  socialIcon: { position: 'absolute', left: 18 },
  socialBtnGoogle: {
    height: 54, backgroundColor: '#FFFFFF', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  googleText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  socialBtnFacebook: {
    height: 54, backgroundColor: '#1877F2', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  facebookText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emailBtn: {
    height: 54, backgroundColor: Colors.appElevated, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder, flexDirection: 'row',
  },
  emailIcon: { position: 'absolute', left: 18 },
  emailBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.appBorder },
  divText: { fontSize: 12, color: Colors.textMuted },
  altBtn: {
    height: 54, backgroundColor: Colors.appElevated, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  altBtnText: { fontSize: 16, color: Colors.textSecondary },
  altBtnBold: { color: Colors.brandPrimary, fontWeight: '600' },
  form: { gap: 12 },
  inputCard: { backgroundColor: Colors.appSurface, borderRadius: 14, overflow: 'hidden' },
  input: { height: 52, paddingHorizontal: 16, fontSize: 17, color: Colors.textPrimary },
  inputDivider: { height: 1, backgroundColor: 'rgba(84,84,88,0.36)' },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 14 },
  hint: { fontSize: 12, color: Colors.textMuted, paddingHorizontal: 4 },
  error: { fontSize: 13, color: Colors.brandLive, paddingHorizontal: 4 },
  ctaBtn: {
    height: 54, backgroundColor: Colors.brandPrimary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brandPrimary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  ctaBtnDisabled: { opacity: 0.4 },
  ctaBtnText: { fontSize: 17, fontWeight: '600', color: Colors.white },
  switchText: { textAlign: 'center', fontSize: 14, color: Colors.textMuted, paddingTop: 4 },
  linkText: { color: Colors.brandPrimary, fontWeight: '500' },
  legal: {
    textAlign: 'center', fontSize: 12, color: Colors.textFaint,
    paddingHorizontal: 24, lineHeight: 18,
  },
  legalLink: { color: Colors.textMuted },
});
