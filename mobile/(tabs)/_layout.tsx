import { Tabs, Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useUserStore } from '@/src/store/userStore';
import { Colors } from '@/src/theme/colors';

function TabIcon({ name, focused, library = 'Ionicons' }: { name: string; focused: boolean; library?: string }) {
  const color = focused ? Colors.brandPrimary : Colors.textMuted;
  const size = 24;

  if (library === 'Feather') {
    return <Feather name={name as any} size={size} color={color} />;
  }
  return <Ionicons name={name as any} size={size} color={color} />;
}

export default function TabLayout() {
  const { session, initialized } = useAuthStore();
  const { isAdmin } = useUserStore();
  const insets = useSafeAreaInsets();

  if (!initialized) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={Colors.brandPrimary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/login" />;
  if (isAdmin) return <Redirect href="/admin" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.appCard,
          borderTopColor: Colors.appBorder,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarActiveTintColor: Colors.brandPrimary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'radio' : 'radio-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'wallet' : 'wallet-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'person' : 'person-outline'} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
