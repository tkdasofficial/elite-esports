import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SkeletonBar } from '@/components/SkeletonBar';
import { AvatarSVG } from '@/components/AvatarSVG';
import { useAuth } from '@/store/AuthContext';
import { useMyTeam } from '@/features/team/hooks/useMyTeam';
import { supabase } from '@/services/supabase';
import type { AppColors } from '@/utils/colors';

type MatchRow = {
  id: string;
  title: string;
  game: string;
  status: string;
  entry_fee: number;
  prize_pool: number;
  players_joined: number;
  max_players: number;
  starts_at: string;
};

type JoinRequest = {
  id: string;
  user_id: string;
  match_id: string | null;
  status: string;
  created_at: string;
  username: string;
  avatar_index: number;
  match_title: string;
};

export default function TeamMatchesScreen() {
  const { user }   = useAuth();
  const { colors } = useTheme();
  const styles     = useMemo(() => createStyles(colors), [colors]);
  const insets     = useSafeAreaInsets();

  const { team, loading: teamLoading } = useMyTeam(user?.id);

  const [matches,          setMatches]          = useState<MatchRow[]>([]);
  const [requests,         setRequests]          = useState<JoinRequest[]>([]);
  const [dataLoading,      setDataLoading]       = useState(true);
  const [refreshing,       setRefreshing]        = useState(false);
  const [activeTab,        setActiveTab]         = useState<'matches' | 'requests'>('matches');
  const [processing,       setProcessing]        = useState<Record<string, boolean>>({});

  // Warning modal state
  const [warnVisible,      setWarnVisible]       = useState(false);
  const [pendingAction,    setPendingAction]      = useState<(() => void) | null>(null);
  const [warnTitle,        setWarnTitle]         = useState('');
  const [warnMessage,      setWarnMessage]       = useState('');

  const fetchData = useCallback(async () => {
    if (!team) return;

    const [matchRes, reqRes] = await Promise.all([
      supabase
        .from('matches')
        .select('id, title, game_id, entry_fee, prize_pool, joined_players, max_players, status, scheduled_at, games(name)')
        .in('status', ['upcoming', 'ongoing'])
        .order('scheduled_at', { ascending: true })
        .limit(30),
      supabase
        .from('team_join_requests')
        .select('id, user_id, match_id, status, created_at, matches(title)')
        .eq('team_id', team.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    const rawMatches = matchRes.data ?? [];
    setMatches(rawMatches.map((m: any) => ({
      id:             m.id,
      title:          m.title ?? 'Untitled',
      game:           (Array.isArray(m.games) ? m.games[0]?.name : m.games?.name) ?? 'Unknown',
      status:         m.status,
      entry_fee:      m.entry_fee ?? 0,
      prize_pool:     m.prize_pool ?? 0,
      players_joined: m.joined_players ?? 0,
      max_players:    m.max_players ?? 0,
      starts_at:      m.scheduled_at ?? '',
    })));

    const rawReqs = reqRes.data ?? [];
    if (rawReqs.length > 0) {
      const userIds = rawReqs.map((r: any) => r.user_id);
      const { data: users } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const userMap: Record<string, { username: string | null; avatar_url: string | null }> = {};
      (users ?? []).forEach((u: any) => { userMap[u.id] = { username: u.username, avatar_url: u.avatar_url }; });

      setRequests(rawReqs.map((r: any) => {
        const u = userMap[r.user_id] ?? { username: null, avatar_url: null };
        const avatarRaw = u.avatar_url ?? '0';
        const avatarIndex = /^\d+$/.test(avatarRaw) ? parseInt(avatarRaw, 10) : 0;
        const matchTitle = (Array.isArray(r.matches) ? r.matches[0]?.title : r.matches?.title) ?? 'Unknown Match';
        return {
          id:           r.id,
          user_id:      r.user_id,
          match_id:     r.match_id,
          status:       r.status,
          created_at:   r.created_at,
          username:     u.username ?? 'Player',
          avatar_index: avatarIndex,
          match_title:  matchTitle,
        };
      }));
    } else {
      setRequests([]);
    }

    setDataLoading(false);
    setRefreshing(false);
  }, [team]);

  useEffect(() => {
    if (!teamLoading && team) fetchData();
    else if (!teamLoading && !team) setDataLoading(false);
  }, [team, teamLoading, fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  const showWarning = (title: string, message: string, onConfirm: () => void) => {
    setWarnTitle(title);
    setWarnMessage(message);
    setPendingAction(() => onConfirm);
    setWarnVisible(true);
  };

  const handleApprove = (req: JoinRequest) => {
    showWarning(
      'Approve Join Request',
      `Allow @${req.username} to join your team? They will become a member and can participate in matches.`,
      async () => {
        setProcessing(p => ({ ...p, [req.id]: true }));
        try {
          const { error: reqErr } = await supabase
            .from('team_join_requests')
            .update({ status: 'approved' })
            .eq('id', req.id);

          if (!reqErr && team) {
            const { count } = await supabase
              .from('team_members')
              .select('id', { count: 'exact', head: true })
              .eq('team_id', team.id);

            if ((count ?? 0) < 5) {
              await supabase.from('team_members').insert({
                team_id: team.id,
                user_id: req.user_id,
                role: 'member',
              });
            }
          }

          setRequests(prev => prev.filter(r => r.id !== req.id));
        } catch { /* ignore */ }
        setProcessing(p => ({ ...p, [req.id]: false }));
      },
    );
  };

  const handleCancel = (req: JoinRequest) => {
    showWarning(
      'Cancel Join Request',
      `Decline @${req.username}'s request to join your team?`,
      async () => {
        setProcessing(p => ({ ...p, [req.id]: true }));
        await supabase
          .from('team_join_requests')
          .update({ status: 'cancelled' })
          .eq('id', req.id);
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setProcessing(p => ({ ...p, [req.id]: false }));
      },
    );
  };

  if (teamLoading || dataLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Team Matches" />
        <View style={{ padding: 16, gap: 14 }}>
          <SkeletonBar width="100%" height={60} radius={14} />
          <SkeletonBar width="100%" height={100} radius={14} />
          <SkeletonBar width="100%" height={100} radius={14} />
        </View>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ScreenHeader title="Team Matches" />
        <Ionicons name="people-outline" size={52} color="#444" />
        <Text style={styles.emptyTitle}>You're not in a team</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go to My Team</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pendingCount = requests.length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Team Matches" />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'matches' && styles.tabActive]}
          onPress={() => setActiveTab('matches')}
          activeOpacity={0.8}
        >
          <Ionicons name="trophy-outline" size={15} color={activeTab === 'matches' ? colors.primary : colors.text.muted} />
          <Text style={[styles.tabText, activeTab === 'matches' && styles.tabTextActive]}>Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={15} color={activeTab === 'requests' ? colors.primary : colors.text.muted} />
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>Join Requests</Text>
          {pendingCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Matches Tab ── */}
      {activeTab === 'matches' && (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {matches.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="trophy-outline" size={44} color="#444" />
              <Text style={styles.emptyTitle}>No Upcoming Matches</Text>
              <Text style={styles.emptyText}>New matches will appear here when added by admin.</Text>
            </View>
          ) : (
            matches.map(m => {
              const isLive = m.status === 'ongoing';
              const isFree = m.entry_fee === 0;
              const dateStr = m.starts_at
                ? new Date(m.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBD';
              const timeStr = m.starts_at
                ? new Date(m.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                : '';

              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.matchCard}
                  onPress={() => router.push(`/match/${m.id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={styles.matchCardHeader}>
                    <View style={[styles.statusDot, { backgroundColor: isLive ? '#22C55E' : '#3B82F6' }]} />
                    <Text style={[styles.matchStatus, { color: isLive ? '#22C55E' : '#3B82F6' }]}>
                      {isLive ? 'LIVE' : 'UPCOMING'}
                    </Text>
                    <View style={styles.gameBadge}>
                      <Text style={styles.gameBadgeText}>{m.game}</Text>
                    </View>
                  </View>

                  <Text style={styles.matchTitle} numberOfLines={2}>{m.title}</Text>

                  <View style={styles.matchMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="trophy-outline" size={13} color="#FFA200" />
                      <Text style={[styles.metaText, { color: '#FFA200' }]}>₹{m.prize_pool.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Ionicons name="ticket-outline" size={13} color={isFree ? colors.status.success : colors.text.muted} />
                      <Text style={[styles.metaText, isFree && { color: colors.status.success }]}>
                        {isFree ? 'Free' : `₹${m.entry_fee}`}
                      </Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={13} color={colors.text.muted} />
                      <Text style={styles.metaText}>{m.players_joined}/{m.max_players}</Text>
                    </View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={13} color={colors.text.muted} />
                      <Text style={styles.metaText}>{dateStr}{timeStr ? ` · ${timeStr}` : ''}</Text>
                    </View>
                  </View>

                  <View style={styles.matchCardFooter}>
                    <Text style={styles.matchViewText}>View Match</Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── Join Requests Tab ── */}
      {activeTab === 'requests' && (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {/* Info box */}
          {team.open_to_anyone ? (
            <View style={styles.infoBox}>
              <Ionicons name="people-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.infoBoxText}>
                Your team is <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>open</Text> — anyone can request to join.
              </Text>
            </View>
          ) : (
            <View style={[styles.infoBox, { borderColor: 'rgba(239,68,68,0.25)', backgroundColor: 'rgba(239,68,68,0.06)' }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.status.error} />
              <Text style={[styles.infoBoxText, { color: colors.status.error }]}>
                Your team is <Text style={{ fontFamily: 'Inter_600SemiBold' }}>closed</Text> — only code-based joins allowed.
              </Text>
            </View>
          )}

          {requests.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="person-add-outline" size={44} color="#444" />
              <Text style={styles.emptyTitle}>No Pending Requests</Text>
              <Text style={styles.emptyText}>Join requests from other players will appear here.</Text>
            </View>
          ) : (
            requests.map(req => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestLeft}>
                  <View style={styles.requestAvatar}>
                    <AvatarSVG index={req.avatar_index} size={42} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.requestUsername}>@{req.username}</Text>
                    {req.match_title ? (
                      <Text style={styles.requestMatch} numberOfLines={1}>
                        For: {req.match_title}
                      </Text>
                    ) : null}
                    <Text style={styles.requestTime}>
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>

                <View style={styles.requestActions}>
                  {processing[req.id] ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(req)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.approveBtnText}>Join</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelReqBtn}
                        onPress={() => handleCancel(req)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="close" size={16} color={colors.status.error} />
                        <Text style={styles.cancelReqBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ═══ Warning / Confirm Modal ═══ */}
      <Modal visible={warnVisible} transparent animationType="fade" onRequestClose={() => setWarnVisible(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <View style={styles.dialogHeader}>
              <View style={styles.dialogIconWrap}>
                <Ionicons name="warning-outline" size={26} color="#F59E0B" />
              </View>
              <Text style={styles.dialogTitle}>{warnTitle}</Text>
              <Text style={styles.dialogSubtitle}>{warnMessage}</Text>
            </View>

            <View style={styles.dialogBtnRow}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setWarnVisible(false)} activeOpacity={0.8}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmBtn}
                onPress={() => {
                  setWarnVisible(false);
                  pendingAction?.();
                  setPendingAction(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.dialogConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
    scroll:    { padding: 16 },

    tabBar: {
      flexDirection: 'row', gap: 8,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
    },
    tab: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      paddingVertical: 10, borderRadius: 12,
      backgroundColor: colors.background.card,
      borderWidth: 1, borderColor: colors.border.default,
    },
    tabActive: { borderColor: colors.primary, backgroundColor: colors.primary + '18' },
    tabText:      { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text.muted },
    tabTextActive:{ color: colors.primary },
    badge: {
      minWidth: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 5,
    },
    badgeText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff' },

    matchCard: {
      backgroundColor: colors.background.card,
      borderRadius: 16, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: colors.border.default,
    },
    matchCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
    statusDot:    { width: 7, height: 7, borderRadius: 4 },
    matchStatus:  { fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
    gameBadge:    { marginLeft: 'auto' as any, backgroundColor: colors.primary + '18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.primary + '44' },
    gameBadgeText:{ fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.primary },
    matchTitle:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 10, lineHeight: 21 },

    matchMeta:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, alignItems: 'center', marginBottom: 12 },
    metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },
    metaDivider: { width: 1, height: 12, backgroundColor: colors.border.default, marginHorizontal: 4 },

    matchCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5 },
    matchViewText:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    requestCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.card,
      borderRadius: 16, padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border.default,
    },
    requestLeft:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    requestAvatar:   { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', backgroundColor: colors.background.elevated },
    requestUsername: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.text.primary },
    requestMatch:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2, maxWidth: 160 },
    requestTime:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },

    requestActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    approveBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.status.success, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    approveBtnText:  { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
    cancelReqBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
      borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    },
    cancelReqBtnText:{ fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.status.error },

    infoBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.primary + '10',
      borderRadius: 12, padding: 12, marginBottom: 16,
      borderWidth: 1, borderColor: colors.primary + '33',
    },
    infoBoxText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, lineHeight: 18 },

    emptyBox:   { alignItems: 'center', paddingVertical: 60, gap: 12 },
    emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: colors.text.muted },
    emptyText:  { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },
    backLink:   { paddingHorizontal: 24, paddingVertical: 10 },
    backLinkText:{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    dialogBox:     { width: '100%', backgroundColor: colors.background.card, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.default },
    dialogHeader:  { alignItems: 'center', paddingTop: 28, paddingHorizontal: 20, paddingBottom: 20, gap: 8 },
    dialogIconWrap:{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    dialogTitle:   { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary, textAlign: 'center' },
    dialogSubtitle:{ fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.secondary, textAlign: 'center', lineHeight: 20 },
    dialogBtnRow:  { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border.subtle, padding: 16 },
    dialogCancelBtn:  { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
    dialogCancelText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    dialogConfirmBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    dialogConfirmText:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  });
}
