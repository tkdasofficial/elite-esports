import { Redirect } from 'expo-router';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';

export default function Index() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [profileChecked, setProfileChecked] = useState<'pending' | 'complete' | 'incomplete'>('pending');

  useEffect(() => {
    AsyncStorage.getItem('onboarding_seen').then(val => {
      setOnboardingSeen(val === 'true');
    });
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfileChecked('pending');
      return;
    }
    supabase
      .from('users')
      .select('name, username')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name && data?.username) {
          setProfileChecked('complete');
        } else {
          setProfileChecked('incomplete');
        }
      })
      .catch(() => setProfileChecked('complete'));
  }, [session?.user?.id]);

  if (loading || onboardingSeen === null) {
    return <View style={{ flex: 1, backgroundColor: colors.background.dark }} />;
  }

  if (!onboardingSeen) return <Redirect href="/onboarding/Play" />;

  if (!session) return <Redirect href="/(auth)/options" />;

  if (profileChecked === 'pending') {
    return <View style={{ flex: 1, backgroundColor: colors.background.dark }} />;
  }

  if (profileChecked === 'incomplete') return <Redirect href="/(auth)/profile-setup" />;

  return <Redirect href="/(tabs)" />;
}
