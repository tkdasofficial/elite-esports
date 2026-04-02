import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
  RefreshControl, ActivityIndicator, Clipboard,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { SkeletonBar } from '@/components/SkeletonBar';
import { AvatarSVG, AVATAR_NAMES } from '@/components/AvatarSVG';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useMyTeam } from '@/features/team/hooks/useMyTeam';
import { useAuth } from '@/store/AuthContext';
import { useGames } from '@/features/games/hooks/useGames';
import type { AppColors } from '@/utils/colors';

/* ── Use only first 10 avatars ─────────────────────────────────── */
const TEAM_AVATAR_COUNT = 10;
const TEAM_AVATAR_INDICES = Array.from({ length: TEAM_AVATAR_COUNT }, (_, i) => i);
const MAX_MEMBERS = 5;

/** Parse the avatar string stored in DB → numeric index */
function avatarIndex(avatar?: string | null): number {
  const n = parseInt(avatar ?? '0', 10);
  return Number.isFinite(n) && n >= 0 && n < TEAM_AVATAR_COUNT ? n : 0;
}

/** Professional team / members icon — 3 person silhouettes */
function TeamIcon({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Centre person (larger) */}
      <Circle cx="32" cy="20" r="9" fill="#EE3D2D" />
      <Path
        d="M16 52 Q16 36 32 36 Q48 36 48 52"
        fill="#EE3D2D"
      />
      {/* Left person */}
      <Circle cx="13" cy="24" r="7" fill="#EE3D2D" opacity="0.55" />
      <Path
        d="M0 52 Q0 38 13 38 Q20 38 23 43"
        fill="#EE3D2D"
        opacity="0.55"
      />
      {/* Right person */}
      <Circle cx="51" cy="24" r="7" fill="#EE3D2D" opacity="0.55" />
      <Path
        d="M64 52 Q64 38 51 38 Q44 38 41 43"
        fill="#EE3D2D"
        opacity="0.55"
      />
    </Svg>
  );
}

export default function MyTeamScreen() {
  const { user } = useAuth();
  const { team, loading, refreshing, refresh, createTeam, updateTeam, joinTeam, revokeMember, leaveTeam } = useMyTeam(user?.id);
  const { games, loading: gamesLoading } = useGames();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  /* ── create state ── */
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [newAvatar,  setNewAvatar]  = useState('0');
  const [newName,    setNewName]    = useState('');
  const [newSlogan,  setNewSlogan]  = useState('');
  const [newGame,    setNewGame]    = useState('');
  const [creating,   setCreating]   = useState(false);

  /* ── edit state ── */
  const [showEdit,  setShowEdit]  = useState(false);
  const [editStep,  setEditStep]  = useState<1 | 2>(1);
  const [editAvatar, setEditAvatar] = useState('0');
  const [editName,   setEditName]   = useState('');
  const [editSlogan, setEditSlogan] = useState('');
  const [saving,    setSaving]    = useState(false);

  /* ── join state ── */
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining,  setJoining]  = useState(false);

  useEffect(() => {
    if (games.length > 0 && !newGame) setNewGame(games[0].name);
  }, [games]);

  /* ── open edit modal pre-filled ── */
  const openEdit = () => {
    if (!team) return;
    setEditAvatar(team.avatar ?? '0');
    setEditName(team.name ?? '');
    setEditSlogan(team.slogan ?? '');
    setEditStep(1);
    setShowEdit(true);
  };

  const resetCreate = () => {
    setCreateStep(1);
    setNewAvatar('0');
    setNewName('');
    setNewSlogan('');
    setNewGame(games[0]?.name ?? '');
    setShowCreate(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { Alert.alert('Required', 'Enter a team name.'); return; }
    if (!newGame)        { Alert.alert('Required', 'Select a game.'); return; }
    setCreating(true);
    try {
      await createTeam({ name: newName, slogan: newSlogan, avatar: newAvatar, game: newGame });
      resetCreate();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to create team.');
    }
    setCreating(false);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) { Alert.alert('Required', 'Enter a team name.'); return; }
    setSaving(true);
    try {
      await updateTeam({ name: editName, slogan: editSlogan, avatar: editAvatar });
      setShowEdit(false);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Failed to save changes.');
    }
    setSaving(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) { Alert.alert('Required', 'Enter a team code.'); return; }
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
    Alert.alert('Leave Team', 'Are you sure you want to leave?', [
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
          <SkeletonBar width="100%" height={160} radius={20} />
          <SkeletonBar width="100%" height={60} radius={14} />
          <SkeletonBar width="100%" height={60} radius={14} />
        </View>
      </View>
    );
  }

  /* ─────────────────────────────────────────────── IN A TEAM ─── */
  if (team) {
    const members   = team.team_members ?? [];
    const isCaptain = members.some(m => m.user_id === user?.id && m.role === 'captain');
    const avIdx     = avatarIndex(team.avatar);

    return (
      <View style={styles.container}>
        <ScreenHeader title="My Team" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        >
          {/* ── Banner ── */}
          <View style={styles.banner}>
            {isCaptain && (
              <TouchableOpacity style={styles.editBtn} onPress={openEdit} activeOpacity={0.8}>
                <Ionicons name="pencil" size={15} color={colors.primary} />
              </TouchableOpacity>
            )}

            <View style={styles.teamAvatarRing}>
              <AvatarSVG index={avIdx} size={72} />
            </View>

            <Text style={styles.avatarName}>{AVATAR_NAMES[avIdx]}</Text>
            <Text style={styles.teamName}>{team.name}</Text>
            {!!team.slogan && (
              <Text style={styles.teamSlogan}>"{team.slogan}"</Text>
            )}

            <View style={styles.badgeRow}>
              <View style={styles.infoBadge}>
                <Ionicons name="game-controller-outline" size={12} color={colors.text.muted} />
                <Text style={styles.infoBadgeText}>{team.game}</Text>
              </View>
              <View style={styles.infoBadge}>
                <Ionicons name="people-outline" size={12} color={colors.text.muted} />
                <Text style={styles.infoBadgeText}>{members.length}/{MAX_MEMBERS}</Text>
              </View>
            </View>

            {/* Unique code */}
            <TouchableOpacity style={styles.codeRow} onPress={() => copyCode(team.code)} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={styles.codeLabel}>TEAM CODE  (tap to copy)</Text>
                <Text style={styles.codeValue}>{team.code}</Text>
              </View>
              <Ionicons name="copy-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* ── Members ── */}
          <Text style={styles.sectionLabel}>Members ({members.length}/{MAX_MEMBERS})</Text>
          {members.map(member => {
            const u           = (member as any).users;
            const displayName = u?.name || u?.username || 'Player';
            const isSelf      = member.user_id === user?.id;
            const isCap       = member.role === 'captain';
            return (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <AvatarSVG index={avIdx} size={40} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{displayName}{isSelf ? ' (You)' : ''}</Text>
                  <Text style={styles.memberUsername}>@{u?.username || 'unknown'}</Text>
                </View>
                <View style={styles.memberRight}>
                  <View style={[styles.roleBadge, isCap && styles.roleCaptainBadge]}>
                    <Text style={[styles.roleText, isCap && styles.roleCaptainText]}>
                      {isCap ? '★ Leader' : 'Member'}
                    </Text>
                  </View>
                  {isCaptain && !isCap && (
                    <TouchableOpacity style={styles.kickBtn} onPress={() => handleRevoke(member.id, displayName)} activeOpacity={0.75}>
                      <Ionicons name="person-remove-outline" size={14} color={colors.status.error} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
            <Ionicons name="exit-outline" size={18} color={colors.status.error} />
            <Text style={styles.leaveBtnText}>Leave Team</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Edit Modal ── */}
        <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={styles.overlay}>
              <View style={styles.sheet}>
                <View style={styles.handle} />

                <View style={styles.stepRow}>
                  {([1, 2] as const).map(s => (
                    <View key={s} style={[styles.stepDot, editStep === s && styles.stepDotActive]} />
                  ))}
                </View>

                {/* Edit Step 1: Avatar */}
                {editStep === 1 && (
                  <>
                    <Text style={styles.sheetTitle}>Choose Avatar</Text>
                    <Text style={styles.sheetSub}>Pick the icon that represents your team.</Text>
                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                      <View style={styles.avatarGrid}>
                        {TEAM_AVATAR_INDICES.map(idx => (
                          <TouchableOpacity
                            key={idx}
                            style={[styles.avatarCell, editAvatar === String(idx) && styles.avatarCellActive]}
                            onPress={() => setEditAvatar(String(idx))}
                            activeOpacity={0.8}
                          >
                            <AvatarSVG index={idx} size={48} />
                            <Text style={styles.avatarCellName}>{AVATAR_NAMES[idx]}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    <TouchableOpacity style={[styles.nextBtn, { marginTop: 16 }]} onPress={() => setEditStep(2)} activeOpacity={0.85}>
                      <Text style={styles.nextBtnText}>Next</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Edit Step 2: Name + Slogan */}
                {editStep === 2 && (
                  <>
                    <View style={styles.stepAvatarPreview}>
                      <AvatarSVG index={avatarIndex(editAvatar)} size={60} />
                    </View>
                    <Text style={styles.sheetTitle}>Edit Team Info</Text>

                    <Text style={styles.inputLabel}>
                      Team Name <Text style={styles.charHint}>({editName.length}/15)</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={editName}
                      onChangeText={t => setEditName(t.slice(0, 15))}
                      placeholder="e.g. Storm Riders"
                      placeholderTextColor={colors.text.muted}
                      maxLength={15}
                      autoFocus
                    />

                    <Text style={styles.inputLabel}>
                      Slogan <Text style={styles.charHint}>({editSlogan.length}/50)</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, { height: 72 }]}
                      value={editSlogan}
                      onChangeText={t => setEditSlogan(t.slice(0, 50))}
                      placeholder="e.g. Play hard, win harder"
                      placeholderTextColor={colors.text.muted}
                      maxLength={50}
                      multiline
                    />

                    <View style={styles.stepNavRow}>
                      <TouchableOpacity style={styles.backBtn} onPress={() => setEditStep(1)} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={18} color={colors.text.secondary} />
                        <Text style={styles.backBtnText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.nextBtn, { flex: 1, opacity: saving ? 0.6 : 1 }]}
                        onPress={handleSaveEdit}
                        disabled={saving}
                        activeOpacity={0.85}
                      >
                        {saving
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <>
                              <Text style={styles.nextBtnText}>Save Changes</Text>
                              <Ionicons name="checkmark" size={18} color="#fff" />
                            </>
                        }
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEdit(false)}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  /* ──────────────────────────────────────────────── NO TEAM ─── */
  return (
    <View style={styles.container}>
      <ScreenHeader title="My Team" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.emptyState}>
          <View style={styles.emptyAvatarRing}>
            <TeamIcon size={60} />
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

      {/* ── Create Modal ── */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={resetCreate}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
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
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                    <View style={styles.avatarGrid}>
                      {TEAM_AVATAR_INDICES.map(idx => (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.avatarCell, newAvatar === String(idx) && styles.avatarCellActive]}
                          onPress={() => setNewAvatar(String(idx))}
                          activeOpacity={0.8}
                        >
                          <AvatarSVG index={idx} size={48} />
                          <Text style={styles.avatarCellName}>{AVATAR_NAMES[idx]}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                  <TouchableOpacity style={[styles.nextBtn, { marginTop: 16 }]} onPress={() => setCreateStep(2)} activeOpacity={0.85}>
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
                    <AvatarSVG index={avatarIndex(newAvatar)} size={60} />
                  </View>
                  <Text style={styles.sheetTitle}>Name Your Team</Text>

                  <Text style={styles.inputLabel}>
                    Team Name <Text style={styles.charHint}>({newName.length}/15)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={newName}
                    onChangeText={t => setNewName(t.slice(0, 15))}
                    placeholder="e.g. Storm Riders"
                    placeholderTextColor={colors.text.muted}
                    maxLength={15}
                    autoFocus
                  />

                  <Text style={styles.inputLabel}>
                    Slogan <Text style={styles.charHint}>({newSlogan.length}/50)</Text>
                  </Text>
                  <TextInput
                    style={[styles.input, { height: 72 }]}
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
                    <AvatarSVG index={avatarIndex(newAvatar)} size={60} />
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
                    <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
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
                    </ScrollView>
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

      {/* ── Join Modal ── */}
      <Modal visible={showJoin} animationType="slide" transparent onRequestClose={() => { setShowJoin(false); setJoinCode(''); }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>Join a Team</Text>
              <Text style={styles.sheetSub}>Enter the unique code shared by your team leader.</Text>

              <Text style={styles.inputLabel}>Team Code</Text>
              <TextInput
                style={[styles.input, { textTransform: 'uppercase', letterSpacing: 3, fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' }]}
                value={joinCode}
                onChangeText={t => setJoinCode(t.toUpperCase())}
                placeholder="AB12CD34"
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
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll:    { padding: 16 },

    /* ── banner ── */
    banner: {
      backgroundColor: colors.background.card, borderRadius: 20,
      alignItems: 'center', padding: 24, marginBottom: 20,
      borderWidth: 1, borderColor: colors.border.default,
    },
    editBtn: {
      position: 'absolute', top: 14, right: 14,
      width: 34, height: 34, borderRadius: 17,
      backgroundColor: 'rgba(238,61,45,0.12)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.primary,
    },
    teamAvatarRing: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: 'rgba(238,61,45,0.08)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 10, borderWidth: 2, borderColor: colors.primary,
    },
    avatarName:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primary, letterSpacing: 1.2, marginBottom: 4, textTransform: 'uppercase' },
    teamName:    { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 4, textAlign: 'center' },
    teamSlogan:  { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', fontStyle: 'italic', marginBottom: 12 },

    badgeRow:     { flexDirection: 'row', gap: 8, marginBottom: 16 },
    infoBadge:    {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: colors.background.elevated, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
      borderWidth: 1, borderColor: colors.border.default,
    },
    infoBadgeText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text.secondary },

    codeRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.elevated, borderRadius: 12,
      paddingHorizontal: 16, paddingVertical: 12, width: '100%',
      borderWidth: 1, borderColor: colors.border.default,
    },
    codeLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, letterSpacing: 1.2, marginBottom: 2 },
    codeValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.primary, letterSpacing: 3 },

    /* ── members ── */
    sectionLabel: {
      fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text.muted,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2,
    },
    memberRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.card, borderRadius: 14, padding: 12,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border.subtle,
    },
    memberAvatar:    { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center' },
    memberName:      { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    memberUsername:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginTop: 2 },
    memberRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
    roleBadge:       { backgroundColor: colors.background.elevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    roleCaptainBadge:{ backgroundColor: 'rgba(238,61,45,0.12)', borderWidth: 1, borderColor: colors.primary },
    roleText:        { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.text.muted },
    roleCaptainText: { color: colors.primary },
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
    emptyState:   { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
    emptyAvatarRing: {
      width: 104, height: 104, borderRadius: 52,
      backgroundColor: 'rgba(238,61,45,0.08)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 20, borderWidth: 2, borderColor: colors.primary,
    },
    emptyTitle:   { fontSize: 24, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 10 },
    emptyText:    { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    emptyActions: { width: '100%', gap: 12 },
    createBtn:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, height: 54 },
    createBtnText:{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
    joinBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(238,61,45,0.1)', borderRadius: 14, height: 54, borderWidth: 1, borderColor: colors.primary },
    joinBtnText:  { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.primary },

    /* ── modal sheet ── */
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet:   { backgroundColor: colors.background.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
    handle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border.default, alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 6, textAlign: 'center' },
    sheetSub:   { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center', marginBottom: 20 },

    stepRow:       { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    stepDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border.default },
    stepDotActive: { backgroundColor: colors.primary, width: 24 },

    stepAvatarPreview: { alignSelf: 'center', marginBottom: 12 },

    /* ── avatar grid ── */
    avatarGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingBottom: 8 },
    avatarCell:      { width: 80, height: 88, borderRadius: 16, backgroundColor: colors.background.elevated, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', paddingVertical: 8 },
    avatarCellActive:{ borderColor: colors.primary, backgroundColor: 'rgba(238,61,45,0.1)' },
    avatarCellName:  { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

    /* ── inputs ── */
    inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
    charHint:   { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted, textTransform: 'none', letterSpacing: 0 },
    input:      { backgroundColor: colors.background.elevated, borderRadius: 12, height: 52, paddingHorizontal: 16, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text.primary, borderWidth: 1, borderColor: colors.border.default, marginBottom: 18 },

    /* ── game list ── */
    gameList:            { gap: 10, paddingBottom: 8 },
    gameOption:          { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background.elevated, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.border.default },
    gameOptionActive:    { borderColor: colors.primary, backgroundColor: 'rgba(238,61,45,0.08)' },
    gameOptionText:      { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    gameOptionTextActive:{ color: colors.primary, fontFamily: 'Inter_600SemiBold' },

    /* ── navigation ── */
    stepNavRow:  { flexDirection: 'row', gap: 10, marginBottom: 12 },
    nextBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: 14, height: 52 },
    nextBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
    backBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.background.elevated, borderRadius: 14, height: 52, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.border.default },
    backBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    cancelBtn:   { alignItems: 'center', padding: 14 },
    cancelText:  { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text.muted },

    noGamesBox:  { backgroundColor: colors.background.elevated, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border.default },
    noGamesText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center' },
  });
}
