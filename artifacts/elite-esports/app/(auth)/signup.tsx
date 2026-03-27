import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/services/supabase';
import { Colors } from '@/utils/colors';
import { AuthLogo } from '@/features/auth/components/AuthLogo';
import { AuthInput } from '@/features/auth/components/AuthInput';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !username || !email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, username } },
    });
    setLoading(false);
    if (error) Alert.alert('Signup Failed', error.message);
    else Alert.alert('Success', 'Account created! Check your email to verify.', [
      { text: 'OK', onPress: () => router.replace('/(auth)/login') },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <LinearGradient colors={['#1A0500', '#000000']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <AuthLogo tagline="Join the Arena" />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <AuthInput label="Full Name" value={name} onChangeText={setName} placeholder="John Doe" iconName="person-outline" />
            <AuthInput label="Username" value={username} onChangeText={setUsername} placeholder="johndoe" iconName="at-outline" />
            <AuthInput label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" iconName="mail-outline" keyboardType="email-address" autoComplete="email" />
            <AuthInput label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" iconName="lock-closed-outline" secureTextEntry />
            <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} style={styles.link}>
              <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 },
  card: { backgroundColor: Colors.background.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border.default },
  cardTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 20 },
  btn: { backgroundColor: Colors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { color: Colors.text.secondary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  linkBold: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
});
