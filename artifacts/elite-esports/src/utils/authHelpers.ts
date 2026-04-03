import { router } from 'expo-router';
import { supabase } from '@/services/supabase';

export async function navigateAfterAuth(userId: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    if (data?.username) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/profile-setup');
    }
  } catch {
    router.replace('/(tabs)');
  }
}
