import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { useUserStore } from '@/src/store/userStore';
import { Colors } from '@/src/theme/colors';

export default function ProfileSetup() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { setProfileSetupComplete, login } = useUserStore();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    const u = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (u.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!session?.user) return;
    setLoading(true);

    const { data: existing } = await supabase.from('profiles').select('id').eq('username', u).single();
    if (existing) { setLoading(false); setError('Username is taken'); return; }

    const { error: err } = await supabase.from('profiles').upsert({
      id: session.user.id,
      username: u,
      email: session.user.email ?? '',
      coins: 0,
      rank: 'Bronze',
    });

    if (err) { setLoading(false); setError(err.message); return; }

    login({
      id: session.user.id,
      username: u,
      email: session.user.email ?? '',
      avatar: '',
      coins: 0,
      rank: 'Bronze',
    });
    setProfileSetupComplete(true);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Set Up Profile</Text>
          <Text style={styles.subtitle}>Choose a username to get started</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.at}>@</Text>
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
          <Text style={styles.hint}>Only lowercase letters, numbers, and underscores. Min 3 chars.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={[styles.btn, loading && styles.disabled]} onPress={handleSetup} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.btnText}>Continue</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scroll: { flexGrow: 1, paddingHorizontal: 24 },
  brand: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  logo: { width: 80, height: 80, borderRadius: 20, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.appSurface, borderRadius: 14, paddingHorizontal: 16, height: 54,
  },
  at: { fontSize: 18, color: Colors.brandPrimary, fontWeight: '600', marginRight: 4 },
  input: { flex: 1, fontSize: 18, color: Colors.textPrimary },
  hint: { fontSize: 13, color: Colors.textMuted },
  error: { fontSize: 13, color: Colors.brandLive },
  btn: {
    height: 54, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: Colors.brandPrimary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  disabled: { opacity: 0.4 },
  btnText: { fontSize: 17, fontWeight: '600', color: Colors.white },
});
