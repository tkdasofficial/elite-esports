import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, Redirect } from 'expo-router';
import { Icon, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { useAuth } from '@/store/AuthContext';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index"><Icon sf={{ default: 'house', selected: 'house.fill' }} /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="live"><Icon sf={{ default: 'play.circle', selected: 'play.circle.fill' }} /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="leaderboard"><Icon sf={{ default: 'trophy', selected: 'trophy.fill' }} /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="wallet"><Icon sf={{ default: 'wallet.pass', selected: 'wallet.pass.fill' }} /></NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile"><Icon sf={{ default: 'person', selected: 'person.fill' }} /></NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === 'ios';
  const insets = useSafeAreaInsets();

  const TAB_BAR_HEIGHT = 58;
  const bottomPad = Platform.OS === 'web' ? WEB_BOTTOM_INSET : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.tab.inactive,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : '#0A0A0A',
          borderTopWidth: 1,
          borderTopColor: Colors.border.default,
          elevation: 0,
          height: TAB_BAR_HEIGHT + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 0,
        },
        tabBarItemStyle: {
          height: TAB_BAR_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarBackground: () =>
          isIOS
            ? <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A0A0A' }]} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="live"
        options={{
          title: 'Live',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="play.circle" tintColor={color} size={24} /> : <Ionicons name="play-circle-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="trophy" tintColor={color} size={24} /> : <Ionicons name="trophy-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="creditcard" tintColor={color} size={24} /> : <Ionicons name="wallet-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person" tintColor={color} size={24} /> : <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { isAdmin, adminLoading } = useAuth();
  if (!adminLoading && isAdmin) return <Redirect href="/admin" />;
  return isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
}
