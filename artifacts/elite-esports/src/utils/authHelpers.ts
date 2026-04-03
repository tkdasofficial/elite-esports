import { router } from 'expo-router';

export async function navigateAfterAuth(_userId: string): Promise<void> {
  router.replace('/(tabs)');
}
