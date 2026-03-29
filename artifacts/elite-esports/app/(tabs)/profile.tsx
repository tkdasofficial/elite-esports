import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Image, Modal, Pressable, useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Colors } from '@/utils/colors';
import { GlobalHeader } from '@/components/GlobalHeader';
import { AvatarSVG, AVATAR_NAMES } from '@/components/AvatarSVG';
import { useAuth } from '@/store/AuthContext';
import { useProfileCtx } from '@/store/ProfileContext';
import { useGames } from '@/features/games/hooks/useGames';

const MENU_ITEMS = [
  { icon: 'people-outline', label: 'My Team', route: '/my-team' },
  { icon: 'game-controller-outline', label: 'My Matches', route: '/my-matches' },
  { icon: 'settings-outline', label: 'Settings', route: '/settings' },
  { icon: 'headset-outline', label: 'Support', route: '/support' },
];

type LinkedGame = { game_id?: string; game: string; uid: string };

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfileCtx();
  const { games: allGames } = useGames();
  const tabBarHeight = useBottomTabBarHeight();
  const { width: screenWidth } = useWindowDimensions();
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
  const name = profile.full_name || user?.user_metadata?.full_name || 'Player';
  const username = profile.username || user?.user_metadata?.username || 'unknown';
  const linkedGames: LinkedGame[] = Array.isArray(profile.games) ? profile.games : [];

  const getBanner = (gameName: string) =>
    allGames.find(g => g.name.toLowerCase() === gameName.toLowerCase())?.banner_url;

  // card width = screen - scroll padding (16×2) - hero horizontal padding (24×2)
  const cardWidth = screenWidth - 32 - 48;

  return (
    <View style={styles.container}>
      <GlobalHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={styles.hero}>
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

          {/* ── Games Row (replaces Matches/Wins/Kills) ── */}
          <View style={styles.gamesSection}>
            <View style={styles.gamesSectionHeader}>
              <Text style={styles.gamesSectionLabel}>Linked Games</Text>
              <TouchableOpacity onPress={() => router.push('/edit-profile')} activeOpacity={0.7}>
                <Text style={styles.gamesSectionLink}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {linkedGames.length === 0 ? (
              <View style={styles.emptyGames}>
                <Ionicons name="game-controller-outline" size={26} color={Colors.text.muted} />
                <Text style={styles.emptyGamesText}>No games linked yet</Text>
                <Text style={styles.emptyGamesHint}>Tap "+ Add" to link your game accounts</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={cardWidth + 12}
                contentContainerStyle={{ gap: 12 }}
              >
                {linkedGames.map((g, i) => {
                  const bannerUrl = getBanner(g.game);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.gameCard, { width: cardWidth }]}
                      onPress={() => setSelectedGame(g)}
                      activeOpacity={0.82}
                    >
                      {bannerUrl ? (
                        <Image source={{ uri: bannerUrl }} style={styles.gameBanner} resizeMode="cover" />
                      ) : (
                        <View style={[styles.gameBanner, styles.gameBannerPlaceholder]}>
                          <Ionicons name="game-controller-outline" size={22} color={Colors.text.muted} />
                        </View>
                      )}
                      <View style={styles.gameCardBody}>
                        <Text style={styles.gameCardName} numberOfLines={1}>{g.game}</Text>
                        <Text style={styles.gameCardUID} numberOfLines={1}>In-game: {g.uid}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={15} color={Colors.text.muted} style={{ marginRight: 12 }} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
            {selectedGame && (() => {
              const bannerUrl = getBanner(selectedGame.game);
              return (
                <>
                  {bannerUrl ? (
                    <Image source={{ uri: bannerUrl }} style={styles.popupBanner} resizeMode="cover" />
                  ) : (
                    <View style={[styles.popupBanner, styles.popupBannerPlaceholder]}>
                      <Ionicons name="game-controller-outline" size={36} color={Colors.text.muted} />
                    </View>
                  )}

                  <View style={styles.popupBody}>
                    <TouchableOpacity
                      style={styles.popupClose}
                      onPress={() => setSelectedGame(null)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close" size={20} color={Colors.text.primary} />
                    </TouchableOpacity>

                    <Text style={styles.popupGame}>{selectedGame.game}</Text>

                    <View style={styles.popupRow}>
                      <View style={styles.popupIconBox}>
                        <Ionicons name="person-outline" size={15} color={Colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.popupFieldLabel}>In-game Name</Text>
                        <Text style={styles.popupFieldVal}>{selectedGame.uid}</Text>
                      </View>
                    </View>

                    <View style={styles.popupRow}>
                      <View style={styles.popupIconBox}>
                        <Ionicons name="key-outline" size={15} color={Colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.popupFieldLabel}>Player UID</Text>
                        <Text style={styles.popupFieldVal}>{selectedGame.uid}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.popupEditBtn}
                      onPress={() => { setSelectedGame(null); router.push('/edit-profile'); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil-outline" size={15} color="#fff" />
                      <Text style={styles.popupEditBtnText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },

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
  name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 3 },
  username: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginBottom: 8 },
  avatarBadge: {
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 18, borderWidth: 1, borderColor: 'rgba(254,76,17,0.2)',
  },
  avatarBadgeText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.primary },

  gamesSection: {
    alignSelf: 'stretch',
    borderTopWidth: 1, borderTopColor: Colors.border.default, paddingTop: 16,
  },
  gamesSectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  gamesSectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  gamesSectionLink: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary,
  },

  emptyGames: {
    alignItems: 'center', paddingVertical: 20, gap: 6,
  },
  emptyGamesText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  emptyGamesHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },

  gameCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background.elevated,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border.default,
  },
  gameBanner: { width: 70, height: 52 },
  gameBannerPlaceholder: {
    backgroundColor: Colors.background.dark,
    alignItems: 'center', justifyContent: 'center',
  },
  gameCardBody: { flex: 1, paddingHorizontal: 12 },
  gameCardName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  gameCardUID: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },

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

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  popup: {
    backgroundColor: Colors.background.card,
    borderRadius: 20, overflow: 'hidden',
    width: '100%', maxWidth: 360,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  popupBanner: { width: '100%', height: 120 },
  popupBannerPlaceholder: {
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  popupBody: { padding: 20 },
  popupClose: {
    position: 'absolute', top: 14, right: 14,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  popupGame: {
    fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.primary,
    marginBottom: 18, paddingRight: 36,
  },
  popupRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background.elevated,
    borderRadius: 12, padding: 14, marginBottom: 10,
  },
  popupIconBox: {
    width: 34, height: 34, borderRadius: 9,
    backgroundColor: 'rgba(254,76,17,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  popupFieldLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginBottom: 2 },
  popupFieldVal: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  popupEditBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, backgroundColor: Colors.primary,
    borderRadius: 12, height: 46, marginTop: 6,
  },
  popupEditBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
