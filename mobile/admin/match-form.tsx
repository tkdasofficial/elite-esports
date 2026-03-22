import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMatchStore } from '@/src/store/matchStore';
import { useGameStore } from '@/src/store/gameStore';
import { Colors } from '@/src/theme/colors';

const MODES: Array<'1v1' | '2v2' | '4v4' | 'Squad'> = ['1v1', '2v2', '4v4', 'Squad'];
const STATUSES = ['upcoming', 'live', 'completed'];

export default function AdminMatchForm() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { getMatchById, addMatch, updateMatch } = useMatchStore();
  const { games } = useGameStore();
  const activeGames = games.filter(g => g.status === 'active');
  const existing = id ? getMatchById(id) : null;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: existing?.title || '',
    game_name: existing?.game_name || '',
    mode: (existing?.mode as '1v1' | '2v2' | '4v4' | 'Squad') || '1v1' as const,
    prize: existing?.prize || '',
    entry_fee: existing?.entry_fee || '',
    start_time: existing?.start_time || '',
    slots_total: existing?.slots_total?.toString() || '100',
    banner_image: existing?.banner_image || '',
    status: existing?.status || 'upcoming',
    team1_name: existing?.team1_name || '',
    team2_name: existing?.team2_name || '',
    team1_logo: existing?.team1_logo || '',
    team2_logo: existing?.team2_logo || '',
    room_id: (existing as any)?.room_id || '',
    room_password: (existing as any)?.room_password || '',
  });

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.game_name || !form.prize.trim() || !form.entry_fee.trim()) {
      Alert.alert('Fill all required fields'); return;
    }
    setLoading(true);
    const payload = {
      ...form,
      slots_total: parseInt(form.slots_total) || 100,
      slots_filled: existing?.slots_filled || 0,
    };
    if (id) {
      await updateMatch(id, payload as any);
    } else {
      await addMatch(payload as any);
    }
    setLoading(false);
    router.back();
  };

  const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false }: any) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );

  const Picker = ({ label, options, value, onChange }: any) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
        {options.map((opt: string) => (
          <TouchableOpacity key={opt} style={[styles.pickerChip, value === opt && styles.pickerChipActive]} onPress={() => onChange(opt)}>
            <Text style={[styles.pickerChipText, value === opt && styles.pickerChipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{id ? 'Edit Match' : 'Create Match'}</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.brandPrimary} size="small" /> : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Field label="Title *" value={form.title} onChangeText={set('title')} placeholder="Match title" />
          <View style={styles.divider} />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Game *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
              {activeGames.map(g => (
                <TouchableOpacity key={g.id} style={[styles.pickerChip, form.game_name === g.name && styles.pickerChipActive]} onPress={() => set('game_name')(g.name)}>
                  <Text style={[styles.pickerChipText, form.game_name === g.name && styles.pickerChipTextActive]}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.divider} />
          <Picker label="Mode" options={MODES} value={form.mode} onChange={set('mode')} />
          <View style={styles.divider} />
          <Picker label="Status" options={STATUSES} value={form.status} onChange={set('status')} />
        </View>

        <View style={styles.card}>
          <Field label="Prize *" value={form.prize} onChangeText={set('prize')} placeholder="₹1000" />
          <View style={styles.divider} />
          <Field label="Entry Fee *" value={form.entry_fee} onChangeText={set('entry_fee')} placeholder="₹50 or Free" />
          <View style={styles.divider} />
          <Field label="Start Time" value={form.start_time} onChangeText={set('start_time')} placeholder="e.g. 9:00 PM" />
          <View style={styles.divider} />
          <Field label="Total Slots" value={form.slots_total} onChangeText={set('slots_total')} placeholder="100" keyboardType="numeric" />
        </View>

        <View style={styles.card}>
          <Field label="Banner Image URL" value={form.banner_image} onChangeText={set('banner_image')} placeholder="https://..." />
          <View style={styles.divider} />
          <Field label="Room ID" value={form.room_id} onChangeText={set('room_id')} placeholder="Room ID" />
          <View style={styles.divider} />
          <Field label="Room Password" value={form.room_password} onChangeText={set('room_password')} placeholder="Password" />
        </View>

        <TouchableOpacity style={[styles.submitBtn, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitBtnText}>{id ? 'Update Match' : 'Create Match'}</Text>}
        </TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  saveBtn: { fontSize: 17, color: Colors.brandPrimary, fontWeight: '500' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  fieldContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '500' },
  fieldInput: { fontSize: 16, color: Colors.textPrimary, paddingVertical: 4 },
  fieldMultiline: { height: 72, paddingTop: 4 },
  divider: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 16 },
  pickerRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  pickerChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.appElevated, borderRadius: 20, borderWidth: 1, borderColor: Colors.appBorder },
  pickerChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  pickerChipText: { fontSize: 14, color: Colors.textSecondary, textTransform: 'capitalize' },
  pickerChipTextActive: { color: Colors.white },
  submitBtn: { height: 54, backgroundColor: Colors.brandPrimary, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.4 },
});
