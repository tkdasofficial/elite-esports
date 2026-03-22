import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/theme/colors';

export default function VerifyEmail() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="mail" size={36} color={Colors.white} />
        </View>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent you a verification link. Open it to activate your account, then come back to sign in.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.btnText}>Go to Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={() => router.replace('/(auth)/signup')}>
          <Text style={styles.ghostText}>Resend email</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg, paddingHorizontal: 24 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  iconBox: {
    width: 80, height: 80, backgroundColor: Colors.brandPrimary,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  btn: {
    width: '100%', height: 54, backgroundColor: Colors.brandPrimary,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { fontSize: 17, fontWeight: '600', color: Colors.white },
  ghostBtn: { paddingVertical: 12 },
  ghostText: { fontSize: 15, color: Colors.brandPrimary },
});
