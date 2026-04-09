import { Tabs, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTheme } from '@/store/ThemeContext';
import { triggerHaptic } from '@/utils/haptics';
import { useProfileCtx } from '@/store/ProfileContext';
import { useAuth } from '@/store/AuthContext';

const TAB_HEIGHT = 62;

type TabName = 'index' | 'live' | 'leaderboard' | 'wallet' | 'profile';

const TABS: { name: TabName; icon: string }[] = [
  { name: 'index',       icon: 'home' },
  { name: 'live',        icon: 'play-circle' },
  { name: 'leaderboard', icon: 'award' },
  { name: 'wallet',      icon: 'credit-card' },
  { name: 'profile',     icon: 'user' },
];

function TabIcon({ routeName, isFocused }: { routeName: TabName; isFocused: boolean }) {
  const { colors } = useTheme();
  const tab = TABS.find(t => t.name === routeName);
  const scale = useRef(new Animated.Value(1)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.12 : 1,
        friction: 7,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bgOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const iconColor = isFocused ? colors.primary : colors.tab.inactive;

  return (
    <View style={styles.iconWrap}>
      {/* Active pill background — no absolute overlay, drawn cleanly under icon */}
      <Animated.View
        style={[
          styles.activePill,
          {
            opacity: bgOpacity,
            backgroundColor: colors.primary + '20',
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Feather name={(tab?.icon ?? 'home') as any} size={30} color={iconColor} />
      </Animated.View>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const bottomPad = insets.bottom;

  const BarContent = (
    <View style={styles.iconRow}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            triggerHaptic();
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
          >
            <TabIcon routeName={route.name as TabName} isFocused={isFocused} />
          </Pressable>
        );
      })}
    </View>
  );

  const tabBarBg = isDark ? '#0A0A0AEE' : '#FFFFFFEE';
  const borderColor = colors.border.subtle;

  return (
    <View
      style={[
        styles.tabBar,
        { paddingBottom: bottomPad, borderTopColor: borderColor },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tabBarBg }]} />
      {BarContent}
    </View>
  );
}

function ProfileGate() {
  const { user } = useAuth();
  const { profile, loading } = useProfileCtx();
  useEffect(() => {
    if (!user) return;
    if (loading) return;
    // Redirect to KYC if username missing OR kyc_completed flag not set
    const kycDone = user.user_metadata?.kyc_completed === true;
    if (!profile.username || !kycDone) {
      router.replace('/(auth)/kyc' as any);
    }
  }, [user, loading, profile.username]);
  return null;
}

export default function TabLayout() {
  return (
    <>
      <ProfileGate />
      <Tabs
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index"       options={{ title: 'Home' }} />
        <Tabs.Screen name="live"        options={{ title: 'Live' }} />
        <Tabs.Screen name="leaderboard" options={{ title: 'Ranks' }} />
        <Tabs.Screen name="wallet"      options={{ title: 'Wallet' }} />
        <Tabs.Screen name="profile"     options={{ title: 'Profile' }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconRow: {
    height: TAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    height: TAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 54,
    height: 54,
  },
  activePill: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
  },
});
