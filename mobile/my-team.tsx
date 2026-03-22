import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

function BottomSheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function MyTeam() {
  const insets = useSafeAreaInsets();
  const { team, createTeam, joinTeam, leaveTeam } = useUserStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin,   setShowJoin]   = useState(false);
  const [teamName,   setTeamName]   = useState('');
  const [teamTag,    setTeamTag]    = useState('');
  const [joinId,     setJoinId]     = useState('');

  const handleCreate = () => {
    if (!teamName.trim()) { Alert.alert('Team name required'); return; }
    if (!teamTag.trim())  { Alert.alert('Team tag required'); return; }
    createTeam(teamName.trim(), teamTag.trim().toUpperCase());
    setShowCreate(false); setTeamName(''); setTeamTag('');
  };

  const handleJoin = () => {
    if (!joinId.trim()) { Alert.alert('Team ID required'); return; }
    joinTeam(joinId.trim().toUpperCase(), '', '');
    setShowJoin(false); setJoinId('');
  };

  const handleLeave = () => {
    Alert.alert('Leave Team', 'Are you sure you want to leave your team?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: leaveTeam },
    ]);
  };

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
        {!team ? (
          /* No team state */
          <View style={styles.noTeam}>
            <View style={styles.noTeamIconWrap}>
              <Ionicons name="people" size={40} color={Colors.brandPrimary} />
            </View>
            <Text style={styles.noTeamTitle}>Squad Up!</Text>
            <Text style={styles.noTeamSub}>Compete in team tournaments and dominate the leaderboard</Text>

            <View style={styles.actionList}>
              <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
                <View style={styles.createBtnIcon}>
                  <Ionicons name="add" size={24} color={Colors.brandPrimary} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.actionBtnTitle}>Create Team</Text>
                  <Text style={styles.actionBtnSub}>Start your own legacy</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoin(true)}>
                <View style={styles.joinBtnIcon}>
                  <Ionicons name="search" size={24} color={Colors.brandCyan} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.actionBtnTitle}>Join Team</Text>
                  <Text style={styles.actionBtnSub}>Find your perfect squad</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Team view */
          <View style={styles.teamView}>
            {/* Team card */}
            <View style={styles.teamCard}>
              <View style={styles.teamCardTop}>
                <View style={styles.teamCardIconWrap}>
                  <Ionicons name="people" size={22} color={Colors.white} />
                </View>
              </View>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamId}>Team ID: #{team.id}</Text>
              <View style={styles.teamStats}>
                <View style={styles.teamStat}>
                  <Text style={styles.teamStatLabel}>Members</Text>
                  <Text style={styles.teamStatValue}>{team.members.length}/5</Text>
                </View>
                <View style={styles.teamStat}>
                  <Text style={styles.teamStatLabel}>Tag</Text>
                  <Text style={styles.teamStatValue}>{team.tag}</Text>
                </View>
              </View>
            </View>

            {/* Members */}
            <Text style={styles.sectionLabel}>TEAM MEMBERS</Text>
            <View style={styles.card}>
              {team.members.map((m, i) => (
                <View key={m.id} style={[styles.memberRow, i > 0 && styles.divider]}>
                  <View style={{ position: 'relative' }}>
                    <LetterAvatar name={m.username} size="sm" />
                    {m.role === 'Leader' && (
                      <View style={styles.crownBadge}>
                        <Text style={{ fontSize: 8 }}>👑</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.memberName}>{m.username}</Text>
                    <Text style={styles.memberRole}>{m.role} · {m.rank}</Text>
                  </View>
                  {m.role !== 'Leader' && (
                    <TouchableOpacity style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnText}>Leave Team</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      {/* Create modal */}
      <BottomSheet visible={showCreate} onClose={() => setShowCreate(false)} title="Create Team">
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Team Name</Text>
          <TextInput
            style={styles.input}
            value={teamName}
            onChangeText={setTeamName}
            placeholder="e.g. Elite Squad"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Team Tag (max 5 chars)</Text>
          <TextInput
            style={styles.input}
            value={teamTag}
            onChangeText={t => setTeamTag(t.toUpperCase())}
            placeholder="e.g. ELITE"
            placeholderTextColor={Colors.textMuted}
            maxLength={5}
          />
        </View>
        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate}>
            <Text style={styles.confirmBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Join modal */}
      <BottomSheet visible={showJoin} onClose={() => setShowJoin(false)} title="Join Team">
        <View style={styles.formField}>
          <Text style={styles.fieldLabel}>Team ID</Text>
          <TextInput
            style={styles.input}
            value={joinId}
            onChangeText={t => setJoinId(t.toUpperCase())}
            placeholder="e.g. ELITE-9921"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <View style={styles.sheetBtns}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowJoin(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleJoin}>
            <Text style={styles.confirmBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  scroll: { paddingHorizontal: 16, paddingTop: 20 },
  noTeam: { alignItems: 'center', gap: 16, paddingTop: 40 },
  noTeamIconWrap: {
    width: 88, height: 88,
    backgroundColor: `${Colors.brandPrimary}15`,
    borderWidth: 1, borderColor: `${Colors.brandPrimary}25`,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
  },
  noTeamTitle: { fontSize: 22, fontWeight: '600', color: Colors.textPrimary, letterSpacing: -0.5 },
  noTeamSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20, lineHeight: 22 },
  actionList: { width: '100%', gap: 12, marginTop: 8 },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20,
    backgroundColor: `${Colors.brandPrimary}10`,
    borderWidth: 1, borderColor: `${Colors.brandPrimary}25`, borderRadius: 18,
  },
  createBtnIcon: { width: 48, height: 48, backgroundColor: `${Colors.brandPrimary}20`, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20,
    backgroundColor: Colors.appCard, borderWidth: 1, borderColor: Colors.appBorder, borderRadius: 18,
  },
  joinBtnIcon: { width: 48, height: 48, backgroundColor: Colors.appElevated, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionBtnTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  actionBtnSub: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  flex1: { flex: 1 },
  teamView: { gap: 16 },
  teamCard: {
    borderRadius: 22, overflow: 'hidden', padding: 20,
    backgroundColor: '#16213e',
    borderWidth: 1, borderColor: 'rgba(94,92,230,0.2)',
  },
  teamCardTop: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  teamCardIconWrap: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  teamName: { fontSize: 22, fontWeight: '700', color: Colors.white, letterSpacing: -0.5 },
  teamId: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  teamStats: { flexDirection: 'row', gap: 12, marginTop: 16 },
  teamStat: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  teamStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  teamStatValue: { fontSize: 15, fontWeight: '600', color: Colors.white },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  divider: { borderTopWidth: 1, borderTopColor: Colors.appBorder },
  crownBadge: { position: 'absolute', top: -6, right: -6 },
  memberName: { fontSize: 16, color: Colors.textPrimary },
  memberRole: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  removeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  leaveBtn: { paddingVertical: 14, backgroundColor: Colors.appCard, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.appBorder },
  leaveBtnText: { fontSize: 16, color: Colors.brandLive },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: { backgroundColor: Colors.appCard, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 5, backgroundColor: Colors.appElevated, borderRadius: 3, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '600', color: Colors.textPrimary, marginBottom: 20 },
  formField: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.appElevated, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 16,
    fontSize: 16, color: Colors.textPrimary,
  },
  sheetBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, backgroundColor: Colors.appElevated, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.appBorder },
  cancelBtnText: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  confirmBtn: { flex: 1, paddingVertical: 14, backgroundColor: Colors.brandPrimary, borderRadius: 14, alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
});
