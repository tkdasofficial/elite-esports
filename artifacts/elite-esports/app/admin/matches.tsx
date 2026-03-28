import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';
import { Match } from '@/utils/types';
import { adaptMatch } from '@/services/dbAdapters';
import { useGames } from '@/features/games/hooks/useGames';
import { Game } from '@/utils/types';

const STATUS_COLORS: Record<string, string> = {
  upcoming: '#3B82F6', ongoing: '#22C55E', completed: '#666', cancelled: '#EF4444',
};

type FormData = {
  title: string; game: string; entry_fee: string; prize_pool: string;
  max_players: string; stream_url: string;
};

const EMPTY_FORM: FormData = {
  title: '', game: '', entry_fee: '', prize_pool: '',
  max_players: '', stream_url: '',
};

export default function AdminMatchesScreen() {
  const insets = useSafeAreaInsets();
  const { games } = useGames();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editMatchDbId, setEditMatchDbId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select('*, games(name, banner_url)')
      .order('created_at', { ascending: false });
    setMatches((data ?? []).map(adaptMatch));
    setLoading(false);
  };

  const openCreate = () => {
    setEditMatch(null);
    setEditMatchDbId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (m: Match) => {
    setEditMatch(m);
    setEditMatchDbId(m.id);
    setForm({
      title: m.title,
      game: m.game,
      entry_fee: String(m.entry_fee),
      prize_pool: String(m.prize_pool),
      max_players: String(m.max_players),
      stream_url: m.stream_url ?? '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.game.trim()) {
      Alert.alert('Required', 'Title and game are required.'); return;
    }
    setSaving(true);

    const selectedGame: Game | undefined = games.find(g => g.name === form.game);
    if (!selectedGame) {
      Alert.alert('Error', 'Please select a valid game.'); setSaving(false); return;
    }

    const payload: any = {
      title: form.title.trim(),
      game_id: selectedGame.id,
      entry_fee: parseFloat(form.entry_fee) || 0,
      prize_pool: parseFloat(form.prize_pool) || 0,
      max_players: parseInt(form.max_players) || 2,
      live_stream_url: form.stream_url.trim() || null,
      status: editMatch?.status ?? 'upcoming',
    };

    if (editMatchDbId) {
      await supabase.from('matches').update(payload).eq('id', editMatchDbId);
    } else {
      await supabase.from('matches').insert({ ...payload, joined_players: 0 });
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  const handleStatus = async (m: Match, status: Match['status']) => {
    await supabase.from('matches').update({ status }).eq('id', m.id);
    load();
  };

  const handleDelete = (m: Match) => {
    Alert.alert('Delete Match', `Delete "${m.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await supabase.from('matches').delete().eq('id', m.id); load(); } },
    ]);
  };

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChangeText: (v: string) => setForm(p => ({ ...p, [key]: v })),
  });

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Matches"
        rightElement={
          <TouchableOpacity onPress={openCreate} style={styles.addBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        }
      />
      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={<Text style={styles.empty}>No matches yet.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchTitle}>{item.title}</Text>
                  <Text style={styles.matchGame}>{item.game}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[item.status] + '22' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.stat}>₹{item.entry_fee} entry</Text>
                <Text style={styles.statDot}>·</Text>
                <Text style={styles.stat}>Pool ₹{item.prize_pool}</Text>
                <Text style={styles.statDot}>·</Text>
                <Text style={styles.stat}>{item.players_joined}/{item.max_players}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)} activeOpacity={0.8}>
                  <Ionicons name="pencil-outline" size={14} color={Colors.text.secondary} />
                  <Text style={styles.actionTxt}>Edit</Text>
                </TouchableOpacity>
                {(['upcoming', 'ongoing', 'completed', 'cancelled'] as Match['status'][]).map(s => (
                  item.status !== s && (
                    <TouchableOpacity key={s} style={styles.actionBtn} onPress={() => handleStatus(item, s)} activeOpacity={0.8}>
                      <Text style={[styles.actionTxt, { color: STATUS_COLORS[s] }]}>{s}</Text>
                    </TouchableOpacity>
                  )
                ))}
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item)} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={14} color={Colors.status.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowForm(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editMatch ? 'Edit Match' : 'Create Match'}</Text>
            <TouchableOpacity onPress={() => setShowForm(false)}><Ionicons name="close" size={22} color={Colors.text.primary} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Field label="Title" placeholder="Match title" {...field('title')} />
            <Text style={styles.fieldLabel}>Game</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {games.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.gameChip, form.game === g.name && styles.gameChipActive]}
                    onPress={() => setForm(p => ({ ...p, game: g.name }))}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.gameChipText, form.game === g.name && styles.gameChipTextActive]}>{g.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.row}>
              <View style={{ flex: 1 }}><Field label="Entry Fee ₹" placeholder="0" {...field('entry_fee')} numeric /></View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 1 }}><Field label="Prize Pool ₹" placeholder="0" {...field('prize_pool')} numeric /></View>
            </View>
            <Field label="Max Players" placeholder="100" {...field('max_players')} numeric />
            <Field label="Stream URL" placeholder="https://youtube.com/..." {...field('stream_url')} />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.disabled]}
              onPress={handleSave} disabled={saving} activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editMatch ? 'Update Match' : 'Create Match'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, placeholder, value, onChangeText, numeric, multiline }: {
  label: string; placeholder: string; value: string; onChangeText: (v: string) => void;
  numeric?: boolean; multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</Text>
      <View style={[{ backgroundColor: Colors.background.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 12 }, multiline && { height: 80 }]}>
        <TextInput
          style={{ color: Colors.text.primary, fontSize: 14, fontFamily: 'Inter_400Regular', paddingVertical: 12 }}
          value={value} onChangeText={onChangeText} placeholder={placeholder}
          placeholderTextColor={Colors.text.muted}
          keyboardType={numeric ? 'numeric' : 'default'}
          multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(254,76,17,0.1)', borderRadius: 12 },
  card: { backgroundColor: Colors.background.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border.default },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  matchTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  matchGame: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, marginTop: 2 },
  statusChip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'capitalize' },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  stat: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary },
  statDot: { color: Colors.text.muted },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background.elevated, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  actionTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary, textTransform: 'capitalize' },
  empty: { color: Colors.text.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_400Regular' },
  modal: { flex: 1, backgroundColor: Colors.background.dark },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  modalBody: { padding: 20 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  row: { flexDirection: 'row' },
  gameChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.background.card, borderWidth: 1, borderColor: Colors.border.default },
  gameChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  gameChipText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.text.muted },
  gameChipTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
