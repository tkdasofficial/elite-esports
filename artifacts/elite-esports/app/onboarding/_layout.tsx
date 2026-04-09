import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function OnboardingLayout() {
  const scheme = useColorScheme();
  const bg = scheme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: bg },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="Play" />
      <Stack.Screen name="Win" />
      <Stack.Screen name="Withdraw" />
    </Stack>
  );
}
