import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';

const AVATARS = ['🎮', '⚡', '🔥', '💀', '🎯', '🛡️', '⚔️', '🏆'];

const MENU_ITEMS = [
  { icon: 'people-outline', label: 'My Team', route: '/my-team' },
  { icon: 'game-controller-outline', label: 'My Matches', route: '/my-matches' },
  { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  { icon: 'headset-outline', label: 'Support', route: '/support' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile(user?.id);
  const tabBarHeight = useBottomTabBarHeight();

  if (loading) {
    return (
      <View style={styles.container}>
        <GlobalHeader />
        <View style={[styles.centered, { paddingBottom: tabBarHeight }]}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  const avatarIndex = profile.avatar_index ?? 0;
  const name = profile.full_name || user?.user_metadata?.full_name || 'Player';
  const username = profile.username || user?.user_metadata?.username || 'unknown';

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.hero}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{AVATARS[avatarIndex] ?? '🎮'}</Text>
            </View>
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{username}</Text>

          <View style={styles.statsRow}>
            {[
              { label: 'Matches', val: '0' },
              { label: 'Wins', val: '0' },
              { label: 'Kills', val: '0' },
            ].map(({ label, val }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <View style={styles.statDiv} />}
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>{val}</Text>
                  <Text style={styles.statLbl}>{label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Game IDs */}
        {profile.games && profile.games.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Game IDs</Text>
            {profile.games.map((g, i) => (
              <View key={i} style={styles.gameRow}>
                <View style={styles.gameIconBox}>
                  <Ionicons name="game-controller-outline" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameName}>{g.game}</Text>
                  <Text style={styles.gameUID}>UID: {g.uid}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Menu */}
        <View style={styles.section}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuRow}
              onPress={() => item.route && router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name={item.icon as any} size={19} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={17} color={Colors.text.muted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.status.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },
  hero: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.background.elevated,
    borderWidth: 2.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 38 },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background.card,
  },
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 3 },
  username: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginBottom: 22 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderTopWidth: 1,
    borderTopColor: Colors.border.default,
    paddingTop: 18,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  statLbl: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  statDiv: { width: 1, height: 32, backgroundColor: Colors.border.default },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  gameIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  gameUID: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.background.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text.primary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 14,
    height: 52,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.status.error },
});
