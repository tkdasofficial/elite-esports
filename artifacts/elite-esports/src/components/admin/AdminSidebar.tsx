import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated,
  Pressable, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { useAdminSidebar } from '@/store/AdminSidebarContext';
import { useAuth } from '@/store/AuthContext';

const NAV_ITEMS = [
  { icon: 'grid-outline' as const,              label: 'Dashboard',    route: '/admin' },
  { icon: 'people-outline' as const,             label: 'Users',        route: '/admin/users' },
  { icon: 'trophy-outline' as const,             label: 'Matches',      route: '/admin/matches' },
  { icon: 'game-controller-outline' as const,    label: 'Games',        route: '/admin/games' },
  { icon: 'card-outline' as const,               label: 'Payments',     route: '/admin/payments' },
  { icon: 'cash-outline' as const,               label: 'Withdrawals',  route: '/admin/withdrawals' },
  { icon: 'headset-outline' as const,            label: 'Support',      route: '/admin/support' },
  { icon: 'flag-outline' as const,               label: 'Reports',      route: '/admin/reports' },
  { icon: 'megaphone-outline' as const,          label: 'Broadcast',    route: '/admin/broadcast' },
  { icon: 'bar-chart-outline' as const,          label: 'Monetization', route: '/admin/monetization' },
];

const ITEM_COLORS: Record<string, string> = {
  Dashboard:    '#FE4C11',
  Users:        '#3B82F6',
  Matches:      '#F59E0B',
  Games:        '#8B5CF6',
  Payments:     '#22C55E',
  Withdrawals:  '#EF4444',
  Support:      '#06B6D4',
  Reports:      '#F97316',
  Broadcast:    '#EC4899',
  Monetization: '#84CC16',
};

export function AdminSidebar() {
  const { isOpen, close } = useAdminSidebar();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const handleNav = (route: string) => {
    close();
    router.push(route as any);
  };

  const handleLogout = async () => {
    close();
    await signOut();
  };

  const isActive = (route: string) => {
    if (route === '/admin') return pathname === '/admin';
    return pathname.startsWith(route);
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD';

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={close} />

        <Animated.View style={[styles.drawer, { paddingTop: insets.top + 16 }]}>
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Ionicons name="shield-checkmark" size={20} color="#FE4C11" />
              </View>
              <View>
                <Text style={styles.logoTitle}>Elite eSports</Text>
                <Text style={styles.logoSub}>Admin Panel</Text>
              </View>
            </View>
            <TouchableOpacity onPress={close} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitials}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.email ?? 'Admin'}
              </Text>
              <View style={styles.adminBadge}>
                <View style={styles.adminDot} />
                <Text style={styles.adminBadgeText}>Super Admin</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.navList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            <Text style={styles.sectionLabel}>Navigation</Text>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.route);
              const color = ITEM_COLORS[item.label];
              return (
                <TouchableOpacity
                  key={item.route}
                  style={[styles.navItem, active && styles.navItemActive]}
                  onPress={() => handleNav(item.route)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.navIconWrap, { backgroundColor: active ? color + '25' : color + '14' }]}>
                    <Ionicons name={item.icon} size={18} color={active ? color : Colors.text.muted} />
                  </View>
                  <Text style={[styles.navLabel, active && { color: Colors.text.primary }]}>
                    {item.label}
                  </Text>
                  {active && <View style={[styles.activeBar, { backgroundColor: color }]} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <View style={styles.logoutIconWrap}>
                <Ionicons name="log-out-outline" size={18} color={Colors.status.error} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const DRAWER_WIDTH = 280;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0E0E0E',
    borderRightWidth: 1,
    borderRightColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(254,76,17,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254,76,17,0.25)',
  },
  logoTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
  },
  logoSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.primary,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#1E1E1E',
    marginHorizontal: 18,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(254,76,17,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(254,76,17,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.primary,
  },
  userName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  adminDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.status.success,
  },
  adminBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
  },
  navList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: '#181818',
  },
  navIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.muted,
  },
  activeBar: {
    position: 'absolute',
    right: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 3,
  },
  footer: {
    paddingBottom: Platform.OS === 'web' ? 24 : 32,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.15)',
  },
  logoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.status.error,
  },
});
