import { Stack, Redirect } from 'expo-router';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/store/authStore';

export default function AdminLayout() {
  const { session } = useAuthStore();
  const { isAdmin } = useUserStore();

  if (!session) return <Redirect href="/(auth)/login" />;
  if (!isAdmin) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
