import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useEffect } from 'react';
import { Platform, StyleSheet, View, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';

const TAB_HEIGHT = 62;

type TabName = 'index' | 'live' | 'leaderboard' | 'wallet' | 'profile';

const TABS: { name: TabName; icon: string; activeIcon: string }[] = [
  { name: 'index',       icon: 'home',       activeIcon: 'home' },
  { name: 'live',        icon: 'play-circle', activeIcon: 'play-circle' },
  { name: 'leaderboard', icon: 'award',       activeIcon: 'award' },
  { name: 'wallet',      icon: 'credit-card', activeIcon: 'credit-card' },
  { name: 'profile',     icon: 'user',        activeIcon: 'user' },
];

function TabIcon({
  routeName,
  isFocused,
}: {
  routeName: TabName;
  isFocused: boolean;
}) {
  const tab = TABS.find(t => t.name === routeName);
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isFocused ? 1.14 : 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: isFocused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isFocused]);

  const iconColor = isFocused ? Colors.tab.active : Colors.tab.inactive;

  return (
    <View style={styles.iconWrap}>
      {/* Glow behind icon */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            backgroundColor: Colors.primary + '22',
            shadowColor: Colors.primary,
          },
        ]}
      />
      <Animated.View style={{ transform: [{ scale }] }}>
        <Feather
          name={(tab?.icon ?? 'home') as any}
          size={23}
          color={iconColor}
        />
      </Animated.View>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? WEB_BOTTOM_INSET : insets.bottom;

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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
      )}
      <View style={styles.topBorder} />
      {BarContent}
    </View>
  );
}

export default function TabLayout() {
  return (
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
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  androidBg: {
    backgroundColor: '#0A0A0AEE',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border.subtle,
  },
  iconRow: {
    height: TAB_HEIGHT,
    marginTop: 1,
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
    width: 44,
    height: 44,
  },
  glow: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
});
