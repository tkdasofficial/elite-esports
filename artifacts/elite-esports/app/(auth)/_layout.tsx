import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="email-verify" />
      <Stack.Screen name="kyc" />
    </Stack>
  );
}
