import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, Redirect } from 'expo-router';
import { Icon, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { Feather, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { useAuth } from '@/store/AuthContext';

const TAB_HEIGHT = 58;

/* ── Tab icon map ── */
const isIOS = Platform.OS === 'ios';

function getTabIcon(routeName: string, color: string) {
  switch (routeName) {
    case 'index':
      return isIOS
        ? <SymbolView name="house" tintColor={color} size={25} />
        : <Feather name="home" size={23} color={color} />;
    case 'live':
      return isIOS
        ? <SymbolView name="play.circle" tintColor={color} size={25} />
        : <Ionicons name="play-circle-outline" size={25} color={color} />;
    case 'leaderboard':
      return isIOS
        ? <SymbolView name="trophy" tintColor={color} size={25} />
        : <Ionicons name="trophy-outline" size={25} color={color} />;
    case 'wallet':
      return isIOS
        ? <SymbolView name="creditcard" tintColor={color} size={25} />
        : <Ionicons name="wallet-outline" size={25} color={color} />;
    case 'profile':
      return isIOS
        ? <SymbolView name="person" tintColor={color} size={25} />
        : <Ionicons name="person-outline" size={25} color={color} />;
    default:
      return null;
  }
}

/* ── Fully custom tab bar — icons perfectly centered ── */
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === 'web' ? WEB_BOTTOM_INSET : insets.bottom;

  return (
    <View style={[styles.tabBar, { height: TAB_HEIGHT + bottomPad }]}>
      {/* Background */}
      {isIOS ? (
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.tabBarBg]} />
      )}

      {/* Icon row — sits above safe area */}
      <View style={styles.iconRow}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const color = isFocused ? Colors.primary : Colors.tab.inactive;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tabItem}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.65}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key].options.tabBarAccessibilityLabel}
            >
              {getTabIcon(route.name, color)}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

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

export default function TabLayout() {
  const { isAdmin, adminLoading } = useAuth();
  if (!adminLoading && isAdmin) return <Redirect href="/admin" />;
  return isLiquidGlassAvailable() ? <NativeTabLayout /> : <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
  },
  tabBarBg: {
    backgroundColor: '#0A0A0A',
  },
  /* Exact TAB_HEIGHT row — icons are its only children, so they are centered */
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
});
