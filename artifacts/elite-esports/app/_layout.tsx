import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/store/AuthContext';
import { ProfileProvider } from '@/store/ProfileContext';
import { ThemeProvider, useTheme } from '@/store/ThemeContext';
import { NotificationsProvider } from '@/store/NotificationsContext';
import { WalletProvider } from '@/store/WalletContext';
import { AdProvider } from '@/store/AdContext';
import { setupAndroidChannels } from '@/services/NotificationService';
import { requestAppPermissions } from '@/services/PermissionService';
import { loadHapticPreference } from '@/utils/haptics';

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
    </Stack>
  );
}

function ThemedRoot() {
  const { isDark } = useTheme();

  // Load fonts in the background — never block rendering
  useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    setupAndroidChannels().catch(() => {});
    requestAppPermissions().catch(() => {});
    loadHapticPreference().catch(() => {});
  }, []);

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
                    <AdProvider>
                      <ThemedRoot />
                    </AdProvider>
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
