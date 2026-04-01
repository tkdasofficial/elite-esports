import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Platform, BackHandler,
  ActivityIndicator, Linking,
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
import { useMatchDetail } from '@/features/match/hooks/useMatchDetail';
import { AdLoadingOverlay } from '@/components/AdLoadingOverlay';
import { useAdGate } from '@/hooks/useAdGate';
import { useAds } from '@/store/AdContext';
import { supabase } from '@/services/supabase';
import { useWallet } from '@/store/WalletContext';
import type { AppColors } from '@/utils/colors';

const BANNER_HEIGHT = 240;
const PRIMARY = '#EE3D2D';
const GREEN   = '#22C55E';
const RED     = '#EF4444';
const GOLD    = '#FFD700';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function SectionLabel({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 13 }}>
      <Ionicons name={icon} size={14} color={PRIMARY} />
      <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: PRIMARY, textTransform: 'uppercase', letterSpacing: 1.5 }}>
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
  const { match, loading, hasJoined, joining, joinMatch } = useMatchDetail(id, user?.id);
  const { adConfig, setInLiveMatch } = useAds();
  const { gateAction, overlay, dismiss } = useAdGate();
  const { colors }               = useTheme();
  const styles                   = useMemo(() => createStyles(colors), [colors]);

  const [claimLoading,   setClaimLoading]   = useState(false);
  const [claimResult,    setClaimResult]    = useState<{ rank: number; points: number; prize: number } | null>(null);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  const bottomPad = insets.bottom + (Platform.OS === 'web' ? 34 : 0);
  const isLive    = match?.status === 'ongoing';

  useEffect(() => {
    if (isLive && hasJoined) {
      setInLiveMatch(true);
      return () => setInLiveMatch(false);
    }
  }, [isLive, hasJoined, setInLiveMatch]);

  useEffect(() => {
    if (!user || match?.status !== 'completed') return;
    (async () => {
      const { data } = await supabase
        .from('match_results')
        .select('rank, points')
        .eq('match_id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        const pool  = match?.prize_pool ?? 0;
        const prize = data.rank === 1 ? pool * 0.5
                    : data.rank === 2 ? pool * 0.3
                    : data.rank === 3 ? pool * 0.1
                    : 0;
        setClaimResult({ rank: data.rank, points: data.points, prize });
        const { data: txn } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('reference_id', `result:${id}`)
          .eq('user_id', user.id)
          .maybeSingle();
        setAlreadyClaimed(!!txn);
      }
    })();
  }, [id, user, match?.status, match?.prize_pool]);

  useEffect(() => {
    if (!isLive || !hasJoined) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      gateAction(adConfig.leave, () => router.back(), 'Loading Ad...');
      return true;
    });
    return () => handler.remove();
  }, [isLive, hasJoined, adConfig.leave, gateAction]);

  const handleJoin = useCallback(() => {
    gateAction(adConfig.join, async () => {
      const { error } = await joinMatch();
      if (error) Alert.alert('Error', error.message);
      else Alert.alert('Joined!', 'You have successfully joined this match.');
    }, 'Loading Ad...');
  }, [adConfig.join, gateAction, joinMatch]);

  const handleLeave = useCallback(() => {
    Alert.alert(
      'Leave Match',
      'Are you sure you want to leave this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => gateAction(adConfig.leave, () => router.back(), 'Loading Ad...'),
        },
      ]
    );
  }, [adConfig.leave, gateAction]);

  const handleClaim = useCallback(() => {
    if (!claimResult || claimResult.prize <= 0 || !user) return;
    gateAction(adConfig.reward, async () => {
      setClaimLoading(true);
      const { error } = await supabase.from('wallet_transactions').insert({
        user_id:      user.id,
        type:         'credit',
        amount:       claimResult.prize,
        status:       'approved',
        reference_id: `result:${id}`,
      });
      if (!error) {
        await refreshWallet();
        setAlreadyClaimed(true);
        Alert.alert('🏆 Prize Claimed!', `₹${claimResult.prize.toFixed(2)} has been added to your wallet.`);
      } else {
        Alert.alert('Error', error.message);
      }
      setClaimLoading(false);
    }, 'Loading Reward Ad...');
  }, [claimResult, user, adConfig.reward, gateAction, id, refreshWallet]);

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

  const cfg           = STATUS_CONFIG[match.status];
  const isFree        = match.entry_fee === 0;
  const isFull        = match.players_joined >= match.max_players;
  const canJoin       = match.status === 'upcoming' && !isFull && !hasJoined;
  const showLeaveBtn  = isLive && hasJoined;
  const showClaimBtn  = match.status === 'completed' && hasJoined && claimResult !== null && claimResult.prize > 0 && !alreadyClaimed;
  const filledPct     = Math.min((match.players_joined / match.max_players) * 100, 100);
  const rules         = match.rules ? match.rules.split('\n').filter(l => l.trim()) : [];

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
            <Image
              source={{ uri: match.banner_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.bannerPlaceholder]}>
              <Ionicons name="game-controller-outline" size={52} color="#2A2A2A" />
            </View>
          )}

          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.80)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + 'EE', top: insets.top + 10 }]}>
            {match.status === 'ongoing' && <View style={styles.livePulse} />}
            <Text style={styles.statusText}>{cfg.label}</Text>
          </View>

          {/* Game + Title on banner */}
          <View style={styles.bannerFooter}>
            {match.game ? (
              <Text style={styles.bannerGame}>{match.game.toUpperCase()}</Text>
            ) : null}
            <Text style={styles.bannerTitle} numberOfLines={2}>{match.title}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* ── Prize Pool + Entry Fee Hero Card ── */}
          <View style={styles.prizeCard}>
            {/* Prize Pool */}
            <View style={styles.prizeSection}>
              <View style={styles.prizeLabelRow}>
                <Ionicons name="trophy" size={13} color={GOLD} />
                <Text style={styles.prizeSectionLabel}>Prize Pool</Text>
              </View>
              <Text style={styles.prizeAmount}>₹{match.prize_pool.toLocaleString('en-IN')}</Text>
            </View>

            {/* Divider */}
            <View style={styles.prizeCardDivider} />

            {/* Entry Fee */}
            <View style={styles.prizeSection}>
              <View style={styles.prizeLabelRow}>
                <Ionicons name="ticket-outline" size={13} color={isFree ? GREEN : PRIMARY} />
                <Text style={styles.prizeSectionLabel}>Entry Fee</Text>
              </View>
              {isFree ? (
                <Text style={[styles.prizeAmount, { color: GREEN }]}>FREE</Text>
              ) : (
                <Text style={[styles.prizeAmount, { color: '#FFFFFF' }]}>
                  ₹{match.entry_fee.toLocaleString('en-IN')}
                </Text>
              )}
            </View>
          </View>

          {/* ── Stats Row (Players + Time) ── */}
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
                {match.starts_at
                  ? new Date(match.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                  : 'TBD'}
              </Text>
              <Text style={styles.statLabel}>Start Time</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.statValue}>
                {match.starts_at
                  ? new Date(match.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  : 'TBD'}
              </Text>
              <Text style={styles.statLabel}>Date</Text>
            </View>
          </View>

          {/* ── Slot Meter ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SectionLabel icon="people-circle-outline" title="Player Slots" />
              <View style={[styles.slotBadge, isFull && styles.slotBadgeFull]}>
                <Text style={[styles.slotBadgeText, isFull && { color: RED }]}>
                  {isFull ? 'Full' : `${match.max_players - match.players_joined} slots left`}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                { width: `${filledPct}%` as any },
                isFull && { backgroundColor: RED },
                filledPct >= 80 && !isFull && { backgroundColor: '#F59E0B' },
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
                  <Text style={styles.ruleText}>{line.replace(/^[\d\.\-\*]+\s*/, '')}</Text>
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
                    <Ionicons name="lock-closed-outline" size={13} color={PRIMARY} />
                    <Text style={[styles.credentialValue, { color: PRIMARY }]}>{match.room_password}</Text>
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

          {/* ── Watch Live — Platform Buttons ── */}
          <StreamButtons match={match} />

          {/* ── Winner Card ── */}
          {claimResult !== null && (
            <View style={styles.winnerCard}>
              <LinearGradient
                colors={['rgba(255,215,0,0.12)', 'rgba(255,215,0,0.04)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.winnerLeft}>
                <Ionicons name="trophy" size={30} color={GOLD} />
                <View>
                  <Text style={styles.winnerRank}>Rank #{claimResult.rank}</Text>
                  <Text style={styles.winnerPoints}>{claimResult.points} pts earned</Text>
                </View>
              </View>
              {claimResult.prize > 0 && (
                <Text style={styles.winnerPrize}>₹{claimResult.prize.toFixed(0)}</Text>
              )}
            </View>
          )}

        </View>
      </ScrollView>

      {/* ── Floating CTAs ── */}

      {/* Join Match */}
      {canJoin && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <TouchableOpacity
            style={[styles.joinBtn, joining && styles.disabled]}
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.85}
          >
            {joining ? <ActivityIndicator color="#fff" /> : (
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

      {/* Leave Match (live + joined) */}
      {showLeaveBtn && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={styles.leaveCtaRow}>
            <View style={styles.joinedSmallBadge}>
              <Ionicons name="checkmark-circle" size={16} color={GREEN} />
              <Text style={styles.joinedSmallText}>You're In</Text>
            </View>
            <TouchableOpacity
              style={styles.leaveBtn}
              onPress={handleLeave}
              activeOpacity={0.85}
            >
              <Ionicons name="exit-outline" size={18} color="#fff" />
              <Text style={styles.leaveBtnText}>Leave Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Registered but not live */}
      {hasJoined && !showLeaveBtn && !showClaimBtn && match.status !== 'completed' && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={GREEN} />
            <Text style={styles.joinedText}>You're registered for this match</Text>
          </View>
        </View>
      )}

      {/* Claim prize */}
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
                <Text style={styles.claimBtnText}>Claim ₹{claimResult?.prize.toFixed(0)} Prize</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Already claimed */}
      {match.status === 'completed' && hasJoined && alreadyClaimed && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={[styles.joinedBadge, { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.07)' }]}>
            <Ionicons name="checkmark-circle" size={20} color={GOLD} />
            <Text style={[styles.joinedText, { color: GOLD }]}>Prize Claimed</Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stream Platform Buttons
───────────────────────────────────────────────────────────── */

const PLATFORMS = [
  {
    key: 'youtube_url' as const,
    label: 'YouTube',
    icon: 'logo-youtube' as const,
    bg: '#FF0000',
    iconColor: '#fff',
  },
  {
    key: 'twitch_url' as const,
    label: 'Twitch',
    icon: 'logo-twitch' as const,
    bg: '#9146FF',
    iconColor: '#fff',
  },
  {
    key: 'facebook_url' as const,
    label: 'Facebook',
    icon: 'logo-facebook' as const,
    bg: '#1877F2',
    iconColor: '#fff',
  },
  {
    key: 'tiktok_url' as const,
    label: 'TikTok',
    icon: 'logo-tiktok' as const,
    bg: '#010101',
    iconColor: '#fff',
  },
] as const;

function StreamButtons({ match }: { match: NonNullable<ReturnType<typeof useMatchDetail>['match']> }) {
  const active = PLATFORMS.filter(p => !!match[p.key]);
  if (active.length === 0) return null;

  return (
    <View style={streamStyles.wrapper}>
      <View style={streamStyles.labelRow}>
        <Ionicons name="radio-outline" size={14} color={PRIMARY} />
        <Text style={streamStyles.label}>WATCH LIVE</Text>
      </View>
      <View style={streamStyles.row}>
        {active.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[streamStyles.btn, { flex: 1, backgroundColor: p.bg }]}
            onPress={() => Linking.openURL(match[p.key]!)}
            activeOpacity={0.82}
          >
            <Ionicons name={p.icon} size={22} color={p.iconColor} />
            <Text style={streamStyles.btnLabel}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const streamStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 10,
  },
  label: {
    fontSize: 11, fontFamily: 'Inter_700Bold',
    color: PRIMARY, letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row', gap: 10,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    gap: 6,
    minWidth: 0,
  },
  btnLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold',
    color: '#fff', letterSpacing: 0.3,
  },
});

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: '#0A0A0A' },
    centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#0A0A0A' },
    bannerPlaceholder: {
      backgroundColor: '#0F0F0F', alignItems: 'center', justifyContent: 'center',
    },

    /* Back button */
    backBtn: {
      position: 'absolute', left: 14, zIndex: 10,
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center', justifyContent: 'center',
    },

    /* Status badge */
    statusBadge: {
      position: 'absolute', right: 14, zIndex: 10,
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5,
    },
    livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
    statusText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

    /* Banner footer (game + title) */
    bannerFooter: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 16, paddingBottom: 14, paddingTop: 24,
    },
    bannerGame: {
      fontSize: 10, fontFamily: 'Inter_700Bold',
      color: PRIMARY, letterSpacing: 2, marginBottom: 4,
    },
    bannerTitle: {
      fontSize: 20, fontFamily: 'Inter_700Bold',
      color: '#FFFFFF', lineHeight: 26,
    },

    /* Body */
    body: { paddingHorizontal: 16, paddingTop: 16 },

    /* ── Prize + Fee Hero Card ── */
    prizeCard: {
      flexDirection: 'row',
      backgroundColor: '#141414',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#242424',
      marginBottom: 14,
      overflow: 'hidden',
    },
    prizeSection: {
      flex: 1, paddingVertical: 18, paddingHorizontal: 16,
      alignItems: 'center',
    },
    prizeLabelRow: {
      flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 7,
    },
    prizeSectionLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: '#666', textTransform: 'uppercase', letterSpacing: 0.8,
    },
    prizeAmount: {
      fontSize: 26, fontFamily: 'Inter_700Bold',
      color: GOLD, letterSpacing: -0.5, textAlign: 'center',
    },
    prizeCardDivider: {
      width: 1, backgroundColor: '#242424',
      marginVertical: 14,
    },

    /* Stats row */
    statsRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: '#111',
      borderRadius: 14, paddingVertical: 14,
      borderWidth: 1, borderColor: '#1E1E1E',
      marginBottom: 14,
    },
    statCell: {
      flex: 1, alignItems: 'center', gap: 4,
    },
    statDivider: { width: 1, height: 34, backgroundColor: '#1E1E1E' },
    statValue: {
      fontSize: 14, fontFamily: 'Inter_700Bold', color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 10, fontFamily: 'Inter_400Regular',
      color: '#555', textTransform: 'uppercase', letterSpacing: 0.6,
    },

    /* Generic card */
    card: {
      backgroundColor: '#111',
      borderRadius: 16, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: '#1E1E1E',
    },
    cardHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 4,
    },

    /* Slot meter */
    slotBadge: {
      backgroundColor: 'rgba(238,61,45,0.12)',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    slotBadgeFull: { backgroundColor: 'rgba(239,68,68,0.15)' },
    slotBadgeText: {
      fontSize: 11, fontFamily: 'Inter_700Bold', color: PRIMARY,
    },
    progressTrack: {
      height: 7, backgroundColor: '#1E1E1E', borderRadius: 4, overflow: 'hidden',
    },
    progressFill: { height: 7, backgroundColor: PRIMARY, borderRadius: 4 },
    progressLabels: {
      flexDirection: 'row', justifyContent: 'space-between', marginTop: 7,
    },
    progressLabelText: {
      fontSize: 11, fontFamily: 'Inter_400Regular', color: '#555',
    },

    /* Text */
    bodyText: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: '#999', lineHeight: 22,
    },

    /* Rules */
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 10 },
    ruleIndex: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: 'rgba(238,61,45,0.15)',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
    },
    ruleIndexText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: PRIMARY },
    ruleText: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular',
      color: '#999', lineHeight: 21,
    },

    /* Room credentials */
    roomCard: { borderColor: 'rgba(238,61,45,0.25)' },
    credentialRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    credentialRowBorder: {
      borderTopWidth: 1, borderTopColor: '#1E1E1E', marginTop: 10, paddingTop: 10,
    },
    credentialLabel: {
      fontSize: 12, fontFamily: 'Inter_400Regular', color: '#555',
    },
    credentialValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    credentialValue: {
      fontSize: 15, fontFamily: 'Inter_700Bold',
      color: '#FFFFFF', letterSpacing: 1.2,
    },

    /* Info box */
    infoBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 12,
      backgroundColor: 'rgba(245,158,11,0.07)',
      borderRadius: 14, padding: 14, marginBottom: 12,
      borderWidth: 1, borderColor: 'rgba(245,158,11,0.18)',
    },
    infoBoxIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: 'rgba(245,158,11,0.12)',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    infoBoxTitle: {
      fontSize: 13, fontFamily: 'Inter_600SemiBold',
      color: '#F59E0B', marginBottom: 3,
    },
    infoBoxSub: {
      fontSize: 12, fontFamily: 'Inter_400Regular',
      color: '#666', lineHeight: 18,
    },

    /* Winner card */
    winnerCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 14, padding: 18, marginBottom: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)',
      backgroundColor: '#111',
    },
    winnerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
    winnerRank:   { fontSize: 17, fontFamily: 'Inter_700Bold', color: GOLD },
    winnerPoints: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#555', marginTop: 2 },
    winnerPrize:  { fontSize: 24, fontFamily: 'Inter_700Bold', color: GREEN },

    /* CTA bar */
    cta: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 16, paddingTop: 10,
      backgroundColor: '#0A0A0AF5',
      borderTopWidth: 1, borderTopColor: '#1A1A1A',
    },

    /* Join button — GREEN */
    joinBtn: {
      backgroundColor: GREEN, borderRadius: 14, height: 52,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    joinBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

    /* Leave row */
    leaveCtaRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    joinedSmallBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      flex: 1, backgroundColor: 'rgba(34,197,94,0.08)',
      borderRadius: 12, paddingHorizontal: 12, height: 52,
      borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
    },
    joinedSmallText: {
      fontSize: 14, fontFamily: 'Inter_600SemiBold', color: GREEN,
    },

    /* Leave button — RED */
    leaveBtn: {
      backgroundColor: RED, borderRadius: 12, height: 52,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingHorizontal: 22,
    },
    leaveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

    /* Joined badge */
    joinedBadge: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 14, height: 52,
      borderWidth: 1, borderColor: 'rgba(34,197,94,0.22)',
    },
    joinedText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: GREEN },

    /* Claim button */
    claimBtn: {
      backgroundColor: GOLD, borderRadius: 14, height: 52,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    claimBtnText: { color: '#000', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },

    disabled: { opacity: 0.55 },

    emptyTitle:  { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: '#555' },
    backLink:    { paddingHorizontal: 24, paddingVertical: 10 },
    backLinkText: { color: PRIMARY, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  });
}
