import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchStore } from '@/src/store/matchStore';
import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { MatchParticipant } from '@/src/types';
import { Colors } from '@/src/theme/colors';

const terms = [
  'Participants must be at least 16 years old.',
  'Stable internet connection required.',
  'Screenshot results within 15 minutes of match end.',
  'Unsportsmanlike behavior leads to disqualification.',
  'Organiser decisions are final in all disputes.',
];

export default function MatchDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { getMatchById, addParticipant, removeParticipant } = useMatchStore();
  const { user, joinedMatchIds, joinMatch, leaveMatch } = useUserStore();

  const match = getMatchById(id || '');
  const isJoined = joinedMatchIds.includes(id || '');

  const handleJoinLeave = async () => {
    if (!match || !user) return;
    if (isJoined) {
      Alert.alert('Leave Tournament', 'Are you sure you want to leave?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave', style: 'destructive', onPress: async () => {
            await leaveMatch(match.match_id);
            removeParticipant(match.match_id, user.id);
          }
        },
      ]);
    } else {
      await joinMatch(match.match_id);
      const participant: MatchParticipant = { id: user.id, username: user.username, joinedAt: new Date().toISOString() };
      addParticipant(match.match_id, participant);
    }
  };

  if (!match) return (
    <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
      <Text style={styles.notFound}>Match not found</Text>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const isJoinable = match.status !== 'completed';
  const slotsLeft = match.slots_total - match.slots_filled;
  const isFull = slotsLeft <= 0;
  const fillPct = Math.min((match.slots_filled / match.slots_total) * 100, 100);
  const joinedPlayers = match.participants ?? [];

  const statusCfg = {
    live: { color: Colors.brandLive, bg: `${Colors.brandLive}25`, label: 'LIVE' },
    upcoming: { color: Colors.brandWarning, bg: `${Colors.brandWarning}25`, label: 'UPCOMING' },
    completed: { color: Colors.textMuted, bg: Colors.appElevated, label: 'ENDED' },
  };
  const sc = statusCfg[match.status];

  const btnLabel = match.status === 'completed' ? 'Match Ended'
    : isJoined ? 'Leave Tournament'
    : isFull ? 'Tournament Full'
    : 'Join Tournament';

  const btnDisabled = !isJoinable || (isFull && !isJoined);
  const btnColor = isJoined ? Colors.brandLive : Colors.brandSuccess;

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: match.banner_image }} style={styles.banner} resizeMode="cover" />
          <View style={styles.bannerOverlay} />

          {/* Top bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.topBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color={Colors.white} />
            </TouchableOpacity>
            <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
              {match.status === 'live' && <View style={styles.liveDot} />}
              <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
            </View>
            <TouchableOpacity style={styles.topBtn}>
              <Feather name="share-2" size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main card */}
        <View style={styles.contentArea}>
          <View style={styles.card}>
            <View style={styles.tagRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{match.game_name}</Text>
              </View>
              <View style={[styles.tag, styles.tagWarning]}>
                <Text style={[styles.tagText, { color: Colors.brandWarning }]}>{match.mode}</Text>
              </View>
            </View>
            <Text style={styles.matchTitle}>{match.title}</Text>
            <View style={styles.verifiedRow}>
              <Ionicons name="checkmark-circle" size={13} color={Colors.brandSuccess} />
              <Text style={styles.verifiedText}>Organised by Elite Esports · Verified</Text>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              {[
                { icon: 'trophy', label: 'Prize', value: match.prize, color: Colors.brandSuccess },
                { icon: 'flash', label: 'Entry', value: match.entry_fee, color: Colors.brandWarning },
                { icon: 'time', label: 'Starts', value: match.start_time, color: Colors.brandPrimaryLight },
              ].map(s => (
                <View key={s.label} style={[styles.statCard, { backgroundColor: `${s.color}12` }]}>
                  <Ionicons name={s.icon as any} size={15} color={s.color} />
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                </View>
              ))}
            </View>

            {/* Slots progress */}
            <View style={styles.slotsSection}>
              <View style={styles.slotsHeader}>
                <Text style={styles.slotsLabel}>Participants</Text>
                <Text style={[styles.slotsStatus, isFull && { color: Colors.brandLive }]}>
                  {isFull ? 'Tournament Full' : `${slotsLeft} slots left`}
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, {
                  width: `${fillPct}%` as any,
                  backgroundColor: isFull ? Colors.brandLive : fillPct > 75 ? Colors.brandWarning : Colors.brandPrimary,
                }]} />
              </View>
              <Text style={styles.slotsCount}>{match.slots_filled}/{match.slots_total} joined</Text>
            </View>
          </View>

          {/* Players list */}
          {joinedPlayers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>REGISTERED PLAYERS</Text>
              <View style={styles.card}>
                {joinedPlayers.map((p, i) => (
                  <View key={p.id} style={[styles.playerRow, i < joinedPlayers.length - 1 && styles.divider]}>
                    <LetterAvatar name={p.username || 'P'} size="sm" />
                    <View style={styles.flex1}>
                      <Text style={styles.playerName}>{p.username}</Text>
                      <Text style={styles.playerJoined}>
                        Joined {new Date(p.joinedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                    {p.id === user?.id && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youText}>You</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TOURNAMENT RULES</Text>
            <View style={styles.card}>
              <View style={styles.ruleItem}>
                <View style={[styles.ruleIcon, { backgroundColor: `${Colors.brandPrimary}12` }]}>
                  <Ionicons name="shield-checkmark" size={17} color={Colors.brandPrimaryLight} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.ruleName}>Anti-Cheat Active</Text>
                  <Text style={styles.ruleDesc}>Advanced detection active. Hacks or scripts = permanent ban.</Text>
                </View>
              </View>
              <View style={[styles.ruleItem, styles.divider]}>
                <View style={[styles.ruleIcon, { backgroundColor: `${Colors.brandSuccess}12` }]}>
                  <Ionicons name="people" size={17} color={Colors.brandSuccess} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.ruleName}>Match Format</Text>
                  <Text style={styles.ruleDesc}>Best of 3 series. Points based on placement & kills.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TERMS & CONDITIONS</Text>
            <View style={styles.card}>
              <View style={styles.termsPad}>
                {terms.map((t, i) => (
                  <View key={i} style={styles.termRow}>
                    <View style={styles.termNum}>
                      <Text style={styles.termNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.termText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* CTA bar */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.ctaFee}>
          <Text style={styles.ctaFeeLabel}>ENTRY FEE</Text>
          <Text style={styles.ctaFeeValue}>{match.entry_fee}</Text>
        </View>
        <TouchableOpacity
          style={[styles.joinBtn, { backgroundColor: btnColor }, btnDisabled && styles.disabled]}
          onPress={handleJoinLeave}
          disabled={btnDisabled}
        >
          <Text style={styles.joinBtnText}>{btnLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  notFound: { fontSize: 17, color: Colors.textSecondary },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: Colors.brandPrimary, borderRadius: 14 },
  backBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  scroll: {},
  bannerContainer: { height: 260, position: 'relative' },
  banner: { width: '100%', height: '100%' },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.brandLive },
  statusText: { fontSize: 12, fontWeight: '700' },
  contentArea: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  card: { backgroundColor: Colors.appCard, borderRadius: 20, padding: 16, gap: 14 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: `${Colors.brandPrimary}25`, borderRadius: 20, borderWidth: 1, borderColor: `${Colors.brandPrimary}30` },
  tagWarning: { backgroundColor: `${Colors.brandWarning}25`, borderColor: `${Colors.brandWarning}30` },
  tagText: { fontSize: 12, fontWeight: '500', color: Colors.brandPrimaryLight },
  matchTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, letterSpacing: -0.5, lineHeight: 28 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  verifiedText: { fontSize: 13, color: Colors.textMuted },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  statValue: { fontSize: 14, fontWeight: '700' },
  slotsSection: { gap: 8 },
  slotsHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  slotsLabel: { fontSize: 13, color: Colors.textMuted },
  slotsStatus: { fontSize: 13, color: Colors.textSecondary },
  progressBg: { height: 6, backgroundColor: Colors.appElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  slotsCount: { fontSize: 12, color: Colors.textMuted },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.appBorder },
  flex1: { flex: 1 },
  playerName: { fontSize: 15, color: Colors.textPrimary },
  playerJoined: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  youBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: `${Colors.brandPrimary}25`, borderRadius: 12 },
  youText: { fontSize: 11, fontWeight: '500', color: Colors.brandPrimaryLight },
  ruleItem: { flexDirection: 'row', gap: 12, paddingVertical: 14 },
  ruleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ruleName: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  ruleDesc: { fontSize: 13, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  termsPad: { gap: 12 },
  termRow: { flexDirection: 'row', gap: 12 },
  termNum: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.appElevated, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  termNumText: { fontSize: 10, fontWeight: '600', color: Colors.textMuted },
  termText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  ctaBar: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: `${Colors.appBg}F5`,
    borderTopWidth: 1, borderTopColor: Colors.appBorder,
  },
  ctaFee: {},
  ctaFeeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.5 },
  ctaFeeValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  joinBtn: {
    flex: 1, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  joinBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.3 },
});
