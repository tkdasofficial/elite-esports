import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, BackHandler,
  ActivityIndicator, Linking, Modal, FlatList,
} from 'react-native';
import { SkeletonBar } from '@/components/SkeletonBar';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { STATUS_CONFIG } from '@/utils/types';
import { useAuth } from '@/store/AuthContext';
import { useMatchDetail, GameProfile } from '@/features/match/hooks/useMatchDetail';
import { useMatchPlayers } from '@/features/match/hooks/useMatchPlayers';
import { useMatchWinners } from '@/features/match/hooks/useMatchWinners';
import { usePrizeTiers } from '@/features/match/hooks/usePrizeTiers';
import { AvatarSVG } from '@/components/AvatarSVG';
import { AdLoadingOverlay } from '@/components/AdLoadingOverlay';
import { useAdGate } from '@/hooks/useAdGate';
import { supabase } from '@/services/supabase';
import { useWallet } from '@/store/WalletContext';
import type { AppColors } from '@/utils/colors';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

function rankMedal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function formatPrize(amount: number): string {
  const n = Math.round(amount * 100) / 100;
  return n % 1 === 0
    ? n.toLocaleString('en-IN')
    : n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const BANNER_HEIGHT = 240;
const GOLD = '#FFA200';

function SectionLabel({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 13 }}>
      <Ionicons name={icon} size={14} color={colors.primary} />
      <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.5 }}>
        {title}
      </Text>
    </View>
  );
}

export default function MatchDetailScreen() {
  const { id }                   = useLocalSearchParams<{ id: string }>();
  const { user }                 = useAuth();
  const { refreshWallet }        = useWallet();
  const insets                   = useSafeAreaInsets();
  const { match, loading, hasJoined, joining, joinMatch, leaving, leaveMatch, fetchGameProfile } = useMatchDetail(id, user?.id);
  const { gateWithInterstitial, gateWithRewarded, overlay, dismiss } = useAdGate();
  const { colors, isDark }        = useTheme();
  const styles                   = useMemo(() => createStyles(colors), [colors]);

  const [claimLoading,      setClaimLoading]      = useState(false);
  const [claimResult,       setClaimResult]       = useState<{ rank: number; points: number; prize: number } | null>(null);
  const [alreadyClaimed,    setAlreadyClaimed]    = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [showPlayers,       setShowPlayers]       = useState(false);
  const [showWinners,       setShowWinners]       = useState(false);

  // Join confirm states
  const [joinConfirmVisible, setJoinConfirmVisible] = useState(false);
  const [noProfileVisible,   setNoProfileVisible]   = useState(false);
  const [gameProfile,        setGameProfile]         = useState<GameProfile | null>(null);
  const [profileLoading,     setProfileLoading]      = useState(false);

  const { players, loading: playersLoading } = useMatchPlayers(id, showPlayers);
  const { winners, loading: winnersLoading } = useMatchWinners(id, showWinners);
  const { tiers,   loading: tiersLoading   } = usePrizeTiers(id);

  const bottomPad = insets.bottom;
  const isLive    = match?.status === 'ongoing';

  useEffect(() => {
    if (!user || match?.status !== 'completed') return;
    (async () => {
      const { data, error } = await supabase.rpc('get_user_match_result', { _match_id: id });
      if (error || !data?.found) return;
      setClaimResult({ rank: data.rank, points: data.points, prize: Number(data.prize ?? 0) });
      setAlreadyClaimed(data.already_claimed ?? false);
    })();
  }, [id, user, match?.status]);

  useEffect(() => {
    if (!isLive || !hasJoined) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      gateWithInterstitial(() => router.back());
      return true;
    });
    return () => handler.remove();
  }, [isLive, hasJoined, gateWithInterstitial]);

  // ── JOIN: KYC gate first, then fetch profile, then show confirm modal ──────
  const handleJoinPress = useCallback(async () => {
    // Block unverified users before doing anything else
    if (!user?.user_metadata?.kyc_completed) {
      Alert.alert(
        'Profile Required',
        'You need to complete your profile setup before joining a match.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete Profile', onPress: () => router.push('/(auth)/kyc') },
        ]
      );
      return;
    }

    if (!match?.game_id) {
      Alert.alert('Error', 'Match game not configured.');
      return;
    }
    setProfileLoading(true);
    try {
      const profile = await fetchGameProfile(match.game_id);
      setProfileLoading(false);
      if (!profile) {
        setNoProfileVisible(true);
      } else {
        setGameProfile(profile);
        setJoinConfirmVisible(true);
      }
    } catch {
      setProfileLoading(false);
      Alert.alert('Error', 'Could not load your game profile.');
    }
  }, [user?.user_metadata?.kyc_completed, match?.game_id, fetchGameProfile]);

  const handleJoinConfirm = useCallback(() => {
    setJoinConfirmVisible(false);
    gateWithInterstitial(async () => {
      const { error } = await joinMatch();
      if (error) Alert.alert('Error', error.message);
      else {
        refreshWallet().catch(() => {});
        Alert.alert('Joined!', 'You have successfully joined this match.');
      }
    });
  }, [gateWithInterstitial, joinMatch, refreshWallet]);

  // ── LEAVE: always no refund ───────────────────────────────────────────────
  const handleLeave = useCallback(() => {
    if (!match) return;
    setLeaveModalVisible(true);
  }, [match]);

  const handleLeaveConfirm = useCallback(() => {
    if (!match) return;
    setLeaveModalVisible(false);
    gateWithInterstitial(async () => {
      const { error } = await leaveMatch();
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      Alert.alert('Left Match', 'You have left the match. Your entry fee was not refunded. You must pay again to rejoin.');
      router.back();
    }, 'Loading Ad...', 'leave_match');
  }, [match, gateWithInterstitial, leaveMatch]);

  // ── CLAIM PRIZE ───────────────────────────────────────────────────────────
  const handleClaim = useCallback(() => {
    if (!claimResult || claimResult.prize <= 0 || !user) return;
    gateWithRewarded(
      () => { void supabase.rpc('credit_ad_bonus').then(null, () => {}); },
      async () => {
        setClaimLoading(true);
        try {
          const { data, error } = await supabase.rpc('claim_match_prize', { _match_id: id });
          if (error) {
            Alert.alert('Error', error.message);
          } else if (data?.success === false) {
            setAlreadyClaimed(true);
            Alert.alert('Already Claimed', data.error ?? 'You have already claimed this prize.');
          } else {
            const actualPrize = Number(data?.prize ?? claimResult.prize);
            setAlreadyClaimed(true);
            refreshWallet().catch(() => {});
            Alert.alert('🏆 Prize Claimed!', `₹${formatPrize(actualPrize)} has been added to your wallet.`);
          }
        } finally {
          setClaimLoading(false);
        }
      },
    );
  }, [claimResult, user, gateWithRewarded, id, refreshWallet]);

  if (loading) {
    return (
      <View style={styles.container}>
        <SkeletonBar width="100%" height={BANNER_HEIGHT} radius={0} />
        <View style={{ padding: 20, gap: 14 }}>
          <SkeletonBar width="40%" height={11} radius={6} />
          <SkeletonBar width="80%" height={26} radius={8} />
          <SkeletonBar width="100%" height={100} radius={14} />
          <SkeletonBar width="100%" height={80} radius={14} />
          <SkeletonBar width="100%" height={56} radius={14} />
        </View>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={52} color="#444" />
        <Text style={styles.emptyTitle}>Match Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg          = STATUS_CONFIG[match.status];
  const isFree       = match.entry_fee === 0;
  const isFull       = match.players_joined >= match.max_players;
  const canJoin      = match.status === 'upcoming' && !isFull && !hasJoined;
  const canLeave     = hasJoined && match.status !== 'completed';
  const showClaimBtn = match.status === 'completed' && hasJoined && claimResult !== null && claimResult.prize > 0 && !alreadyClaimed;
  const filledPct    = Math.min((match.players_joined / match.max_players) * 100, 100);
  const rules        = match.rules ? match.rules.split('\n').filter(l => l.trim()) : [];

  return (
    <View style={styles.container}>
      <AdLoadingOverlay
        visible={overlay.visible}
        bypassAfter={overlay.duration}
        onSkip={dismiss}
        label={overlay.label}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Banner ── */}
        <View style={{ height: BANNER_HEIGHT }}>
          {match.banner_url ? (
            <Image source={{ uri: match.banner_url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.bannerPlaceholder]}>
              <Ionicons name="game-controller-outline" size={52} color={colors.border.default} />
            </View>
          )}
          <LinearGradient
            colors={isDark
              ? ['rgba(0,0,0,0.30)', 'transparent', 'rgba(0,0,0,0.20)']
              : ['rgba(0,0,0,0.18)', 'transparent', 'rgba(0,0,0,0.12)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 10 }]} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + 'EE', top: insets.top + 10 }]}>
            {match.status === 'ongoing' && <View style={styles.livePulse} />}
            <Text style={styles.statusText}>{cfg.label}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* ── Game Tag + Title ── */}
          <View style={styles.titleSection}>
            {match.game ? (
              <View style={styles.gameTagBadge}>
                <Ionicons name="game-controller-outline" size={11} color={colors.primary} />
                <Text style={styles.gameTagText}>{match.game.toUpperCase()}</Text>
              </View>
            ) : null}
            <Text style={styles.matchTitle}>{match.title}</Text>
          </View>

          {/* ── Prize Pool + Entry Fee Hero Card ── */}
          <View style={styles.prizeCard}>
            <View style={styles.prizeSection}>
              <View style={styles.prizeLabelRow}>
                <Ionicons name="trophy" size={13} color={GOLD} />
                <Text style={styles.prizeSectionLabel}>Prize Pool</Text>
              </View>
              <Text style={styles.prizeAmount}>₹{match.prize_pool.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.prizeCardDivider} />
            <View style={styles.prizeSection}>
              <View style={styles.prizeLabelRow}>
                <Ionicons name="ticket-outline" size={13} color={isFree ? colors.status.success : colors.primary} />
                <Text style={styles.prizeSectionLabel}>Entry Fee</Text>
              </View>
              {isFree ? (
                <Text style={[styles.prizeAmount, { color: colors.status.success }]}>FREE</Text>
              ) : (
                <Text style={[styles.prizeAmount, { color: colors.text.primary }]}>₹{match.entry_fee.toLocaleString('en-IN')}</Text>
              )}
            </View>
          </View>

          {/* ── Stats Row ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.statValue}>{match.players_joined}/{match.max_players}</Text>
              <Text style={styles.statLabel}>Players</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.statValue}>
                {match.starts_at ? new Date(match.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD'}
              </Text>
              <Text style={styles.statLabel}>Start Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.statValue}>
                {match.starts_at ? new Date(match.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBD'}
              </Text>
              <Text style={styles.statLabel}>Date</Text>
            </View>
          </View>

          {/* ── Game Mode / Squad Type ── */}
          {(match.game_mode || match.squad_type) && (
            <View style={styles.gameInfoRow}>
              {match.game_mode ? (
                <View style={styles.gameInfoChip}>
                  <Ionicons name="game-controller-outline" size={13} color={colors.primary} />
                  <Text style={styles.gameInfoChipLabel}>Mode</Text>
                  <Text style={styles.gameInfoChipValue}>{match.game_mode}</Text>
                </View>
              ) : null}
              {match.squad_type ? (
                <View style={styles.gameInfoChip}>
                  <Ionicons name="people-outline" size={13} color={colors.primary} />
                  <Text style={styles.gameInfoChipLabel}>Type</Text>
                  <Text style={styles.gameInfoChipValue}>{match.squad_type}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* ── Players & Prize Distribution Buttons ── */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowPlayers(true)} activeOpacity={0.8}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionBtnLabel}>Players</Text>
                <Text style={styles.actionBtnSub}>{match.players_joined} joined</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: GOLD + '55' }]}
              onPress={() => setShowWinners(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy-outline" size={18} color={GOLD} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionBtnLabel, { color: GOLD }]}>
                  {match.status === 'completed' ? 'Winners' : 'Prize Distribution'}
                </Text>
                <Text style={styles.actionBtnSub}>
                  {tiers.length > 0
                    ? `${tiers.length} winner${tiers.length !== 1 ? 's' : ''} · ₹${match.prize_pool.toLocaleString('en-IN')} pool`
                    : `₹${match.prize_pool.toLocaleString('en-IN')} total pool`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          </View>

          {/* ── Slot Meter ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SectionLabel icon="people-circle-outline" title="Player Slots" />
              <View style={[styles.slotBadge, isFull && styles.slotBadgeFull]}>
                <Text style={[styles.slotBadgeText, isFull && { color: colors.status.error }]}>
                  {isFull ? 'Full' : `${match.max_players - match.players_joined} slots left`}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                { width: `${filledPct}%` as any },
                isFull && { backgroundColor: colors.status.error },
                filledPct >= 80 && !isFull && { backgroundColor: colors.status.warning },
              ]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>{match.players_joined} joined</Text>
              <Text style={styles.progressLabelText}>{match.max_players} total</Text>
            </View>
          </View>

          {/* ── Description ── */}
          {match.description && (
            <View style={styles.card}>
              <SectionLabel icon="document-text-outline" title="About This Match" />
              <Text style={styles.bodyText}>{match.description}</Text>
            </View>
          )}

          {/* ── Rules ── */}
          {rules.length > 0 && (
            <View style={styles.card}>
              <SectionLabel icon="shield-checkmark-outline" title="Match Rules" />
              {rules.map((line, i) => (
                <View key={i} style={styles.ruleRow}>
                  <View style={styles.ruleIndex}>
                    <Text style={styles.ruleIndexText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.ruleText}>{line.replace(/^[\d.\-*]+\s*/, '')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Room Credentials ── */}
          {hasJoined && match.room_visible ? (
            <View style={[styles.card, styles.roomCard]}>
              <SectionLabel icon="key-outline" title="Room Credentials" />
              {match.room_id && (
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialLabel}>Room ID</Text>
                  <View style={styles.credentialValueWrap}>
                    <Ionicons name="copy-outline" size={13} color="#555" />
                    <Text style={styles.credentialValue}>{match.room_id}</Text>
                  </View>
                </View>
              )}
              {match.room_password && (
                <View style={[styles.credentialRow, styles.credentialRowBorder]}>
                  <Text style={styles.credentialLabel}>Password</Text>
                  <View style={styles.credentialValueWrap}>
                    <Ionicons name="lock-closed-outline" size={13} color={colors.primary} />
                    <Text style={[styles.credentialValue, { color: colors.primary }]}>{match.room_password}</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (match.status === 'upcoming' || match.status === 'ongoing') ? (
            <View style={styles.infoBox}>
              <View style={styles.infoBoxIcon}>
                <Ionicons name={hasJoined ? 'hourglass-outline' : 'lock-closed-outline'} size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBoxTitle}>
                  {hasJoined ? 'Credentials Pending' : 'Join to Unlock Room'}
                </Text>
                <Text style={styles.infoBoxSub}>
                  {hasJoined
                    ? 'Room details will be shared by the admin before match starts.'
                    : 'Room ID and Password are visible only to participants.'}
                </Text>
              </View>
            </View>
          ) : null}

          {/* ── Watch Live ── */}
          <StreamButtons match={match} />

          {/* ── Winner Card (personal result) ── */}
          {claimResult !== null && (
            <View style={styles.winnerCard}>
              <LinearGradient colors={['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.04)']} style={StyleSheet.absoluteFill} />
              <View style={styles.winnerLeft}>
                <Ionicons name="trophy" size={30} color={GOLD} />
                <View>
                  <Text style={styles.winnerRank}>Rank #{claimResult.rank}</Text>
                  <Text style={styles.winnerPoints}>{claimResult.points} pts earned</Text>
                </View>
              </View>
              {claimResult.prize > 0 && (
                <Text style={styles.winnerPrize}>₹{formatPrize(claimResult.prize)}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Join Button ── */}
      {canJoin && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <TouchableOpacity
            style={[styles.joinBtn, (joining || profileLoading) && styles.disabled]}
            onPress={handleJoinPress}
            disabled={joining || profileLoading}
            activeOpacity={0.85}
          >
            {(joining || profileLoading) ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="flash" size={20} color="#fff" />
                <Text style={styles.joinBtnText}>
                  {isFree ? 'Join for Free' : `Join · ₹${match.entry_fee}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Leave Row ── */}
      {canLeave && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={styles.leaveCtaRow}>
            <View style={styles.joinedSmallBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
              <Text style={styles.joinedSmallText}>You're In</Text>
            </View>
            <TouchableOpacity
              style={[styles.leaveBtn, leaving && styles.disabled]}
              onPress={handleLeave}
              disabled={leaving}
              activeOpacity={0.85}
            >
              {leaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="exit-outline" size={18} color="#fff" />
                  <Text style={styles.leaveBtnText}>Leave</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Claim Prize ── */}
      {showClaimBtn && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <TouchableOpacity
            style={[styles.claimBtn, claimLoading && styles.disabled]}
            onPress={handleClaim}
            disabled={claimLoading}
            activeOpacity={0.85}
          >
            {claimLoading ? <ActivityIndicator color="#000" /> : (
              <>
                <Ionicons name="trophy" size={20} color="#000" />
                <Text style={styles.claimBtnText}>Claim ₹{formatPrize(claimResult?.prize ?? 0)} Prize</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Already Claimed ── */}
      {match.status === 'completed' && hasJoined && alreadyClaimed && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={[styles.joinedBadge, { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.07)' }]}>
            <Ionicons name="checkmark-circle" size={20} color={GOLD} />
            <Text style={[styles.joinedText, { color: GOLD }]}>Prize Claimed</Text>
          </View>
        </View>
      )}

      {/* ═══════════════════════════════════════════════════════
          JOIN CONFIRM MODAL — shows game profile details
      ════════════════════════════════════════════════════════ */}
      <Modal visible={joinConfirmVisible} transparent animationType="fade" onRequestClose={() => setJoinConfirmVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            {/* Header */}
            <View style={styles.dialogHeader}>
              <View style={styles.dialogIconWrap}>
                <Ionicons name="game-controller" size={26} color={colors.primary} />
              </View>
              <Text style={styles.dialogTitle}>Confirm Join</Text>
              <Text style={styles.dialogSubtitle}>Review your details before joining</Text>
            </View>

            {/* Game badge */}
            <View style={styles.dialogGameBadge}>
              <Ionicons name="game-controller-outline" size={13} color={colors.primary} />
              <Text style={styles.dialogGameBadgeText}>{gameProfile?.gameName ?? match.game}</Text>
            </View>

            {/* Profile info */}
            <View style={styles.dialogInfoBlock}>
              <View style={styles.dialogInfoRow}>
                <Text style={styles.dialogInfoLabel}>Username</Text>
                <Text style={styles.dialogInfoValue}>{gameProfile?.username ?? '—'}</Text>
              </View>
              <View style={[styles.dialogInfoRow, { borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
                <Text style={styles.dialogInfoLabel}>In-Game UID</Text>
                <Text style={[styles.dialogInfoValue, { color: colors.primary }]}>{gameProfile?.uid ?? '—'}</Text>
              </View>
              <View style={[styles.dialogInfoRow, { borderTopWidth: 1, borderTopColor: colors.border.subtle }]}>
                <Text style={styles.dialogInfoLabel}>Entry Fee</Text>
                {isFree ? (
                  <Text style={[styles.dialogInfoValue, { color: colors.status.success }]}>FREE</Text>
                ) : (
                  <Text style={[styles.dialogInfoValue, { color: colors.status.error }]}>
                    ₹{match.entry_fee.toLocaleString('en-IN')} will be deducted
                  </Text>
                )}
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.dialogBtnRow}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setJoinConfirmVisible(false)} activeOpacity={0.8}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogConfirmBtn} onPress={handleJoinConfirm} activeOpacity={0.85}>
                <Ionicons name="flash" size={16} color="#fff" />
                <Text style={styles.dialogConfirmText}>{isFree ? 'Join Free' : 'Join & Pay'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          NO PROFILE MODAL — user hasn't added game profile
      ════════════════════════════════════════════════════════ */}
      <Modal visible={noProfileVisible} transparent animationType="fade" onRequestClose={() => setNoProfileVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconWrap, { backgroundColor: colors.status.error + '22' }]}>
                <Ionicons name="alert-circle" size={26} color={colors.status.error} />
              </View>
              <Text style={styles.dialogTitle}>Game Profile Not Found</Text>
              <Text style={styles.dialogSubtitle}>
                You haven't added your {match.game} profile yet. Please add your in-game UID before joining a match.
              </Text>
            </View>

            <View style={styles.dialogBtnRow}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setNoProfileVisible(false)} activeOpacity={0.8}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, { backgroundColor: colors.status.error }]}
                onPress={() => {
                  setNoProfileVisible(false);
                  router.push('/edit-profile');
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="person-add-outline" size={16} color="#fff" />
                <Text style={styles.dialogConfirmText}>Go to Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          LEAVE CONFIRM MODAL — entry fee NOT refunded
      ════════════════════════════════════════════════════════ */}
      <Modal visible={leaveModalVisible} transparent animationType="fade" onRequestClose={() => setLeaveModalVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <View style={styles.dialogHeader}>
              <View style={[styles.dialogIconWrap, { backgroundColor: colors.status.error + '22' }]}>
                <Ionicons name="exit-outline" size={26} color={colors.status.error} />
              </View>
              <Text style={styles.dialogTitle}>Leave Match?</Text>
              <Text style={styles.dialogSubtitle}>
                {match.entry_fee > 0
                  ? `Your entry fee of ₹${match.entry_fee.toLocaleString('en-IN')} will NOT be refunded.\n\nIf you wish to rejoin later, you will need to pay the entry fee again.`
                  : 'Are you sure you want to leave this match?'}
              </Text>
            </View>

            <View style={styles.dialogBtnRow}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setLeaveModalVisible(false)} activeOpacity={0.8}>
                <Text style={styles.dialogCancelText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogConfirmBtn, { backgroundColor: colors.status.error }]}
                onPress={handleLeaveConfirm}
                activeOpacity={0.85}
              >
                <Ionicons name="exit-outline" size={16} color="#fff" />
                <Text style={styles.dialogConfirmText}>Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Players Modal ── */}
      <Modal visible={showPlayers} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPlayers(false)}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.background.dark }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Players ({match.players_joined})</Text>
            <TouchableOpacity onPress={() => setShowPlayers(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
          {playersLoading ? (
            <View style={styles.sheetLoading}><ActivityIndicator color={colors.primary} size="large" /></View>
          ) : players.length === 0 ? (
            <View style={styles.sheetEmpty}>
              <Ionicons name="people-outline" size={44} color="#444" />
              <Text style={styles.sheetEmptyText}>No players have joined yet</Text>
            </View>
          ) : (
            <FlatList
              data={players}
              keyExtractor={item => item.user_id}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.border.subtle, marginLeft: 60 }} />}
              renderItem={({ item, index }) => (
                <View style={styles.playerRow}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>{(item.username?.[0] ?? '?').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.playerName}>{item.username}</Text>
                  <Text style={styles.playerIndex}>#{index + 1}</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          PRIZE DISTRIBUTION / WINNERS MODAL
          • Before completed : prize splits from match_prize_splits
          • After completed  : actual winners from match_results
                               with prize from match_prize_splits
      ════════════════════════════════════════════════════════ */}
      <Modal visible={showWinners} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowWinners(false)}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.background.dark }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: match.status === 'completed' ? GOLD : colors.text.primary }]}>
              {match.status === 'completed' ? '🏆 Winners' : '🏆 Prize Distribution'}
            </Text>
            <TouchableOpacity onPress={() => setShowWinners(false)} style={styles.sheetClose}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* ── BEFORE COMPLETED: Prize Tier Breakdown from match_prize_splits ── */}
          {match.status !== 'completed' && (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>

              {/* Summary header */}
              <View style={styles.prizePoolCard}>
                <Ionicons name="trophy" size={36} color={GOLD} />
                <Text style={styles.prizePoolAmount}>₹{match.prize_pool.toLocaleString('en-IN')}</Text>
                <Text style={styles.prizePoolLabel}>Total Prize Pool</Text>
                {tiers.length > 0 && (
                  <View style={styles.winnerCountBadge}>
                    <Ionicons name="people" size={12} color={GOLD} />
                    <Text style={styles.winnerCountText}>{tiers.length} Winner{tiers.length !== 1 ? 's' : ''}</Text>
                  </View>
                )}
              </View>

              {tiersLoading ? (
                <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} />
              ) : tiers.length > 0 ? (
                <>
                  {tiers.map((tier, idx) => (
                    <View
                      key={tier.rank}
                      style={[
                        styles.tierRow,
                        idx === 0 && { borderTopWidth: 0 },
                      ]}
                    >
                      <View style={styles.tierRankBadge}>
                        <Text style={[
                          styles.tierRankText,
                          tier.rank <= 3 && { color: MEDAL_COLORS[tier.rank - 1] },
                        ]}>
                          {rankMedal(tier.rank)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tierRankLabel}>Rank #{tier.rank}</Text>
                        <Text style={styles.tierRankHint}>
                          {tier.rank === 1 ? 'Champion' : tier.rank === 2 ? 'Runner-up' : tier.rank === 3 ? '3rd Place' : `Position ${tier.rank}`}
                        </Text>
                      </View>
                      <Text style={styles.tierPrize}>₹{formatPrize(tier.prize_amount)}</Text>
                    </View>
                  ))}

                  <View style={styles.prizeInfoRow}>
                    <Ionicons name="information-circle-outline" size={14} color={colors.text.muted} />
                    <Text style={styles.prizeInfoText}>
                      Prizes are credited after match results are published by admin
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.sheetEmpty}>
                  <Ionicons name="trophy-outline" size={40} color="#444" />
                  <Text style={styles.sheetEmptyText}>Prize breakdown not set yet</Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* ── AFTER COMPLETED: Winners from match_results + prize from match_prize_splits ── */}
          {match.status === 'completed' && (
            winnersLoading ? (
              <View style={styles.sheetLoading}><ActivityIndicator color={GOLD} size="large" /></View>
            ) : winners.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <Ionicons name="trophy-outline" size={44} color="#444" />
                <Text style={styles.sheetEmptyText}>Results not published yet</Text>
              </View>
            ) : (
              <FlatList
                data={winners}
                keyExtractor={item => item.user_id}
                ListHeaderComponent={() => (
                  <View style={styles.prizePoolCard}>
                    <Ionicons name="trophy" size={28} color={GOLD} />
                    <Text style={[styles.prizePoolAmount, { fontSize: 20 }]}>
                      {winners.length} Winner{winners.length !== 1 ? 's' : ''}
                    </Text>
                    <Text style={styles.prizePoolLabel}>₹{match.prize_pool.toLocaleString('en-IN')} total pool</Text>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingHorizontal: 16 }}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: colors.border.subtle, marginLeft: 68 }} />
                )}
                renderItem={({ item }) => (
                  <View style={styles.winnerRow}>
                    <View style={styles.winnerRankBadge}>
                      <Text style={[
                        styles.winnerRowRank,
                        item.rank <= 3 && { color: MEDAL_COLORS[item.rank - 1] },
                      ]}>
                        {item.rank <= 3 ? rankMedal(item.rank) : `#${item.rank}`}
                      </Text>
                    </View>
                    <View style={styles.winnerAvatarWrap}>
                      <AvatarSVG index={item.avatar_index} size={40} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerName}>{item.username}</Text>
                      <Text style={styles.winnerRowPts}>{item.kills} kills · {item.points} pts</Text>
                    </View>
                    {item.prize > 0 ? (
                      <View style={styles.winnerPrizeBadge}>
                        <Text style={styles.winnerRowPrize}>₹{formatPrize(item.prize)}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              />
            )
          )}
        </View>
      </Modal>
    </View>
  );
}

/* ─── Stream Buttons ────────────────────────────────────────────────────── */
const PLATFORMS = [
  { key: 'youtube_url' as const,  label: 'YouTube',  icon: 'logo-youtube'  as const, bg: '#FF0000', iconColor: '#fff' },
  { key: 'twitch_url' as const,   label: 'Twitch',   icon: 'logo-twitch'   as const, bg: '#9146FF', iconColor: '#fff' },
  { key: 'facebook_url' as const, label: 'Facebook', icon: 'logo-facebook' as const, bg: '#1877F2', iconColor: '#fff' },
  { key: 'tiktok_url' as const,   label: 'TikTok',   icon: 'logo-tiktok'   as const, bg: '#010101', iconColor: '#fff' },
] as const;

function StreamButtons({ match }: { match: NonNullable<ReturnType<typeof useMatchDetail>['match']> }) {
  const { colors: sc } = useTheme();
  const active = PLATFORMS.filter(p => !!match[p.key]);
  if (active.length === 0) return null;
  return (
    <View style={streamStyles.wrapper}>
      <View style={streamStyles.labelRow}>
        <Ionicons name="radio-outline" size={14} color={sc.primary} />
        <Text style={[streamStyles.label, { color: sc.primary }]}>WATCH LIVE</Text>
      </View>
      <View style={streamStyles.row}>
        {active.map(p => (
          <TouchableOpacity key={p.key} style={[streamStyles.btn, { flex: 1, backgroundColor: p.bg }]} onPress={() => Linking.openURL(match[p.key]!)} activeOpacity={0.82}>
            <Ionicons name={p.icon} size={22} color={p.iconColor} />
            <Text style={streamStyles.btnLabel}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const streamStyles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label:    { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 1.5 },
  row:      { flexDirection: 'row', gap: 10 },
  btn:      { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0 },
  btnLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },
});

/* ─── Styles ─────────────────────────────────────────────────────────────── */
function createStyles(colors: AppColors) {
  const SUCCESS = colors.status.success;
  const ERROR   = colors.status.error;

  return StyleSheet.create({
    container:         { flex: 1, backgroundColor: colors.background.dark },
    centered:          { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: colors.background.dark },
    bannerPlaceholder: { backgroundColor: colors.background.dark, alignItems: 'center', justifyContent: 'center' },

    backBtn: {
      position: 'absolute', left: 14, zIndex: 10,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center', justifyContent: 'center',
    },
    statusBadge: {
      position: 'absolute', right: 14, zIndex: 10,
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5,
    },
    livePulse:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
    statusText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

    body: { paddingHorizontal: 16, paddingTop: 16 },

    titleSection: { marginBottom: 16, gap: 8 },
    gameTagBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
      backgroundColor: colors.background.card,
      borderWidth: 1, borderColor: colors.primary + '55',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    },
    gameTagText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.primary, letterSpacing: 1.5 },
    matchTitle:  { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary, lineHeight: 30 },

    prizeCard: {
      flexDirection: 'row',
      backgroundColor: colors.background.card,
      borderRadius: 16, borderWidth: 1, borderColor: colors.border.default,
      marginBottom: 14, overflow: 'hidden',
    },
    prizeSection:      { flex: 1, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' },
    prizeLabelRow:     { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7 },
    prizeSectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
    prizeAmount:       { fontSize: 26, fontFamily: 'Inter_700Bold', color: GOLD, letterSpacing: -0.5, textAlign: 'center' },
    prizeCardDivider:  { width: 1, backgroundColor: colors.border.default, marginVertical: 14 },

    statsRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 14, paddingVertical: 14,
      borderWidth: 1, borderColor: colors.border.default,
      marginBottom: 14,
    },
    statCell:    { flex: 1, alignItems: 'center', gap: 4 },
    statDivider: { width: 1, height: 34, backgroundColor: colors.border.default },
    statValue:   { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    statLabel:   { fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.6 },

    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: colors.border.default,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },

    slotBadge:     { backgroundColor: colors.primary + '1F', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    slotBadgeFull: { backgroundColor: ERROR + '26' },
    slotBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary },
    progressTrack: { height: 7, backgroundColor: colors.border.default, borderRadius: 4, overflow: 'hidden' },
    progressFill:  { height: 7, backgroundColor: colors.primary, borderRadius: 4 },
    progressLabels:    { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
    progressLabelText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    bodyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.secondary, lineHeight: 22 },

    ruleRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 10 },
    ruleIndex:    { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary + '26', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    ruleIndexText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary },
    ruleText:      { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.secondary, lineHeight: 21 },

    roomCard:            { borderColor: colors.primary + '40' },
    credentialRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    credentialRowBorder: { borderTopWidth: 1, borderTopColor: colors.border.default, marginTop: 10, paddingTop: 10 },
    credentialLabel:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    credentialValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    credentialValue:     { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary, letterSpacing: 1.2 },

    infoBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      backgroundColor: 'rgba(245,158,11,0.07)',
      borderRadius: 14, padding: 14, marginBottom: 12,
      borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)',
    },
    infoBoxIcon:  { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    infoBoxTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#F59E0B', marginBottom: 3 },
    infoBoxSub:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, lineHeight: 18 },

    winnerCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 14, padding: 18, marginBottom: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
      backgroundColor: colors.background.card,
    },
    winnerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
    winnerRank:   { fontSize: 17, fontFamily: 'Inter_700Bold', color: GOLD },
    winnerPoints: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },
    winnerPrize:  { fontSize: 24, fontFamily: 'Inter_700Bold', color: SUCCESS },

    cta: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 16, paddingTop: 10,
      backgroundColor: colors.background.dark + 'F5',
      borderTopWidth: 1, borderTopColor: colors.border.subtle,
    },
    joinBtn:     { backgroundColor: SUCCESS, borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    joinBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

    leaveCtaRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
    joinedSmallBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, backgroundColor: SUCCESS + '14', borderRadius: 12, paddingHorizontal: 12, height: 52, borderWidth: 1, borderColor: SUCCESS + '33' },
    joinedSmallText:  { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: SUCCESS },

    leaveBtn:     { backgroundColor: ERROR, borderRadius: 12, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22 },
    leaveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

    joinedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SUCCESS + '14', borderRadius: 14, height: 52, borderWidth: 1, borderColor: SUCCESS + '38' },
    joinedText:  { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: SUCCESS },

    claimBtn:     { backgroundColor: GOLD, borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    claimBtnText: { color: '#000', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

    disabled: { opacity: 0.55 },

    emptyTitle:   { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: colors.text.muted },
    backLink:     { paddingHorizontal: 24, paddingVertical: 10 },
    backLinkText: { color: colors.primary, fontSize: 14, fontFamily: 'Inter_600SemiBold' },

    gameInfoRow: { flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' },
    gameInfoChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.background.card, borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '40', paddingHorizontal: 12, paddingVertical: 8, flexShrink: 1 },
    gameInfoChipLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 },
    gameInfoChipValue: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.primary },

    actionRow: { gap: 10, marginBottom: 14 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border.default, paddingHorizontal: 16, paddingVertical: 14 },
    actionBtnLabel: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    actionBtnSub:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 1 },

    sheetContainer: { flex: 1 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#444', alignSelf: 'center', marginTop: 10, marginBottom: 4 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border.default },
    sheetTitle:  { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    sheetClose:  { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center' },
    sheetLoading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    sheetEmpty:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    sheetEmptyText: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    playerRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    playerAvatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '44', alignItems: 'center', justifyContent: 'center' },
    playerAvatarText:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.primary },
    playerName:      { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    playerIndex:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    winnerRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
    winnerRankBadge:  { width: 36, alignItems: 'center' },
    winnerRowRank:    { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.muted },
    winnerAvatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.background.card },
    winnerRowPts:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },
    winnerPrizeBadge: { backgroundColor: SUCCESS + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: SUCCESS + '40' },
    winnerRowPrize:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: SUCCESS },

    prizePoolCard:  { alignItems: 'center', paddingVertical: 20, gap: 6, marginBottom: 8 },
    prizePoolAmount:{ fontSize: 28, fontFamily: 'Inter_700Bold', color: GOLD },
    prizePoolLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    winnerCountBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4,
      backgroundColor: GOLD + '18', borderRadius: 20,
      paddingHorizontal: 12, paddingVertical: 5,
      borderWidth: 1, borderColor: GOLD + '44',
    },
    winnerCountText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: GOLD },

    tierRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
    },
    tierRankBadge: { width: 42, alignItems: 'center' },
    tierRankText:  { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.muted },
    tierRankLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    tierRankHint:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },
    tierPrize:     { fontSize: 20, fontFamily: 'Inter_700Bold', color: SUCCESS },

    prizeInfoRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 16, opacity: 0.65 },
    prizeInfoText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, lineHeight: 18 },

    // ── Dialog modals ──
    dialogOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
    },
    dialogBox: {
      width: '100%', backgroundColor: colors.background.card,
      borderRadius: 20, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border.default,
    },
    dialogHeader: { alignItems: 'center', paddingTop: 28, paddingHorizontal: 20, paddingBottom: 18, gap: 8 },
    dialogIconWrap: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: colors.primary + '22',
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    dialogTitle:    { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary, textAlign: 'center' },
    dialogSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },

    dialogGameBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center',
      backgroundColor: colors.primary + '18',
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
      marginBottom: 16,
      borderWidth: 1, borderColor: colors.primary + '44',
    },
    dialogGameBadgeText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.primary, letterSpacing: 1 },

    dialogInfoBlock: { marginHorizontal: 16, marginBottom: 20, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.background.dark, borderWidth: 1, borderColor: colors.border.subtle },
    dialogInfoRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
    dialogInfoLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    dialogInfoValue: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.text.primary, maxWidth: '60%', textAlign: 'right' },

    dialogBtnRow: {
      flexDirection: 'row', gap: 10,
      borderTopWidth: 1, borderTopColor: colors.border.subtle,
      padding: 16,
    },
    dialogCancelBtn:  { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
    dialogCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    dialogConfirmBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    dialogConfirmText:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  });
}
