import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

export default function MyTeam() {
  const insets = useSafeAreaInsets();
  const { user, gameProfiles } = useUserStore();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>My Team</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <LetterAvatar name={user?.username || 'P'} size="xl" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.username}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.rankBadge}>
              <Ionicons name="star" size={11} color={Colors.brandPrimary} />
              <Text style={styles.rankText}>{user?.rank}</Text>
            </View>
          </View>
        </View>

        {/* Game profiles */}
        <Text style={styles.sectionLabel}>GAME PROFILES</Text>
        {gameProfiles.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="game-controller-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No game profiles linked</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-game')}>
              <Ionicons name="add" size={16} color={Colors.white} />
              <Text style={styles.addBtnText}>Add Game Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            {gameProfiles.map((g, i) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.gameRow, i < gameProfiles.length - 1 && styles.divider]}
                onPress={() => router.push(`/edit-game/${g.id}`)}
              >
                <View style={styles.gameIcon}>
                  <Ionicons name="game-controller" size={18} color={Colors.brandPrimary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.gameName}>{g.gameName}</Text>
                  <Text style={styles.gameDetails}>IGN: {g.ign} · UID: {g.uid}</Text>
                </View>
                <Ionicons name="chevron-forward" size={15} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {gameProfiles.length > 0 && (
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/add-game')}>
            <Ionicons name="add" size={16} color={Colors.brandPrimary} />
            <Text style={styles.addMoreText}>Add Another Game</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  profileCard: { backgroundColor: Colors.appCard, borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary },
  profileEmail: { fontSize: 14, color: Colors.textSecondary },
  rankBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${Colors.brandPrimary}20`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 4 },
  rankText: { fontSize: 13, color: Colors.brandPrimaryLight, fontWeight: '500' },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06 },
  emptyCard: { backgroundColor: Colors.appCard, borderRadius: 18, padding: 32, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, color: Colors.textSecondary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.brandPrimary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  addBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.appBorder },
  gameIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${Colors.brandPrimary}20`, alignItems: 'center', justifyContent: 'center' },
  flex1: { flex: 1 },
  gameName: { fontSize: 16, color: Colors.textPrimary },
  gameDetails: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 14, backgroundColor: Colors.appElevated, borderRadius: 14 },
  addMoreText: { fontSize: 15, color: Colors.brandPrimary },
});
