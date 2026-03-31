import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/store/AuthContext';
import { ProfileProvider } from '@/store/ProfileContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { NotificationsProvider } from '@/store/NotificationsContext';
import { WalletProvider } from '@/store/WalletContext';
import { initNotifications } from '@/services/NotificationService';

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
      <Stack.Screen name="terms" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="about" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (!ready) return;

    const hideSplash = async () => {
      await SplashScreen.hideAsync();
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    };

    const timer = setTimeout(hideSplash, 300);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    initNotifications().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider style={styles.root}>
      <StatusBar style="light" />
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ProfileProvider>
                <NotificationsProvider>
                  <WalletProvider>
                    <GestureHandlerRootView style={styles.root}>
                      <KeyboardProvider>
                        {ready && <RootLayoutNav />}
                        <Animated.View
                          pointerEvents="none"
                          style={[styles.overlay, { opacity: overlayOpacity }]}
                        >
                          <Ionicons name="flash" size={96} color="#FE4C11" />
                        </Animated.View>
                      </KeyboardProvider>
                    </GestureHandlerRootView>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
