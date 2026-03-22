import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { useUserStore } from '@/src/store/userStore';
import { useMatchStore } from '@/src/store/matchStore';
import { useGameStore } from '@/src/store/gameStore';
import { useBannerStore } from '@/src/store/bannerStore';
import { useCampaignStore } from '@/src/store/campaignStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { usePlatformStore } from '@/src/store/platformStore';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  const { setSession, setInitialized } = useAuthStore();
  const { fetchUserData, login, logout } = useUserStore();
  const { fetchMatches } = useMatchStore();
  const fetchGames = useGameStore(s => s.fetchGames);
  const fetchBanners = useBannerStore(s => s.fetchBanners);
  const fetchCampaigns = useCampaignStore(s => s.fetchCampaigns);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);
  const fetchSettings = usePlatformStore(s => s.fetchSettings);

  useEffect(() => {
    fetchMatches();
    fetchGames();
    fetchBanners();
    fetchCampaigns();
    fetchCategories();
    fetchSettings();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email ?? '');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setInitialized(true);
      if (session?.user) {
        loadUserData(session.user.id, session.user.email ?? '');
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string, email: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      const isAdmin =
        email === process.env.EXPO_PUBLIC_ADMIN_EMAIL ||
        profile.role === 'admin' ||
        profile.is_admin === true;
      login({
        id: profile.id,
        username: profile.username ?? '',
        email: profile.email ?? email,
        avatar: profile.avatar ?? '',
        coins: profile.coins ?? 0,
        rank: profile.rank ?? 'Bronze',
        bio: profile.bio ?? '',
        phone: profile.phone ?? '',
      }, isAdmin);
      await fetchUserData(userId);
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#0a0a0f" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="profile-setup" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="my-matches" options={{ headerShown: false }} />
          <Stack.Screen name="my-team" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="add-game" options={{ headerShown: false }} />
          <Stack.Screen name="edit-game/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="tournaments" options={{ headerShown: false }} />
          <Stack.Screen name="transactions" options={{ headerShown: false }} />
          <Stack.Screen name="terms" options={{ headerShown: false }} />
          <Stack.Screen name="privacy" options={{ headerShown: false }} />
          <Stack.Screen name="help" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ headerShown: false }} />
          <Stack.Screen name="blocked-users" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
