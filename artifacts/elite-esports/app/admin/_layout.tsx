import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/AuthContext';
import { Colors } from '@/utils/colors';

export default function AdminLayout() {
  const { session, loading, isAdmin, adminLoading } = useAuth();

  if (loading || adminLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background.dark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/options" />;
  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
