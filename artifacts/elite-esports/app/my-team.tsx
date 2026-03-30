import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useMyTeam } from '@/features/team/hooks/useMyTeam';
import { useAuth } from '@/store/AuthContext';
import { supabase } from '@/services/supabase';
import { useGames } from '@/features/games/hooks/useGames';

const AVATARS = ['🎮', '⚡', '🔥', '💀', '🎯', '🛡️', '⚔️', '🏆'];

export default function MyTeamScreen() {
  const { user } = useAuth();
  const { team, loading, refreshing, refresh } = useMyTeam(user?.id);
  const { games, loading: gamesLoading } = useGames();
  const insets = useSafeAreaInsets();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (games.length > 0 && !selectedGame) {
      setSelectedGame(games[0].name);
    }
  }, [games]);

  const handleCreate = async () => {
    if (!teamName.trim() || !teamTag.trim()) {
      Alert.alert('Required', 'Please fill in team name and tag.');
      return;
    }
    if (!selectedGame) {
      Alert.alert('No Games', 'No games have been added yet. Ask the admin to add games first.');
      return;
    }
    if (teamTag.length > 5) {
      Alert.alert('Too Long', 'Team tag must be 5 characters or fewer.');
      return;
    }
    if (!user) return;
    setCreating(true);
    const { data: newTeam, error: teamErr } = await supabase
      .from('teams')
      .insert({ name: teamName.trim(), tag: teamTag.trim().toUpperCase(), game: selectedGame, created_by: user.id })
      .select()
      .single();
    if (teamErr) {
      Alert.alert('Error', teamErr.message);
      setCreating(false);
      return;
    }
    const { error: memberErr } = await supabase
      .from('team_members')
      .insert({ team_id: newTeam.id, user_id: user.id, role: 'captain' });
    if (memberErr) {
      Alert.alert('Error', memberErr.message);
    } else {
      setShowCreate(false);
      setTeamName('');
      setTeamTag('');
      refresh();
    }
    setCreating(false);
  };

  const handleLeave = () => {
    Alert.alert('Leave Team', 'Are you sure you want to leave this team?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          if (!user || !team) return;
          await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', user.id);
          refresh();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="My Team" />
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Team" />

      {team ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />}
        >
          {/* Team Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <Ionicons name="shield" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.teamName}>{team.name}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>[{team.tag}]</Text>
              </View>
              <View style={styles.gameBadge}>
                <Text style={styles.gameText}>{team.game}</Text>
              </View>
            </View>
          </View>

          {/* Members */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Members</Text>
            {(team.team_members ?? []).map((member, i) => {
              const u = (member as any).users;
              return (
                <View key={member.id ?? i} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberEmoji}>{AVATARS[i % AVATARS.length]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{u?.name || u?.username || 'Player'}</Text>
                    <Text style={styles.memberUsername}>@{u?.username || 'unknown'}</Text>
                  </View>
                  <View style={[styles.roleBadge, member.role === 'captain' && styles.roleCaptain]}>
                    <Text style={[styles.roleText, member.role === 'captain' && styles.roleTextCaptain]}>
                      {member.role === 'captain' ? '★ Captain' : 'Member'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} activeOpacity={0.8}>
            <Ionicons name="exit-outline" size={18} color={Colors.status.error} />
            <Text style={styles.leaveBtnText}>Leave Team</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={52} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Team Yet</Text>
            <Text style={styles.emptyText}>
              Create your own team or ask a team captain to invite you
            </Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Create Team</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Create Team Modal */}
      <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Create Team</Text>

              <Text style={styles.inputLabel}>Team Name</Text>
              <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="e.g. Storm Riders"
                placeholderTextColor={Colors.text.muted}
                maxLength={30}
              />

              <Text style={styles.inputLabel}>Tag (max 5 chars)</Text>
              <TextInput
                style={styles.input}
                value={teamTag}
                onChangeText={t => setTeamTag(t.toUpperCase())}
                placeholder="e.g. STRM"
                placeholderTextColor={Colors.text.muted}
                maxLength={5}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>Game</Text>
              {gamesLoading ? (
                <ActivityIndicator color={Colors.primary} style={{ marginBottom: 20 }} />
              ) : games.length === 0 ? (
                <View style={styles.noGamesWrap}>
                  <Text style={styles.noGamesText}>No games available. Ask the admin to add games first.</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {games.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.gamePill, selectedGame === g.name && styles.gamePillActive]}
                      onPress={() => setSelectedGame(g.name)}
                    >
                      <Text style={[styles.gamePillText, selectedGame === g.name && styles.gamePillTextActive]}>{g.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.createBtnModal, creating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.85}
              >
                {creating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.createBtnText}>Create Team</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16 },

  banner: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    alignItems: 'center',
    padding: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  bannerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(254,76,17,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  teamName: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8 },
  tagBadge: {
    backgroundColor: 'rgba(254,76,17,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tagText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary },
  gameBadge: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  gameText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },

  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberEmoji: { fontSize: 22 },
  memberName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  memberUsername: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  roleBadge: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleCaptain: { backgroundColor: 'rgba(254,76,17,0.12)', borderWidth: 1, borderColor: Colors.primary },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  roleTextCaptain: { color: Colors.primary },

  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 14,
    height: 52,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  leaveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Colors.status.error },

  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 10 },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 28,
    height: 52,
  },
  createBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border.default,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 20 },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginBottom: 16,
  },
  gamePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.elevated,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginRight: 8,
  },
  gamePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  gamePillText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  gamePillTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },
  createBtnModal: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cancelBtn: { alignItems: 'center', padding: 14 },
  cancelText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text.muted },

  noGamesWrap: {
    backgroundColor: Colors.background.elevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  noGamesText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },
});
