import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerStyle: { backgroundColor: Colors.background.dark }, headerTintColor: Colors.text.primary }} />
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.text.muted} />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background.dark,
    gap: 12,
  },
  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  link: { marginTop: 8, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  linkText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
