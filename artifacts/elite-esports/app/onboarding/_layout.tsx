import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#000000' },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Play" />
      <Stack.Screen name="Win" />
      <Stack.Screen name="Withdraw" />
    </Stack>
  );
}
