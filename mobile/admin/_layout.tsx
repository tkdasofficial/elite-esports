import { Stack, Redirect } from 'expo-router';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/store/authStore';

export default function AdminLayout() {
  const { session } = useAuthStore();
  const { isAdmin } = useUserStore();

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="match-form" />
      <Stack.Screen name="participants" />
      <Stack.Screen name="users" />
      <Stack.Screen name="economy" />
      <Stack.Screen name="campaign" />
      <Stack.Screen name="tags" />
      <Stack.Screen name="games" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="support" />
      <Stack.Screen name="rules" />
      <Stack.Screen name="referrals" />
      <Stack.Screen name="categories" />
    </Stack>
  );
}
