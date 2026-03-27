import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, username } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      Alert.alert('Success', 'Account created! Please check your email to verify.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <LinearGradient colors={['#1A0500', '#000000']} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="flash" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>Elite eSports</Text>
            <Text style={styles.tagline}>Join the Arena</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create Account</Text>

            {[
              { label: 'Full Name', value: name, setter: setName, icon: 'person-outline', placeholder: 'John Doe', keyboard: 'default' as const },
              { label: 'Username', value: username, setter: setUsername, icon: 'at-outline', placeholder: 'johndoe', keyboard: 'default' as const },
              { label: 'Email', value: email, setter: setEmail, icon: 'mail-outline', placeholder: 'your@email.com', keyboard: 'email-address' as const },
            ].map(({ label, value, setter, icon, placeholder, keyboard }) => (
              <View style={styles.inputGroup} key={label}>
                <Text style={styles.label}>{label}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name={icon as any} size={18} color={Colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.text.muted}
                    value={value}
                    onChangeText={setter}
                    keyboardType={keyboard}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={Colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.text.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signupBtn, loading && styles.disabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.signupBtnText}>Create Account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
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
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: '#1A0500', borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  appName: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  tagline: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 4 },
  formCard: {
    backgroundColor: Colors.background.card, borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: Colors.border.default,
  },
  formTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default,
    paddingHorizontal: 14, height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  eyeBtn: { padding: 4 },
  signupBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  disabled: { opacity: 0.6 },
  signupBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  loginLink: { alignItems: 'center', marginTop: 16 },
  loginLinkText: { color: Colors.text.secondary, fontSize: 14, fontFamily: 'Inter_400Regular' },
  loginLinkBold: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
});
