import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Alert, Platform, BackHandler, ActivityIndicator,
} from 'react-native';
import { SkeletonBar } from '@/components/SkeletonBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { STATUS_CONFIG } from '@/utils/types';
import { useAuth } from '@/store/AuthContext';
import { useMatchDetail } from '@/features/match/hooks/useMatchDetail';
import { RoomDetails } from '@/features/match/components/RoomDetails';
import { AdLoadingOverlay } from '@/components/AdLoadingOverlay';
import { useAdGate } from '@/hooks/useAdGate';
import { useAds } from '@/store/AdContext';
import { supabase } from '@/services/supabase';
import { useWallet } from '@/store/WalletContext';
import type { AppColors } from '@/utils/colors';

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

  const bottomPad  = insets.bottom + (Platform.OS === 'web' ? 34 : 0);
  const isLive     = match?.status === 'ongoing';

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
    gateAction(
      adConfig.join,
      async () => {
        const { error } = await joinMatch();
        if (error) Alert.alert('Error', error.message);
        else Alert.alert('Joined!', 'You have successfully joined this match.');
      },
      'Loading Ad...',
    );
  }, [adConfig.join, gateAction, joinMatch]);

  const handleLeave = useCallback(() => {
    gateAction(adConfig.leave, () => router.back(), 'Loading Ad...');
  }, [adConfig.leave, gateAction]);

  const handleClaim = useCallback(() => {
    if (!claimResult || claimResult.prize <= 0 || !user) return;
    gateAction(
      adConfig.reward,
      async () => {
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
          Alert.alert('🏆 Prize Claimed!', `₹${claimResult.prize.toFixed(2)} has been credited to your wallet.`);
        } else {
          Alert.alert('Error', error.message);
        }
        setClaimLoading(false);
      },
      'Loading Reward Ad...',
    );
  }, [claimResult, user, adConfig.reward, gateAction, id, refreshWallet]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Match Details" />
        <SkeletonBar width="100%" height={220} radius={0} />
        <View style={{ padding: 16, gap: 14 }}>
          <SkeletonBar width="60%" height={14} radius={6} />
          <SkeletonBar width="85%" height={22} radius={8} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <SkeletonBar width={90} height={36} radius={10} />
            <SkeletonBar width={90} height={36} radius={10} />
          </View>
          <SkeletonBar width="100%" height={1} radius={0} />
          <SkeletonBar width="100%" height={60} radius={12} />
          <SkeletonBar width="100%" height={60} radius={12} />
          <SkeletonBar width="100%" height={60} radius={12} />
        </View>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Match Details" />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>Match Not Found</Text>
        </View>
      </View>
    );
  }

  const cfg    = STATUS_CONFIG[match.status];
  const isFull = match.players_joined >= match.max_players;
  const canJoin = match.status === 'upcoming' && !isFull && !hasJoined;
  const showLeaveBtn = isLive && hasJoined;
  const showClaimBtn = match.status === 'completed'
    && hasJoined
    && claimResult !== null
    && claimResult.prize > 0
    && !alreadyClaimed;

  return (
    <View style={styles.container}>
      <AdLoadingOverlay
        visible={overlay.visible}
        bypassAfter={overlay.duration}
        onSkip={dismiss}
        label={overlay.label}
      />

      <ScreenHeader
        title={match.game}
        onBack={showLeaveBtn ? handleLeave : undefined}
      />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {match.banner_url ? (
            <Image source={{ uri: match.banner_url }} style={styles.banner} contentFit="cover" />
          ) : (
            <LinearGradient colors={['#2A0900', '#0A0A0A']} style={styles.banner}>
              <Ionicons name="game-controller-outline" size={64} color={colors.primary} />
            </LinearGradient>
          )}
          <LinearGradient colors={['transparent', colors.background.dark]} style={styles.bannerOverlay} />

          <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
            {match.status === 'ongoing' && <View style={styles.liveDot} />}
            <Text style={styles.statusText}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.gameTag}>{match.game}</Text>
          <Text style={styles.title}>{match.title}</Text>
          {match.description && <Text style={styles.desc}>{match.description}</Text>}

          <View style={styles.statsGrid}>
            {[
              { label: 'Entry Fee',  value: `₹${match.entry_fee}`,  icon: 'ticket-outline',  highlight: false },
              { label: 'Prize Pool', value: `₹${match.prize_pool}`, icon: 'trophy-outline',  highlight: true  },
              { label: 'Players',    value: `${match.players_joined}/${match.max_players}`, icon: 'people-outline', highlight: false },
              { label: 'Starts At',  value: new Date(match.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), icon: 'time-outline', highlight: false },
            ].map(({ label, value, icon, highlight }) => (
              <View key={label} style={styles.statCard}>
                <Ionicons name={icon as any} size={18} color={highlight ? colors.primary : colors.text.secondary} />
                <Text style={[styles.statValue, highlight && { color: colors.primary }]}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.slotSection}>
            <View style={styles.slotHeader}>
              <Text style={styles.slotTitle}>Slots</Text>
              <Text style={styles.slotCount}>{match.players_joined} / {match.max_players}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${(match.players_joined / match.max_players) * 100}%` as any }]} />
            </View>
          </View>

          {isLive && hasJoined && (
            <RoomDetails roomId={match.room_id} roomPassword={match.room_password} />
          )}

          {isLive && !hasJoined && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={colors.status.warning} />
              <Text style={styles.infoText}>Join the match to see room credentials</Text>
            </View>
          )}

          {claimResult !== null && (
            <View style={styles.winnerCard}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
              <View style={{ flex: 1 }}>
                <Text style={styles.winnerRank}>Rank #{claimResult.rank}</Text>
                <Text style={styles.winnerPoints}>{claimResult.points} points</Text>
              </View>
              {claimResult.prize > 0 && (
                <Text style={styles.winnerPrize}>₹{claimResult.prize.toFixed(0)}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

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
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.joinBtnText}>Join Match — ₹{match.entry_fee}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hasJoined && !showClaimBtn && match.status !== 'completed' && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
            <Text style={styles.joinedText}>You've joined this match</Text>
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
                <Text style={styles.claimBtnText}>
                  Claim ₹{claimResult?.prize.toFixed(0)} Prize
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {match.status === 'completed' && hasJoined && alreadyClaimed && (
        <View style={[styles.cta, { paddingBottom: bottomPad + 16 }]}>
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#FFD700" />
            <Text style={[styles.joinedText, { color: '#FFD700' }]}>Prize Claimed</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    centered:  { alignItems: 'center', justifyContent: 'center', flex: 1, gap: 12 },
    scroll:    {},
    bannerContainer: { position: 'relative' },
    banner:    { width: '100%', aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center' },
    bannerOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 100 },
    statusBadge: {
      position: 'absolute', top: 12, right: 12,
      flexDirection: 'row', alignItems: 'center', gap: 5,
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    },
    liveDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    statusText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
    content:    { padding: 20 },
    gameTag: {
      fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.primary,
      textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6,
    },
    title:  { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 8, lineHeight: 30 },
    desc:   { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.secondary, lineHeight: 22, marginBottom: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    statCard: {
      flex: 1, minWidth: '45%', backgroundColor: colors.background.card,
      borderRadius: 14, padding: 16, alignItems: 'center', gap: 6,
      borderWidth: 1, borderColor: colors.border.default,
    },
    statValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.secondary },
    slotSection: { marginBottom: 20 },
    slotHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    slotTitle:   { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    slotCount:   { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    progressTrack: { height: 6, backgroundColor: colors.background.elevated, borderRadius: 3 },
    progressFill:  { height: 6, backgroundColor: colors.primary, borderRadius: 3 },
    infoBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
    },
    infoText:  { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.status.warning, flex: 1 },
    winnerCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: 'rgba(255,215,0,0.08)', borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: 'rgba(255,215,0,0.25)', marginTop: 8,
    },
    winnerRank:   { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#FFD700' },
    winnerPoints: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary },
    winnerPrize:  { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.status.success },
    cta: {
      position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16,
      backgroundColor: colors.background.dark,
      borderTopWidth: 1, borderTopColor: colors.border.default,
    },
    joinBtn: {
      backgroundColor: colors.primary, borderRadius: 14, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    disabled:     { opacity: 0.6 },
    joinBtnText:  { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
    claimBtn: {
      backgroundColor: '#FFD700', borderRadius: 14, height: 54,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    claimBtnText: { color: '#000', fontSize: 16, fontFamily: 'Inter_700Bold' },
    joinedBadge: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 14, height: 54,
      borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
    },
    joinedText:  { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.status.success },
    emptyTitle:  { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
  });
}
