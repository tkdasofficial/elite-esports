import { Redirect } from 'expo-router';
import { useAuth } from '@/store/AuthContext';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { session, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_seen').then(val => {
      setOnboardingSeen(val === 'true');
    });
  }, []);

  // Still resolving auth or onboarding status — render nothing (transparent)
  if (loading || onboardingSeen === null) return null;

  if (!onboardingSeen) return <Redirect href="/onboarding/Play" />;

  if (!session) return <Redirect href="/(auth)/options" />;

  return <Redirect href="/(tabs)" />;
}
