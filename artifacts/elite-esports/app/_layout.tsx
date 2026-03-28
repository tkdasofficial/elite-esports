import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/store/AuthContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { NotificationsProvider } from '@/store/NotificationsContext';
import { WalletProvider } from '@/store/WalletContext';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
});

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#0A0A0A' },
  headerTintColor: '#FFFFFF',
  headerBackTitle: 'Back',
};

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="notifications" options={{ headerShown: true, headerTitle: 'Notifications', ...HEADER_OPTS }} />
      <Stack.Screen name="settings" options={{ headerShown: true, headerTitle: 'Settings', ...HEADER_OPTS }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: true, headerTitle: 'Edit Profile', ...HEADER_OPTS }} />
      <Stack.Screen name="tournament/[id]" options={{ headerShown: true, headerTitle: 'Tournament', ...HEADER_OPTS }} />
      <Stack.Screen name="match/[id]" options={{ headerShown: true, headerTitle: 'Match Details', ...HEADER_OPTS }} />
      <Stack.Screen name="add-money" options={{ headerShown: true, headerTitle: 'Add Money', ...HEADER_OPTS }} />
      <Stack.Screen name="withdraw" options={{ headerShown: true, headerTitle: 'Withdraw', ...HEADER_OPTS }} />
      <Stack.Screen name="transaction-history" options={{ headerShown: true, headerTitle: 'Transaction History', ...HEADER_OPTS }} />
      <Stack.Screen name="support" options={{ headerShown: true, headerTitle: 'Support', ...HEADER_OPTS }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <NotificationsProvider>
                <WalletProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </WalletProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
