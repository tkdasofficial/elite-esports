import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { AvatarSVG, AVATAR_NAMES } from '@/components/AvatarSVG';
import { useAuth } from '@/store/AuthContext';
import { useProfileCtx } from '@/store/ProfileContext';

const MENU_ITEMS = [
  { icon: 'people-outline',          label: 'My Team',    route: '/my-team' },
  { icon: 'game-controller-outline', label: 'My Matches', route: '/my-matches' },
  { icon: 'settings-outline',        label: 'Settings',   route: '/settings' },
  { icon: 'headset-outline',         label: 'Support',    route: '/support' },
];

type LinkedGame = { game_id?: string; game: string; uid: string };

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfileCtx();
  const tabBarHeight = useBottomTabBarHeight();
  const [selectedGame, setSelectedGame] = useState<LinkedGame | null>(null);

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

  const avatarIndex  = profile.avatar_index ?? 0;
  const name         = profile.full_name || user?.user_metadata?.full_name || 'Player';
  const username     = profile.username  || user?.user_metadata?.username  || 'unknown';
  const linkedGames: LinkedGame[] = Array.isArray(profile.games) ? profile.games : [];

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.hero}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <AvatarSVG index={avatarIndex} size={84} />
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
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>{AVATAR_NAMES[avatarIndex]}</Text>
          </View>

          {/* ── Linked Games (read-only slim list) ── */}
          <View style={styles.gamesSection}>
            <View style={styles.gamesSectionHeader}>
              <Text style={styles.gamesSectionLabel}>Linked Games</Text>
              <TouchableOpacity
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.7}
                style={styles.manageLink}
              >
                <Text style={styles.manageLinkText}>Manage</Text>
                <Ionicons name="chevron-forward" size={12} color={Colors.primary} />
              </TouchableOpacity>
            </View>

            {linkedGames.length === 0 ? (
              /* Empty state */
              <TouchableOpacity
                style={styles.emptyGames}
                onPress={() => router.push('/edit-profile')}
                activeOpacity={0.8}
              >
                <Ionicons name="game-controller-outline" size={22} color={Colors.text.muted} />
                <Text style={styles.emptyGamesText}>No games linked</Text>
                <Text style={styles.emptyGamesHint}>Go to Edit Profile to add your games</Text>
              </TouchableOpacity>
            ) : (
              /* 50 px slim rows */
              <View style={styles.gameList}>
                {linkedGames.map((g, i) => (
                  <React.Fragment key={`${g.game}-${i}`}>
                    <TouchableOpacity
                      style={styles.gameRow}
                      onPress={() => setSelectedGame(g)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.gameRowIcon}>
                        <Ionicons name="game-controller-outline" size={15} color={Colors.primary} />
                      </View>
                      <Text style={styles.gameRowName} numberOfLines={1}>{g.game}</Text>
                      <Text style={styles.gameRowUID} numberOfLines={1}>{g.uid}</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.text.muted} />
                    </TouchableOpacity>
                    {i < linkedGames.length - 1 && <View style={styles.gameDivider} />}
                  </React.Fragment>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.section}>
          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuRow}
              onPress={() => router.push(item.route as any)}
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

      {/* ── Game Detail Popup ── */}
      <Modal
        visible={!!selectedGame}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedGame(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelectedGame(null)}>
          <Pressable style={styles.popup} onPress={() => {}}>
            {selectedGame && (
              <View style={styles.popupInner}>
                {/* Header */}
                <View style={styles.popupHeader}>
                  <View style={styles.popupHeaderIcon}>
                    <Ionicons name="game-controller-outline" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.popupGameName} numberOfLines={1}>{selectedGame.game}</Text>
                  <TouchableOpacity
                    style={styles.popupClose}
                    onPress={() => setSelectedGame(null)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color={Colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Fields */}
                <View style={styles.popupField}>
                  <Text style={styles.popupFieldLabel}>In-game ID / Username</Text>
                  <Text style={styles.popupFieldVal}>{selectedGame.uid}</Text>
                </View>

                {selectedGame.game_id && (
                  <View style={styles.popupField}>
                    <Text style={styles.popupFieldLabel}>Game ID</Text>
                    <Text style={styles.popupFieldVal}>{selectedGame.game_id}</Text>
                  </View>
                )}

                {/* CTA → edit profile */}
                <TouchableOpacity
                  style={styles.popupEditBtn}
                  onPress={() => { setSelectedGame(null); router.push('/edit-profile'); }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="pencil-outline" size={15} color="#fff" />
                  <Text style={styles.popupEditBtnText}>Edit in Profile Settings</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:    { padding: 16 },

  /* Hero */
  hero: {
    backgroundColor: Colors.background.card,
    borderRadius: 20, paddingTop: 28, paddingBottom: 20,
    paddingHorizontal: 24, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42, overflow: 'hidden',
    backgroundColor: Colors.background.elevated,
    borderWidth: 2.5, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  editIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background.card,
  },
  name:     { fontSize: 22, fontFamily: 'Inter_700Bold',    color: Colors.text.primary,   marginBottom: 3 },
  username: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginBottom: 8 },
  avatarBadge: {
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 18, borderWidth: 1, borderColor: 'rgba(254,76,17,0.2)',
  },
  avatarBadgeText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.primary },

  /* Games section */
  gamesSection: {
    alignSelf: 'stretch',
    borderTopWidth: 1, borderTopColor: Colors.border.default, paddingTop: 14,
  },
  gamesSectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  gamesSectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  manageLink: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
  },
  manageLinkText: {
    fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.primary,
  },

  emptyGames: {
    alignItems: 'center', paddingVertical: 18, gap: 5,
  },
  emptyGamesText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  emptyGamesHint: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },

  /* Slim 50 px game rows */
  gameList: {
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border.subtle,
    backgroundColor: Colors.background.elevated,
  },
  gameRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  gameRowIcon: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  gameRowName: {
    flex: 1,
    fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary,
  },
  gameRowUID: {
    fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted,
    flexShrink: 1, maxWidth: 110,
  },
  gameDivider: {
    height: 1, backgroundColor: Colors.border.subtle,
    marginHorizontal: 14,
  },

  /* Menu */
  section: { marginBottom: 16 },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.background.card,
    borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  menuIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.text.primary },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 14, height: 52, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.status.error },

  /* Popup */
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  popup: {
    backgroundColor: Colors.background.card,
    borderRadius: 20, width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  popupInner: { padding: 20 },

  popupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 20,
  },
  popupHeaderIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(254,76,17,0.12)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  popupGameName: {
    flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary,
  },
  popupClose: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  popupField: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 10,
  },
  popupFieldLabel: {
    fontSize: 11, fontFamily: 'Inter_400Regular',
    color: Colors.text.muted, marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  popupFieldVal: {
    fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary,
  },

  popupEditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary,
    borderRadius: 12, height: 46, marginTop: 6,
  },
  popupEditBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
