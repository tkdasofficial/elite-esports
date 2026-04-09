import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/store/AuthContext';
import { ProfileProvider } from '@/store/ProfileContext';
import { ThemeProvider, useTheme } from '@/store/ThemeContext';
import { NotificationsProvider } from '@/store/NotificationsContext';
import { WalletProvider } from '@/store/WalletContext';
import { AdProvider } from '@/store/AdContext';
import { NCMProvider } from '@/store/NCMContext';
import { requestAppPermissions } from '@/services/PermissionService';
import { loadHapticPreference } from '@/utils/haptics';
import { deepLinkService } from '@/services/DeepLinkService';
import { deviceFingerprint } from '@/services/DeviceFingerprint';
import {
  initFCM,
  subscribeNotificationResponses,
  handleColdStartNotification,
} from '@/services/FCMService';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="tournament/[id]" />
      <Stack.Screen name="match/[id]" />
      <Stack.Screen name="add-money" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="transaction-history" />
      <Stack.Screen name="support" />
      <Stack.Screen name="my-matches" />
      <Stack.Screen name="my-team" />
      <Stack.Screen name="notification/[id]" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="about" />
      <Stack.Screen name="referral" />
      <Stack.Screen name="sponsored" />
      <Stack.Screen name="account-info" />
      <Stack.Screen name="disclaimer" />
    </Stack>
  );
}

function ThemedRoot() {
  const { isDark } = useTheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  // Track whether the navigator is ready so cold-start routing works
  const navigatorReadyRef = useRef(false);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // ── 1. Android notification channels + notification handler ─────────────
    initFCM().catch(() => {});

    // ── 2. Other app-level permissions & services ───────────────────────────
    requestAppPermissions().catch(() => {});
    loadHapticPreference().catch(() => {});
    deepLinkService.init();
    deviceFingerprint.init().catch(() => {});

    // ── 3. Subscribe to notification taps (foreground & background states) ──
    const unsubResponses = subscribeNotificationResponses();

    // ── 4. Handle cold-start tap (app was killed, user tapped notification) ─
    // Slight delay ensures the Expo Router navigator is fully mounted.
    const coldStartTimer = setTimeout(() => {
      navigatorReadyRef.current = true;
      handleColdStartNotification().catch(() => {});
    }, 500);

    return () => {
      unsubResponses();
      deepLinkService.destroy();
      clearTimeout(coldStartTimer);
    };
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootLayoutNav />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ProfileProvider>
                <NotificationsProvider>
                  <WalletProvider>
                    <NCMProvider>
                      <AdProvider>
                        <ThemedRoot />
                      </AdProvider>
                    </NCMProvider>
                  </WalletProvider>
                </NotificationsProvider>
              </ProfileProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
