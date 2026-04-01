import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
  RefreshControl, ActivityIndicator, Pressable, Clipboard,
} from 'react-native';
import { SkeletonBar } from '@/components/SkeletonBar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useMyTeam } from '@/features/team/hooks/useMyTeam';
import { useAuth } from '@/store/AuthContext';
import { useGames } from '@/features/games/hooks/useGames';
import type { AppColors } from '@/utils/colors';

const TEAM_AVATARS = ['🎮', '⚡', '🔥', '💀', '🎯', '🛡️', '⚔️', '🏆', '👑', '🐉'];
const MAX_MEMBERS = 5;

export default function MyTeamScreen() {
  const { user } = useAuth();
  const { team, loading, refreshing, refresh, createTeam, joinTeam, revokeMember, leaveTeam } = useMyTeam(user?.id);
  const { games, loading: gamesLoading } = useGames();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  /* ── create state ── */
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [newAvatar, setNewAvatar]   = useState(TEAM_AVATARS[0]);
  const [newName,   setNewName]     = useState('');
  const [newSlogan, setNewSlogan]   = useState('');
  const [newGame,   setNewGame]     = useState('');
  const [creating,  setCreating]    = useState(false);

  /* ── join state ── */
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining,  setJoining]  = useState(false);

  useEffect(() => {
    if (games.length > 0 && !newGame) setNewGame(games[0].name);
  }, [games]);

  const resetCreate = () => {
    setCreateStep(1);
    setNewAvatar(TEAM_AVATARS[0]);
    setNewName('');
    setNewSlogan('');
    setNewGame(games[0]?.name ?? '');
    setShowCreate(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Required', 'Please enter a team name.'); return; }
    if (!newGame)        { Alert.alert('Required', 'Please select a game.'); return; }
    setCreating(true);
    try {
      await createTeam({ name: newName, slogan: newSlogan, avatar: newAvatar, game: newGame });
      resetCreate();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create team.');
    }
    setCreating(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { Alert.alert('Required', 'Please enter a team code.'); return; }
    setJoining(true);
    try {
      await joinTeam(joinCode.trim());
      setJoinCode('');
      setShowJoin(false);
    } catch (e: any) {
      Alert.alert('Cannot Join', e.message ?? 'Failed to join team.');
    }
    setJoining(false);
  };

  const handleRevoke = (memberId: string, memberName: string) => {
    Alert.alert('Kick Member', `Remove ${memberName} from the team?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Kick', style: 'destructive', onPress: async () => {
          try { await revokeMember(memberId); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const handleLeave = () => {
    Alert.alert('Leave Team', 'Are you sure you want to leave this team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          try { await leaveTeam(); }
          catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  };

  const copyCode = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied!', `Team code "${code}" copied to clipboard.`);
  };

  /* ─── loading skeleton ─── */
  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Team" />
        <View style={{ padding: 16, gap: 14 }}>
          <SkeletonBar width="50%" height={20} radius={8} />
          <SkeletonBar width="100%" height={120} radius={20} />
          <SkeletonBar width="100%" height={60} radius={14} />
          <SkeletonBar width="100%" height={60} radius={14} />
        </View>
      </View>
    );
  }

  /* ─── in a team ─── */
  if (team) {
    const members     = team.team_members ?? [];
    const isCaptain   = members.some(m => m.user_id === user?.id && m.role === 'captain');
    const memberCount = members.length;

    return (
      <View style={styles.container}>
        <ScreenHeader title="My Team" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.teamAvatarCircle}>
              <Text style={styles.teamAvatarEmoji}>{team.avatar || '🎮'}</Text>
            </View>
            <Text style={styles.teamName}>{team.name}</Text>
            {!!team.slogan && <Text style={styles.teamSlogan}>"{team.slogan}"</Text>}

            <View style={styles.badgeRow}>
              <View style={styles.gameBadge}>
                <Ionicons name="game-controller-outline" size={12} color={colors.text.muted} style={{ marginRight: 4 }} />
                <Text style={styles.gameBadgeText}>{team.game}</Text>
              </View>
              <View style={styles.memberCountBadge}>
                <Ionicons name="people-outline" size={12} color={colors.text.muted} style={{ marginRight: 4 }} />
                <Text style={styles.gameBadgeText}>{memberCount}/{MAX_MEMBERS}</Text>
              </View>
            </View>

            {/* Unique Code */}
            <TouchableOpacity style={styles.codeRow} onPress={() => copyCode(team.code)} activeOpacity={0.7}>
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>TEAM CODE</Text>
                <Text style={styles.codeValue}>{team.code}</Text>
              </View>
              <View style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={16} color={colors.primary} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Members */}
          <Text style={styles.sectionLabel}>Members ({memberCount}/{MAX_MEMBERS})</Text>
          {members.map((member) => {
            const u = (member as any).users;
            const displayName = u?.name || u?.username || 'Player';
            const isSelf      = member.user_id === user?.id;
            const isMemberCaptain = member.role === 'captain';

            return (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberAvatarCircle}>
                  <Text style={styles.memberAvatarEmoji}>{team.avatar || '🎮'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{displayName}{isSelf ? ' (You)' : ''}</Text>
                  <Text style={styles.memberUsername}>@{u?.username || 'unknown'}</Text>
                </View>
                <View style={styles.memberRight}>
                  <View style={[styles.roleBadge, isMemberCaptain && styles.roleCaptainBadge]}>
                    <Text style={[styles.roleText, isMemberCaptain && styles.roleCaptainText]}>
                      {isMemberCaptain ? '★ Leader' : 'Member'}
                    </Text>
                  </View>
                  {isCaptain && !isMemberCaptain && (
                    <TouchableOpacity
                      style={styles.kickBtn}
                      onPress={() => handleRevoke(member.id, displayName)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="person-remove-outline" size={14} color={colors.status.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Leave */}
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
            <Ionicons name="exit-outline" size={18} color={colors.status.error} />
            <Text style={styles.leaveBtnText}>Leave Team</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  /* ─── no team ─── */
  return (
    <View style={styles.container}>
      <ScreenHeader title="My Team" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Text style={{ fontSize: 48 }}>🏆</Text>
          </View>
          <Text style={styles.emptyTitle}>No Team Yet</Text>
          <Text style={styles.emptyText}>
            Create your own squad or join an existing team with a team code.
          </Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Create Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)} activeOpacity={0.85}>
              <Ionicons name="enter-outline" size={20} color={colors.primary} />
              <Text style={styles.joinBtnText}>Join Team</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ─── Create Modal ─── */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={resetCreate}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.handle} />

              {/* Step indicator */}
              <View style={styles.stepRow}>
                {([1, 2, 3] as const).map(s => (
                  <View key={s} style={[styles.stepDot, createStep === s && styles.stepDotActive]} />
                ))}
              </View>

              {/* Step 1: Avatar */}
              {createStep === 1 && (
                <>
                  <Text style={styles.sheetTitle}>Pick an Avatar</Text>
                  <Text style={styles.sheetSub}>Choose the icon that represents your team.</Text>
                  <View style={styles.avatarGrid}>
                    {TEAM_AVATARS.map(av => (
                      <TouchableOpacity
                        key={av}
                        style={[styles.avatarCell, newAvatar === av && styles.avatarCellActive]}
                        onPress={() => setNewAvatar(av)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.avatarCellEmoji}>{av}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.nextBtn} onPress={() => setCreateStep(2)} activeOpacity={0.85}>
                    <Text style={styles.nextBtnText}>Next</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetCreate}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2: Name + Slogan */}
              {createStep === 2 && (
                <>
                  <View style={styles.stepAvatarPreview}>
                    <Text style={{ fontSize: 36 }}>{newAvatar}</Text>
                  </View>
                  <Text style={styles.sheetTitle}>Name Your Team</Text>

                  <Text style={styles.inputLabel}>Team Name <Text style={styles.charHint}>({newName.length}/15)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={newName}
                    onChangeText={t => setNewName(t.slice(0, 15))}
                    placeholder="e.g. Storm Riders"
                    placeholderTextColor={colors.text.muted}
                    maxLength={15}
                    autoFocus
                  />

                  <Text style={styles.inputLabel}>Slogan <Text style={styles.charHint}>({newSlogan.length}/50)</Text></Text>
                  <TextInput
                    style={[styles.input, { height: 70 }]}
                    value={newSlogan}
                    onChangeText={t => setNewSlogan(t.slice(0, 50))}
                    placeholder="e.g. Play hard, win harder"
                    placeholderTextColor={colors.text.muted}
                    maxLength={50}
                    multiline
                  />

                  <View style={styles.stepNavRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setCreateStep(1)} activeOpacity={0.8}>
                      <Ionicons name="arrow-back" size={18} color={colors.text.secondary} />
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.nextBtn, { flex: 1 }]}
                      onPress={() => {
                        if (!newName.trim()) { Alert.alert('Required', 'Enter a team name.'); return; }
                        setCreateStep(3);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.nextBtnText}>Next</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetCreate}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 3: Game */}
              {createStep === 3 && (
                <>
                  <View style={styles.stepAvatarPreview}>
                    <Text style={{ fontSize: 36 }}>{newAvatar}</Text>
                  </View>
                  <Text style={styles.sheetTitle}>Select a Game</Text>
                  <Text style={styles.sheetSub}>Your team competes in one game.</Text>

                  {gamesLoading ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />
                  ) : games.length === 0 ? (
                    <View style={styles.noGamesBox}>
                      <Text style={styles.noGamesText}>No games available yet.</Text>
                    </View>
                  ) : (
                    <View style={styles.gameList}>
                      {games.map(g => (
                        <TouchableOpacity
                          key={g.id}
                          style={[styles.gameOption, newGame === g.name && styles.gameOptionActive]}
                          onPress={() => setNewGame(g.name)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={newGame === g.name ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={newGame === g.name ? colors.primary : colors.text.muted}
                          />
                          <Text style={[styles.gameOptionText, newGame === g.name && styles.gameOptionTextActive]}>
                            {g.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.stepNavRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setCreateStep(2)} activeOpacity={0.8}>
                      <Ionicons name="arrow-back" size={18} color={colors.text.secondary} />
                      <Text style={styles.backBtnText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.nextBtn, { flex: 1, opacity: creating ? 0.6 : 1 }]}
                      onPress={handleCreate}
                      disabled={creating}
                      activeOpacity={0.85}
                    >
                      {creating
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <>
                            <Text style={styles.nextBtnText}>Create Team</Text>
                            <Ionicons name="checkmark" size={18} color="#fff" />
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetCreate}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── Join Modal ─── */}
      <Modal visible={showJoin} animationType="slide" transparent onRequestClose={() => { setShowJoin(false); setJoinCode(''); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Join a Team</Text>
              <Text style={styles.sheetSub}>Enter the unique team code shared by your team leader.</Text>

              <Text style={styles.inputLabel}>Team Code</Text>
              <TextInput
                style={[styles.input, { textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' }]}
                value={joinCode}
                onChangeText={t => setJoinCode(t.toUpperCase())}
                placeholder="e.g. AB12CD34"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="characters"
                autoFocus
              />

              <TouchableOpacity
                style={[styles.nextBtn, { opacity: joining ? 0.6 : 1 }]}
                onPress={handleJoin}
                disabled={joining}
                activeOpacity={0.85}
              >
                {joining
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.nextBtnText}>Join Team</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowJoin(false); setJoinCode(''); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: colors.background.dark },
    scroll:      { padding: 16 },

    /* ── team banner ── */
    banner: {
      backgroundColor: colors.background.card, borderRadius: 20,
      alignItems: 'center', padding: 24, marginBottom: 20,
      borderWidth: 1, borderColor: colors.border.default,
    },
    teamAvatarCircle: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: 'rgba(238,61,45,0.12)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 14, borderWidth: 2, borderColor: colors.primary,
    },
    teamAvatarEmoji: { fontSize: 44 },
    teamName:  { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 4, textAlign: 'center' },
    teamSlogan: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', marginBottom: 12, fontStyle: 'italic' },

    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    gameBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.elevated, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: colors.border.default,
    },
    memberCountBadge: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.elevated, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: colors.border.default,
    },
    gameBadgeText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text.secondary },

    codeRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.elevated,
      borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
      width: '100%', borderWidth: 1, borderColor: colors.border.default,
    },
    codeBox:     { flex: 1 },
    codeLabel:   { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, letterSpacing: 1.2, marginBottom: 2 },
    codeValue:   { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.primary, letterSpacing: 2 },
    copyBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
    copyBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    /* ── members ── */
    sectionLabel: {
      fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text.muted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2,
    },
    memberRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.card, borderRadius: 14, padding: 14,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border.subtle,
    },
    memberAvatarCircle: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center',
    },
    memberAvatarEmoji: { fontSize: 22 },
    memberName:     { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    memberUsername: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },
    memberRight:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    roleBadge:      { backgroundColor: colors.background.elevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    roleCaptainBadge: { backgroundColor: 'rgba(238,61,45,0.12)', borderWidth: 1, borderColor: colors.primary },
    roleText:         { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.text.muted },
    roleCaptainText:  { color: colors.primary },
    kickBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: 'rgba(239,68,68,0.1)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    },

    leaveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14, height: 52, marginTop: 12,
      borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    },
    leaveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.status.error },

    /* ── empty state ── */
    emptyState:   { alignItems: 'center', paddingTop: 64, paddingHorizontal: 24 },
    emptyIcon:    {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: 'rgba(238,61,45,0.1)',
      alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    },
    emptyTitle:   { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 10 },
    emptyText:    { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emptyActions: { width: '100%', gap: 12 },
    createBtn:    {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: 14, height: 54,
    },
    createBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
    joinBtn:       {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: 'rgba(238,61,45,0.1)', borderRadius: 14, height: 54,
      borderWidth: 1, borderColor: colors.primary,
    },
    joinBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary },

    /* ── modal sheet ── */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet:   {
      backgroundColor: colors.background.card,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 44,
    },
    handle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border.default, alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 6, textAlign: 'center' },
    sheetSub:   { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', marginBottom: 24 },

    stepRow:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
    stepDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border.default },
    stepDotActive: { backgroundColor: colors.primary, width: 24 },

    stepAvatarPreview: { alignSelf: 'center', marginBottom: 12 },

    avatarGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10,
      justifyContent: 'center', marginBottom: 24,
    },
    avatarCell: {
      width: 62, height: 62, borderRadius: 16,
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: 'transparent',
    },
    avatarCellActive: { borderColor: colors.primary, backgroundColor: 'rgba(238,61,45,0.12)' },
    avatarCellEmoji:  { fontSize: 30 },

    inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    charHint:   { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, textTransform: 'none' },
    input: {
      backgroundColor: colors.background.elevated, borderRadius: 12, height: 52,
      paddingHorizontal: 16, fontSize: 15, fontFamily: 'Inter_400Regular',
      color: colors.text.primary, borderWidth: 1, borderColor: colors.border.default, marginBottom: 18,
    },

    gameList:           { width: '100%', gap: 10, marginBottom: 24 },
    gameOption:         {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.elevated, borderRadius: 12,
      padding: 14, borderWidth: 1, borderColor: colors.border.default,
    },
    gameOptionActive:   { borderColor: colors.primary, backgroundColor: 'rgba(238,61,45,0.08)' },
    gameOptionText:     { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    gameOptionTextActive: { color: colors.primary, fontFamily: 'Inter_600SemiBold' },

    stepNavRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    nextBtn:    {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, borderRadius: 14, height: 52,
    },
    nextBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
    backBtn:     {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: colors.background.elevated, borderRadius: 14, height: 52, paddingHorizontal: 16,
      borderWidth: 1, borderColor: colors.border.default,
    },
    backBtnText:  { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    cancelBtn:    { alignItems: 'center', padding: 14 },
    cancelText:   { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text.muted },

    noGamesBox:  { backgroundColor: colors.background.elevated, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border.default, width: '100%' },
    noGamesText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center' },
  });
}
