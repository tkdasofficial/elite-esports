import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

interface PublicUserProfile {
  id: string;
  username: string;
  rank: string;
  bio: string;
  coins: number;
  is_admin: boolean;
  created_at: string;
}

interface GameProfile {
  id: string;
  game_name: string;
  ign: string;
  uid: string;
}

export default function PublicProfile() {
  const insets = useSafeAreaInsets();
  const { id: username } = useLocalSearchParams<{ id: string }>();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [gameProfiles, setGameProfiles] = useState<GameProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, rank, bio, coins, is_admin, created_at')
        .eq('username', username)
        .single();

      if (error || !data) { setNotFound(true); return; }

      setProfile(data);

      const { data: games } = await supabase
        .from('game_profiles')
        .select('id, game_name, ign, uid')
        .eq('user_id', data.id);

      if (games) setGameProfiles(games);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>@{username}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.brandPrimary} size="large" />
        </View>
      ) : notFound || !profile ? (
        <View style={styles.notFound}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="trophy-outline" size={28} color={Colors.textMuted} />
          </View>
          <Text style={styles.notFoundTitle}>Profile not found</Text>
          <Text style={styles.notFoundSub}>@{username} doesn't exist or hasn't set up their profile yet.</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => router.back()}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero gradient */}
          <View style={styles.heroGradient} />

          <View style={styles.heroContent}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarBorder}>
                <LetterAvatar name={profile.username} size="xl" />
              </View>
              <View style={styles.badgeRow}>
                {profile.is_admin && (
                  <View style={styles.adminBadge}>
                    <Ionicons name="shield-checkmark" size={10} color={Colors.brandPrimaryLight} />
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
                <View style={styles.rankBadge}>
                  <Ionicons name="star" size={11} color={Colors.brandPrimaryLight} />
                  <Text style={styles.rankBadgeText}>{profile.rank}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.username}>{profile.username}</Text>
            <Text style={styles.handle}>@{profile.username}</Text>
            {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>

          {/* Rank card */}
          <View style={styles.section}>
            <View style={styles.rankCard}>
              <View>
                <Text style={styles.rankCardLabel}>Current Rank</Text>
                <Text style={styles.rankCardValue}>{profile.rank}</Text>
              </View>
              <View style={styles.rankCardIcon}>
                <Ionicons name="trophy" size={22} color={Colors.brandPrimaryLight} />
              </View>
            </View>
          </View>

          {/* Game profiles */}
          {gameProfiles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LINKED GAMES</Text>
              <View style={styles.card}>
                {gameProfiles.map((g, i) => (
                  <View
                    key={g.id}
                    style={[styles.gameRow, i > 0 && styles.divider]}
                  >
                    <View style={styles.gameIcon}>
                      <Ionicons name="game-controller" size={17} color={Colors.brandPrimary} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.gameName}>{g.game_name}</Text>
                      <Text style={styles.gameDetails}>{g.ign} · {g.uid}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.footer}>Elite Esports Platform</Text>
          <View style={{ height: insets.bottom + 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  notFoundIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.appElevated, alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  notFoundSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  goBackBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.brandPrimary, borderRadius: 20 },
  goBackText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  heroGradient: { height: 120, backgroundColor: `${Colors.brandPrimary}30` },
  heroContent: { paddingHorizontal: 20, marginTop: -52 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 },
  avatarBorder: { padding: 3, borderRadius: 999, backgroundColor: Colors.appBg },
  badgeRow: { flexDirection: 'row', gap: 8, paddingBottom: 8 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: `${Colors.brandPrimary}30`, borderRadius: 20,
  },
  adminBadgeText: { fontSize: 12, fontWeight: '500', color: Colors.brandPrimaryLight },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: `${Colors.brandPrimary}20`, borderRadius: 20,
  },
  rankBadgeText: { fontSize: 13, fontWeight: '500', color: Colors.brandPrimaryLight },
  username: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  handle: { fontSize: 14, color: Colors.textMuted, marginTop: 2 },
  bio: { fontSize: 15, color: Colors.textSecondary, lineHeight: 22, marginTop: 8 },
  section: { marginHorizontal: 16, marginTop: 16 },
  rankCard: {
    backgroundColor: Colors.appElevated, borderRadius: 16,
    paddingHorizontal: 20, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  rankCardLabel: { fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
  rankCardValue: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginTop: 4 },
  rankCardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: `${Colors.brandPrimary}20`, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06, marginBottom: 8 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.appBorder },
  gameIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${Colors.brandPrimary}20`, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  gameName: { fontSize: 16, color: Colors.textPrimary },
  gameDetails: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  footer: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 24 },
});
