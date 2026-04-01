import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

export async function isProfileComplete(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('name, username')
    .eq('id', userId)
    .maybeSingle();
  return !!(data?.name && data?.username);
}

export async function navigateAfterAuth(userId: string): Promise<void> {
  const complete = await isProfileComplete(userId);
  if (complete) {
    router.replace('/(tabs)');
  } else {
    router.replace('/(auth)/profile-setup');
  }
}
