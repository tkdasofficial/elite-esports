import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Modal, Pressable, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { AvatarSVG, AVATAR_NAMES } from '@/components/AvatarSVG';
import { useAuth } from '@/store/AuthContext';
import { useProfileCtx } from '@/store/ProfileContext';
import { WEB_TOP_INSET } from '@/utils/webInsets';

const BTN_H = 42;
const BTN_R = BTN_H / 2;

const MENU_ITEMS = [
  { icon: 'users',      label: 'My Team',    route: '/my-team' },
  { icon: 'grid',       label: 'My Matches', route: '/my-matches' },
  { icon: 'settings',   label: 'Settings',   route: '/settings' },
  { icon: 'headphones', label: 'Support',    route: '/support' },
] as const;

type LinkedGame = { game_id?: string; game: string; uid: string; inGameName?: string };

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfileCtx();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? Math.max(WEB_TOP_INSET, insets.top) : insets.top;
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

  const avatarIndex = profile.avatar_index ?? 0;
  const name        = profile.full_name || user?.user_metadata?.full_name || 'Player';
  const username    = profile.username  || user?.user_metadata?.username  || 'unknown';
  const linkedGames: LinkedGame[] = Array.isArray(profile.games) ? profile.games : [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
      >

        {/* ── Cover + Avatar ── */}
        <View style={styles.coverSection}>
          <LinearGradient
            colors={['#2A0900', '#1A0500', '#0A0A0A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cover, { paddingTop: topInset }]}
          >
            {/* Decorative grid lines */}
            <View style={styles.coverGrid} pointerEvents="none">
              {[...Array(5)].map((_, i) => (
                <View key={i} style={[styles.coverGridLine, { left: `${i * 25}%` as any }]} />
              ))}
            </View>
          </LinearGradient>

          {/* Avatar — overlaps the cover */}
          <View style={styles.avatarOuter}>
            <View style={styles.avatarCircle}>
              <AvatarSVG index={avatarIndex} size={96} />
            </View>
            <TouchableOpacity
              style={styles.editCameraBtn}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.85}
            >
              <Feather name="camera" size={13} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Identity ── */}
        <View style={styles.identity}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.username}>@{username}</Text>
          <View style={styles.badgePill}>
            <Ionicons name="flash" size={11} color={Colors.primary} />
            <Text style={styles.badgeText}>{AVATAR_NAMES[avatarIndex]}</Text>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.85}
          >
            <Feather name="edit-2" size={15} color="#fff" />
            <Text style={styles.actionBtnPrimaryText}>Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => router.push('/my-matches')}
            activeOpacity={0.85}
          >
            <Feather name="award" size={15} color={Colors.text.primary} />
            <Text style={styles.actionBtnOutlineText}>My Matches</Text>
          </TouchableOpacity>
        </View>

        {/* ── Stats Strip ── */}
        <View style={styles.statsStrip}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>—</Text>
            <Text style={styles.statLbl}>Played</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>—</Text>
            <Text style={styles.statLbl}>Wins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: Colors.primary }]}>₹0</Text>
            <Text style={styles.statLbl}>Earned</Text>
          </View>
        </View>

        {/* ── Linked Games ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { marginTop: -3 }]}>Linked Games</Text>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.7}
            >
              <Feather name="plus" size={13} color={Colors.primary} />
              <Text style={styles.sectionActionText}>Manage</Text>
            </TouchableOpacity>
          </View>

          {linkedGames.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyGames}
              onPress={() => router.push('/edit-profile')}
              activeOpacity={0.8}
            >
              <View style={styles.emptyGamesIcon}>
                <Feather name="monitor" size={22} color={Colors.text.muted} />
              </View>
              <Text style={styles.emptyGamesText}>No games linked yet</Text>
              <Text style={styles.emptyGamesHint}>Tap to add your games</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.gameList}>
              {linkedGames.map((g, i) => (
                <React.Fragment key={`${g.game}-${i}`}>
                  <TouchableOpacity
                    style={styles.gameRow}
                    onPress={() => setSelectedGame(g)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.gameRowIcon}>
                      <Feather name="monitor" size={14} color={Colors.primary} />
                    </View>
                    <Text style={styles.gameRowName} numberOfLines={1}>{g.game}</Text>
                    <Text style={styles.gameRowUID} numberOfLines={1}>{g.inGameName ?? g.uid}</Text>
                    <Feather name="chevron-right" size={15} color={Colors.text.muted} />
                  </TouchableOpacity>
                  {i < linkedGames.length - 1 && <View style={styles.gameDivider} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* ── Menu ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginTop: -4 }]}>More</Text>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.75}
                >
                  <View style={styles.menuIconBox}>
                    <Feather name={item.icon} size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Feather name="chevron-right" size={17} color={Colors.text.muted} />
                </TouchableOpacity>
                {i < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Sign Out ── */}
        <View style={styles.signOutWrap}>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
            <Feather name="log-out" size={17} color={Colors.status.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Game Detail Modal ── */}
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
                <View style={styles.popupHeader}>
                  <View style={styles.popupHeaderIcon}>
                    <Feather name="monitor" size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.popupGameName} numberOfLines={1}>{selectedGame.game}</Text>
                  <TouchableOpacity
                    style={styles.popupClose}
                    onPress={() => setSelectedGame(null)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather name="x" size={17} color={Colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {selectedGame.inGameName && (
                  <View style={styles.popupField}>
                    <Text style={styles.popupFieldLabel}>In-game Name</Text>
                    <Text style={styles.popupFieldVal}>{selectedGame.inGameName}</Text>
                  </View>
                )}
                <View style={styles.popupField}>
                  <Text style={styles.popupFieldLabel}>Player UID</Text>
                  <Text style={styles.popupFieldVal}>{selectedGame.uid}</Text>
                </View>

                <TouchableOpacity
                  style={styles.popupEditBtn}
                  onPress={() => { setSelectedGame(null); router.push('/edit-profile'); }}
                  activeOpacity={0.85}
                >
                  <Feather name="edit-2" size={14} color="#fff" />
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

  /* ── Cover ── */
  coverSection: {
    position: 'relative',
    marginBottom: 56,
  },
  cover: {
    height: 170,
    overflow: 'hidden',
  },
  coverGrid: {
    position: 'absolute', inset: 0,
    flexDirection: 'row',
  },
  coverGridLine: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 1,
    backgroundColor: 'rgba(254,76,17,0.08)',
  },

  /* Avatar overlapping cover */
  avatarOuter: {
    position: 'absolute',
    bottom: -52,
    alignSelf: 'center',
  },
  avatarCircle: {
    width: 104, height: 104, borderRadius: 52,
    backgroundColor: Colors.background.elevated,
    borderWidth: 3.5, borderColor: Colors.background.dark,
    overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  editCameraBtn: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.background.dark,
  },

  /* ── Identity ── */
  identity: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  name:     { fontSize: 22, fontFamily: 'Inter_700Bold',    color: Colors.text.primary,   marginBottom: 3 },
  username: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginBottom: 10 },
  badgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(254,76,17,0.2)',
  },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  /* ── Action Buttons ── */
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: BTN_H,
    borderRadius: BTN_R,
    backgroundColor: Colors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff',
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: BTN_H,
    borderRadius: BTN_R,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  actionBtnOutlineText: {
    fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary,
  },

  /* ── Stats Strip ── */
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingVertical: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  statLbl: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border.default },

  /* ── Sections ── */
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, lineHeight: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary, includeFontPadding: false, textAlignVertical: 'center' },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionActionText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.primary },

  /* ── Games ── */
  emptyGames: {
    alignItems: 'center', paddingVertical: 22, gap: 6,
    backgroundColor: Colors.background.card,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border.subtle,
  },
  emptyGamesIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  emptyGamesText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  emptyGamesHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },

  gameList: {
    backgroundColor: Colors.background.card,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border.subtle,
  },
  gameRow: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 12,
  },
  gameRowIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  gameRowName: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary, includeFontPadding: false, textAlignVertical: 'center' },
  gameRowUID:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, flexShrink: 1, maxWidth: 110, includeFontPadding: false, textAlignVertical: 'center' },
  gameDivider: { height: 1, backgroundColor: Colors.border.subtle, marginHorizontal: 16 },

  /* ── Menu Card ── */
  menuCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border.subtle, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, height: 56,
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 15, lineHeight: 15, fontFamily: 'Inter_500Medium', color: Colors.text.primary, includeFontPadding: false, textAlignVertical: 'center' },
  menuDivider: { height: 1, backgroundColor: Colors.border.subtle, marginLeft: 66 },

  /* ── Sign Out ── */
  signOutWrap: { paddingHorizontal: 20 },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 9,
    height: BTN_H, borderRadius: BTN_R,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  signOutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.status.error },

  /* ── Game Detail Modal ── */
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  popup: {
    backgroundColor: Colors.background.card,
    borderRadius: 20, width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: Colors.border.default, overflow: 'hidden',
  },
  popupInner: { padding: 20 },
  popupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20,
  },
  popupHeaderIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(254,76,17,0.12)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  popupGameName: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  popupClose: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  popupField: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 10,
  },
  popupFieldLabel: {
    fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted,
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  popupFieldVal: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  popupEditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary,
    height: BTN_H, borderRadius: BTN_R, marginTop: 6,
  },
  popupEditBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});