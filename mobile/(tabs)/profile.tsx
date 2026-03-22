import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Share, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/store/authStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

interface RowProps {
  icon: string;
  label: string;
  sub?: string;
  color?: string;
  iconColor?: string;
  onPress?: () => void;
  danger?: boolean;
}

function Row({ icon, label, sub, color, iconColor, onPress, danger }: RowProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.row}>
      <View style={[styles.rowIcon, color ? { backgroundColor: color } : {}]}>
        <Ionicons name={icon as any} size={17} color={iconColor || Colors.textSecondary} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLabel, danger && { color: Colors.brandLive }]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { user, logout, gameProfiles, isAdmin, joinedMatchIds, transactions } = useUserStore();
  const { signOut } = useAuthStore();
  const [showShare, setShowShare] = useState(false);

  if (!user) return null;

  const played = joinedMatchIds.length;
  const wins = transactions.filter(t => t.type === 'win' && t.status === 'success').length;
  const winPct = played > 0 ? Math.round((wins / played) * 100) : 0;

  const stats = [
    { label: 'Played', value: played.toString() },
    { label: 'Wins', value: wins.toString() },
    { label: 'Win %', value: `${winPct}%` },
    { label: 'Rank', value: user.rank },
  ];

  const handleShare = async () => {
    try {
      await Share.share({ message: `Check out my profile on Elite eSports! @${user.username}` });
    } catch {}
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { logout(); await signOut(); } },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroBanner} />
          <View style={styles.heroContent}>
            <View style={styles.heroAvatar}>
              <LetterAvatar name={user.username} size="xl" />
            </View>
            <View style={styles.rankBadge}>
              <Ionicons name="star" size={11} color={Colors.brandPrimary} />
              <Text style={styles.rankText}>{user.rank}</Text>
            </View>
          </View>
          <View style={styles.heroInfo}>
            <View style={styles.heroNameRow}>
              <View style={styles.heroNameInfo}>
                <Text style={styles.heroName}>{user.username}</Text>
                <Text style={styles.heroEmail}>{user.email}</Text>
                {user.bio ? <Text style={styles.heroBio}>{user.bio}</Text> : null}
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
                  <Feather name="edit-2" size={13} color={Colors.textPrimary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Feather name="share-2" size={13} color={Colors.brandPrimaryLight} />
                  <Text style={styles.shareBtnText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {stats.map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>MY GAMES</Text>
            <TouchableOpacity onPress={() => router.push('/add-game')} style={styles.addGameBtn}>
              <Ionicons name="add" size={16} color={Colors.brandPrimary} />
              <Text style={styles.addGameText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            {gameProfiles.length === 0 ? (
              <View style={styles.emptyGames}>
                <Ionicons name="game-controller-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyGamesText}>No games linked yet</Text>
                <TouchableOpacity onPress={() => router.push('/add-game')}>
                  <Text style={styles.linkGame}>Link a game</Text>
                </TouchableOpacity>
              </View>
            ) : (
              gameProfiles.map((g, i) => (
                <TouchableOpacity key={g.id} onPress={() => router.push(`/edit-game/${g.id}`)} style={[styles.gameRow, i < gameProfiles.length - 1 && styles.divider]}>
                  <View style={styles.gameIcon}>
                    <Ionicons name="game-controller" size={17} color={Colors.brandPrimary} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.gameName}>{g.gameName}</Text>
                    <Text style={styles.gameInfo}>{g.ign} · {g.uid}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Competitions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COMPETITIONS</Text>
          <View style={styles.card}>
            <Row icon="trophy" label="My Matches" sub="View your registered tournaments" color={`${Colors.brandWarning}25`} iconColor={Colors.brandWarning} onPress={() => router.push('/my-matches')} />
            <View style={styles.divider} />
            <Row icon="people" label="My Team" sub="Squad management" color={`${Colors.brandPrimary}25`} iconColor={Colors.brandPrimaryLight} onPress={() => router.push('/my-team')} />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.card}>
            <Row icon="settings" label="Settings" onPress={() => router.push('/settings')} />
            <View style={styles.divider} />
            <Row icon="log-out" label="Sign Out" danger onPress={handleSignOut} />
          </View>
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.adminBtn} onPress={() => router.push('/admin')}>
              <Text style={styles.adminBtnText}>Open Admin Panel</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.footer}>Elite Esports Platform · Build 2026.03</Text>
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  scroll: { paddingBottom: 24 },
  hero: { marginBottom: 16 },
  heroBanner: { height: 100, backgroundColor: Colors.brandPrimary + '30', opacity: 0.5 },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: -40 },
  heroAvatar: { padding: 3, borderRadius: 25, backgroundColor: Colors.appBg },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: `${Colors.brandPrimary}25`, borderRadius: 20, marginBottom: 8,
  },
  rankText: { fontSize: 13, color: Colors.brandPrimaryLight, fontWeight: '500' },
  heroInfo: { paddingHorizontal: 20, paddingTop: 12 },
  heroNameRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  heroNameInfo: { flex: 1, gap: 2 },
  heroName: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  heroEmail: { fontSize: 15, color: Colors.textSecondary },
  heroBio: { fontSize: 15, color: Colors.textSecondary, lineHeight: 20, marginTop: 4 },
  heroActions: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: Colors.appElevated, borderRadius: 20,
  },
  editBtnText: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: `${Colors.brandPrimary}25`, borderRadius: 20,
  },
  shareBtnText: { fontSize: 13, fontWeight: '500', color: Colors.brandPrimaryLight },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.appElevated, borderRadius: 14, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 16, gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06, fontWeight: '400' },
  addGameBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addGameText: { fontSize: 15, color: Colors.brandPrimary },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  emptyGames: { paddingVertical: 32, alignItems: 'center', gap: 8 },
  emptyGamesText: { fontSize: 15, color: Colors.textSecondary },
  linkGame: { fontSize: 15, color: Colors.brandPrimary, fontWeight: '500' },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  gameIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.brandPrimary}25`, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  gameName: { fontSize: 16, color: Colors.textPrimary },
  gameInfo: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.appElevated, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 16, color: Colors.textPrimary },
  rowSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.appBorder },
  adminBtn: {
    backgroundColor: Colors.brandPrimary, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  adminBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  footer: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, paddingVertical: 8 },
});
