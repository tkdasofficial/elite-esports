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

const BANNER_HEIGHT = 260;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function SectionLabel({ icon, title, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; colors: AppColors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.primary, textTransform: 'uppercase', letterSpacing: 1.4 }}>
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
    gateAction(adConfig.leave, () => router.back(), 'Loading Ad...');
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
          <SkeletonBar width="100%" height={80} radius={14} />
          <SkeletonBar width="100%" height={56} radius={14} />
          <SkeletonBar width="100%" height={56} radius={14} />
          <SkeletonBar width="100%" height={56} radius={14} />
        </View>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.text.muted} />
        <Text style={styles.emptyTitle}>Match Not Found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink} activeOpacity={0.7}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cfg      = STATUS_CONFIG[match.status];
  const isFull   = match.players_joined >= match.max_players;
  const canJoin  = match.status === 'upcoming' && !isFull && !hasJoined;
  const showLeaveBtn = isLive && hasJoined;
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
        contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
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
              <Ionicons name="game-controller-outline" size={52} color="#333" />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', colors.background.dark]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 10 }]}
            onPress={showLeaveBtn ? handleLeave : () => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>

          {/* Status badge */}
          <View style={[styles.statusBadge, { backgroundColor: cfg.color + 'EE', top: insets.top + 10 }]}>
            {match.status === 'ongoing' && <View style={styles.livePulse} />}
            <Text style={styles.statusText}>{cfg.label}</Text>
          </View>

          {/* Prize pool hero strip at bottom of banner */}
          <View style={styles.prizeHero}>
            <Text style={styles.prizeHeroLabel}>Prize Pool</Text>
            <Text style={styles.prizeHeroValue}>₹{match.prize_pool.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Game tag + Title */}
          <Text style={styles.gameTag}>{match.game}</Text>
          <Text style={styles.matchTitle}>{match.title}</Text>

          {/* ── Key Stats Row ── */}
          <View style={styles.statsRow}>
            <StatPill icon="ticket-outline" label="Entry" value={match.entry_fee === 0 ? 'Free' : `₹${match.entry_fee}`} colors={colors} accent={false} />
            <View style={styles.statDivider} />
            <StatPill icon="people-outline" label="Players" value={`${match.players_joined}/${match.max_players}`} colors={colors} accent={false} />
            <View style={styles.statDivider} />
            <StatPill icon="time-outline" label="Starts" value={match.starts_at ? new Date(match.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD'} colors={colors} accent={false} />
          </View>

          {/* ── Full date row ── */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.muted} />
            <Text style={styles.dateText}>
              {match.starts_at ? formatDate(match.starts_at) : 'Schedule TBD'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* ── Slot Meter ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <SectionLabel icon="people-circle-outline" title="Player Slots" colors={colors} />
              <View style={[styles.slotBadge, isFull && styles.slotBadgeFull]}>
                <Text style={[styles.slotBadgeText, isFull && styles.slotBadgeTextFull]}>
                  {isFull ? 'Full' : `${match.max_players - match.players_joined} left`}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${filledPct}%` as any }, isFull && { backgroundColor: colors.status.error }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelText}>{match.players_joined} joined</Text>
              <Text style={styles.progressLabelText}>{match.max_players} total</Text>
            </View>
          </View>

          {/* ── Description ── */}
          {match.description && (
            <View style={styles.card}>
              <SectionLabel icon="document-text-outline" title="About This Match" colors={colors} />
              <Text style={styles.bodyText}>{match.description}</Text>
            </View>
          )}

          {/* ── Rules ── */}
          {rules.length > 0 && (
            <View style={styles.card}>
              <SectionLabel icon="shield-checkmark-outline" title="Match Rules" colors={colors} />
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

          {/* ── Room / Credentials ── */}
          {hasJoined && match.room_visible ? (
            <View style={[styles.card, styles.roomCard]}>
              <SectionLabel icon="key-outline" title="Room Credentials" colors={colors} />
              {match.room_id && (
                <View style={styles.credentialRow}>
                  <Text style={styles.credentialLabel}>Room ID</Text>
                  <View style={styles.credentialValueWrap}>
                    <Ionicons name="copy-outline" size={13} color={colors.text.muted} />
                    <Text style={styles.credentialValue}>{match.room_id}</Text>
                  </View>
                </View>
              )}
              {match.room_password && (
                <View style={[styles.credentialRow, { borderTopWidth: 1, borderTopColor: colors.border.subtle, marginTop: 10, paddingTop: 10 }]}>
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
                <Ionicons name={hasJoined ? 'hourglass-outline' : 'lock-closed-outline'} size={20} color={colors.status.warning} />
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
          {match.stream_url && (
            <TouchableOpacity
              style={styles.watchLiveBtn}
              onPress={() => Linking.openURL(match.stream_url!)}
              activeOpacity={0.85}
            >
              <View style={styles.watchLiveLeft}>
                <Ionicons name="logo-youtube" size={22} color="#fff" />
                <View>
                  <Text style={styles.watchLiveTitle}>Watch Live Stream</Text>
                  <Text style={styles.watchLiveSub}>Tap to open stream</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}

          {/* ── Winner Card ── */}
          {claimResult !== null && (
            <View style={styles.winnerCard}>
              <LinearGradient
                colors={['rgba(255,215,0,0.15)', 'rgba(255,215,0,0.05)']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.winnerLeft}>
                <Ionicons name="trophy" size={32} color="#FFD700" />
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

      {/* ── Floating CTA ── */}
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
                <Ionicons name="flash-outline" size={20} color="#fff" />
                <Text style={styles.joinBtnText}>
                  {match.entry_fee === 0 ? 'Join for Free' : `Join for ₹${match.entry_fee}`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasJoined && !showClaimBtn && match.status !== 'completed' && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
            <Text style={styles.joinedText}>You're registered for this match</Text>
          </View>
        </View>
      )}

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

      {match.status === 'completed' && hasJoined && alreadyClaimed && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={[styles.joinedBadge, { borderColor: 'rgba(255,215,0,0.3)', backgroundColor: 'rgba(255,215,0,0.07)' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
            <Text style={[styles.joinedText, { color: '#FFD700' }]}>Prize Claimed</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function StatPill({ icon, label, value, colors, accent }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: AppColors;
  accent: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={16} color={accent ? colors.primary : colors.text.muted} />
      <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: accent ? colors.primary : colors.text.primary }}>{value}</Text>
      <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background.dark },
    centered:    { alignItems: 'center', justifyContent: 'center', gap: 12 },
    bannerPlaceholder: {
      backgroundColor: '#111', alignItems: 'center', justifyContent: 'center',
    },

    /* Back button (overlaid on banner) */
    backBtn: {
      position: 'absolute', left: 16, zIndex: 10,
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center', justifyContent: 'center',
    },

    /* Status badge */
    statusBadge: {
      position: 'absolute', right: 16, zIndex: 10,
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    },
    livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff', opacity: 0.9 },
    statusText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

    /* Prize hero strip at bottom of banner */
    prizeHero: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8,
      flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    },
    prizeHeroLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1,
    },
    prizeHeroValue: {
      fontSize: 28, fontFamily: 'Inter_700Bold',
      color: '#FFD700', letterSpacing: -0.5,
    },

    /* Body */
    body: { paddingHorizontal: 18, paddingTop: 18 },
    gameTag: {
      fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary,
      textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 6,
    },
    matchTitle: {
      fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary,
      lineHeight: 28, marginBottom: 18,
    },

    /* Stats row */
    statsRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: 16, paddingVertical: 16,
      borderWidth: 1, borderColor: colors.border.default,
      marginBottom: 12,
    },
    statDivider: { width: 1, height: 36, backgroundColor: colors.border.default },

    /* Date row */
    dateRow: {
      flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20,
    },
    dateText: {
      fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text.muted,
    },

    divider: { height: 1, backgroundColor: colors.border.subtle, marginBottom: 18 },

    /* Generic card */
    card: {
      backgroundColor: colors.background.card,
      borderRadius: 16, padding: 16, marginBottom: 14,
      borderWidth: 1, borderColor: colors.border.default,
    },
    cardHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
    },

    /* Slot meter */
    slotBadge: {
      backgroundColor: colors.primary + '22',
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    },
    slotBadgeFull: { backgroundColor: colors.status.error + '22' },
    slotBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary },
    slotBadgeTextFull: { color: colors.status.error },
    progressTrack: { height: 8, backgroundColor: colors.background.elevated, borderRadius: 4, overflow: 'hidden' },
    progressFill:  { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    progressLabelText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    /* Text content */
    bodyText: {
      fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, lineHeight: 22,
    },

    /* Rules */
    ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
    ruleIndex: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: colors.primary + '22',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
    },
    ruleIndexText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary },
    ruleText: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular',
      color: colors.text.secondary, lineHeight: 22,
    },

    /* Room credentials */
    roomCard: { borderColor: colors.primary + '40' },
    credentialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    credentialLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    credentialValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    credentialValue: {
      fontSize: 15, fontFamily: 'Inter_700Bold',
      color: colors.text.primary, letterSpacing: 1.2,
    },

    /* Info box */
    infoBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 14,
      backgroundColor: 'rgba(245,158,11,0.08)',
      borderRadius: 14, padding: 16, marginBottom: 14,
      borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    },
    infoBoxIcon: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: 'rgba(245,158,11,0.15)',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    infoBoxTitle: {
      fontSize: 14, fontFamily: 'Inter_600SemiBold',
      color: colors.status.warning, marginBottom: 3,
    },
    infoBoxSub: {
      fontSize: 12, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, lineHeight: 18,
    },

    /* Watch Live */
    watchLiveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: '#CC0000', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14,
      marginBottom: 14,
    },
    watchLiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    watchLiveTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
    watchLiveSub:   { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', marginTop: 1 },

    /* Winner card */
    winnerCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderRadius: 14, padding: 18, marginBottom: 14, overflow: 'hidden',
      borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)',
    },
    winnerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
    winnerRank:   { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#FFD700' },
    winnerPoints: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },
    winnerPrize:  { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.status.success },

    /* CTA */
    cta: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingHorizontal: 18, paddingTop: 12,
      backgroundColor: colors.background.dark + 'F5',
      borderTopWidth: 1, borderTopColor: colors.border.default,
    },
    joinBtn: {
      backgroundColor: colors.primary, borderRadius: 14, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    disabled:    { opacity: 0.6 },
    joinBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
    claimBtn: {
      backgroundColor: '#FFD700', borderRadius: 14, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    claimBtnText: { color: '#000', fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 0.2 },
    joinedBadge: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: 14, height: 54,
      borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
    },
    joinedText:  { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.status.success },
    emptyTitle:  { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    backLink:    { paddingHorizontal: 24, paddingVertical: 10 },
    backLinkText: { color: colors.primary, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  });
}
