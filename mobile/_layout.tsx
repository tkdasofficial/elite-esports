import { useEffect, Component, ReactNode } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/store/authStore';
import { useUserStore } from '@/src/store/userStore';
import { useMatchStore } from '@/src/store/matchStore';
import { useGameStore } from '@/src/store/gameStore';
import { useBannerStore } from '@/src/store/bannerStore';
import { useCampaignStore } from '@/src/store/campaignStore';
import { useCategoryStore } from '@/src/store/categoryStore';
import { usePlatformStore } from '@/src/store/platformStore';
import { Colors } from '@/src/theme/colors';

interface ErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootLayoutInner() {
  const { setSession, setInitialized } = useAuthStore();
  const { fetchUserData, login, logout } = useUserStore();
  const { fetchMatches } = useMatchStore();
  const fetchGames = useGameStore(s => s.fetchGames);
  const fetchBanners = useBannerStore(s => s.fetchBanners);
  const fetchCampaigns = useCampaignStore(s => s.fetchCampaigns);
  const fetchCategories = useCategoryStore(s => s.fetchCategories);
  const fetchSettings = usePlatformStore(s => s.fetchSettings);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.allSettled([
          fetchMatches(),
          fetchGames(),
          fetchBanners(),
          fetchCampaigns(),
          fetchCategories(),
          fetchSettings(),
        ]);
      } catch (e) {
        console.warn('[RootLayout] Public data fetch failed:', e);
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setInitialized(true);
        if (session?.user) {
          await loadUserData(session.user.id, session.user.email ?? '');
        }
      } catch (e) {
        console.error('[RootLayout] Auth init failed:', e);
        setInitialized(true);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setInitialized(true);
      if (session?.user) {
        try {
          await loadUserData(session.user.id, session.user.email ?? '');
        } catch (e) {
          console.warn('[RootLayout] loadUserData failed on auth change:', e);
        }
      } else {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string, email: string) => {
    try {
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
    } catch (e) {
      console.warn('[RootLayout] loadUserData error:', e);
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
          <Stack.Screen name="public-profile/[id]" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <RootLayoutInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: Colors.brandPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  message: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
