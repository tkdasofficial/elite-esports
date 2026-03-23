import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/authStore';
import { useUserStore } from '@/src/store/userStore';
import { Colors } from '@/src/theme/colors';
import { ActivityIndicator } from 'react-native';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const color = focused ? Colors.brandPrimary : Colors.textMuted;
  return <Ionicons name={name as any} size={24} color={color} />;
}

function LiveTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[liveStyles.wrapper, focused && liveStyles.wrapperActive]}>
      <Ionicons name="radio" size={22} color={Colors.white} />
    </View>
  );
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
          height: 60 + insets.bottom,
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
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ focused }) => <LiveTabIcon focused={focused} />,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2, color: Colors.brandPrimary },
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

const liveStyles = StyleSheet.create({
  wrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    shadowColor: Colors.brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  wrapperActive: {
    backgroundColor: Colors.brandPrimary,
  },
});

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
