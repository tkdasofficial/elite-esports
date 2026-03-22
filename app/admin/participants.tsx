import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchStore } from '@/src/store/matchStore';
import { LetterAvatar } from '@/components/LetterAvatar';
import { Colors } from '@/src/theme/colors';

type WinnerSlot = 'first' | 'second' | 'third';
const WINNER_CONFIG: Record<WinnerSlot, { label: string; medal: string; color: string }> = {
  first:  { label: '1st Place', medal: '🥇', color: '#FFD700' },
  second: { label: '2nd Place', medal: '🥈', color: '#C0C0C0' },
  third:  { label: '3rd Place', medal: '🥉', color: '#CD7F32' },
};

export default function AdminParticipants() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMatchById, setMatchWinners } = useMatchStore() as any;
  const match = getMatchById?.(id ?? '');
  const participants: any[] = match?.participants ?? [];

  const [winners, setWinners] = useState<Record<string, any>>(match?.winners ?? {});
  const [selecting, setSelecting] = useState<WinnerSlot | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await setMatchWinners?.(id, winners);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    Alert.alert('Saved', 'Winners have been saved.');
  };

  if (!match) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Match not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{match.title}</Text>
          <Text style={styles.headerSub}>{participants.length} participants</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.winnerRow}>
        {(Object.entries(WINNER_CONFIG) as [WinnerSlot, typeof WINNER_CONFIG[WinnerSlot]][]).map(([slot, cfg]) => (
          <TouchableOpacity
            key={slot}
            style={styles.winnerSlot}
            onPress={() => setSelecting(slot)}
          >
            <Text style={styles.winnerMedal}>{cfg.medal}</Text>
            <Text style={styles.winnerLabel}>{cfg.label}</Text>
            <Text style={[styles.winnerName, { color: cfg.color }]} numberOfLines={1}>
              {winners[slot]?.username ?? 'Unset'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={participants}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const isWinner = Object.values(winners).some(w => w?.username === item.username);
          const winnerSlot = Object.entries(winners).find(([, w]) => w?.username === item.username)?.[0];
          return (
            <View style={styles.row}>
              <LetterAvatar name={item.username ?? '?'} size={38} />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.username}</Text>
                <Text style={styles.rowEmail}>{item.email ?? item.uid ?? '—'}</Text>
              </View>
              {isWinner && winnerSlot && (
                <Text style={styles.winnerBadge}>
                  {WINNER_CONFIG[winnerSlot as WinnerSlot]?.medal}
                </Text>
              )}
            </View>
          );
        }}
      />

      <Modal visible={!!selecting} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selecting ? WINNER_CONFIG[selecting].label : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelecting(null)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalList}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  if (selecting) setWinners(w => { const n = { ...w }; delete n[selecting]; return n; });
                  setSelecting(null);
                }}
              >
                <Text style={styles.clearBtnText}>Clear Winner</Text>
              </TouchableOpacity>
              {participants.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.participantRow}
                  onPress={() => {
                    if (selecting) setWinners(w => ({ ...w, [selecting]: p }));
                    setSelecting(null);
                  }}
                >
                  <LetterAvatar name={p.username ?? '?'} size={36} />
                  <Text style={styles.participantName}>{p.username}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: {
    height: 56, flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  headerBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted },
  saveBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.brandPrimary, borderRadius: 10,
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  winnerRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  winnerSlot: {
    flex: 1, backgroundColor: Colors.appCard, borderRadius: 12,
    padding: 10, alignItems: 'center', gap: 4,
  },
  winnerMedal: { fontSize: 20 },
  winnerLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  winnerName: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  list: { paddingBottom: 40 },
  separator: { height: 1, backgroundColor: Colors.appBorder },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, color: Colors.textPrimary },
  rowEmail: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  winnerBadge: { fontSize: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  backBtn: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 8 },
  backText: { fontSize: 17, color: Colors.brandPrimary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.appCard, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '70%', paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.appBorder,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  modalList: { padding: 16, gap: 4 },
  clearBtn: {
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
    backgroundColor: Colors.appElevated, alignItems: 'center', marginBottom: 8,
  },
  clearBtnText: { fontSize: 14, color: Colors.brandLive, fontWeight: '500' },
  participantRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 8,
  },
  participantName: { fontSize: 15, color: Colors.textPrimary },
});
