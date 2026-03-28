import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/AuthContext';
import { Colors } from '@/utils/colors';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { session, loading, isAdmin, adminLoading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_seen').then(val => {
      setOnboardingSeen(val === 'true');
    });
  }, []);

  if (loading || adminLoading || onboardingSeen === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background.dark }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!onboardingSeen) return <Redirect href="/onboarding" />;

  if (!session) return <Redirect href="/(auth)/options" />;

  if (isAdmin) return <Redirect href="/admin" />;

  return <Redirect href="/(tabs)" />;
}
