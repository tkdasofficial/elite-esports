import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { useGameStore } from '@/src/store/gameStore';
import { Colors } from '@/src/theme/colors';

export default function AddGame() {
  const insets = useSafeAreaInsets();
  const { addGameProfile } = useUserStore();
  const { games } = useGameStore();
  const activeGames = games.filter(g => g.status === 'active');

  const [selectedGame, setSelectedGame] = useState('');
  const [ign, setIgn] = useState('');
  const [uid, setUid] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!selectedGame) { Alert.alert('Select a game'); return; }
    if (!ign.trim()) { Alert.alert('Enter your In-Game Name'); return; }
    if (!uid.trim()) { Alert.alert('Enter your User ID'); return; }

    setLoading(true);
    await addGameProfile({ gameName: selectedGame, ign: ign.trim(), uid: uid.trim() });
    setLoading(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.brandPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Game Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>SELECT GAME</Text>
        <View style={styles.gamesGrid}>
          {activeGames.map(game => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameChip, selectedGame === game.name && styles.gameChipActive]}
              onPress={() => setSelectedGame(game.name)}
            >
              <Ionicons name="game-controller" size={20} color={selectedGame === game.name ? Colors.white : Colors.textSecondary} />
              <Text style={[styles.gameChipText, selectedGame === game.name && styles.gameChipTextActive]}>{game.name}</Text>
            </TouchableOpacity>
          ))}
          {activeGames.length === 0 && (
            <Text style={styles.noGames}>No games available. Admin will add games soon.</Text>
          )}
        </View>

        <Text style={[styles.sectionLabel, styles.mt]}>GAME DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>In-Game Name (IGN)</Text>
            <TextInput
              style={styles.input}
              value={ign}
              onChangeText={setIgn}
              placeholder="Your in-game nickname"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>User ID / Player ID</Text>
            <TextInput
              style={styles.input}
              value={uid}
              onChangeText={setUid}
              placeholder="Your unique game ID"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && styles.disabled]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Add Game Profile</Text>}
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
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06 },
  mt: { marginTop: 12 },
  gamesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gameChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.appCard, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.appBorder,
  },
  gameChipActive: { backgroundColor: Colors.brandPrimary, borderColor: Colors.brandPrimary },
  gameChipText: { fontSize: 15, color: Colors.textSecondary },
  gameChipTextActive: { color: Colors.white, fontWeight: '600' },
  noGames: { fontSize: 15, color: Colors.textMuted },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '500' },
  input: { fontSize: 16, color: Colors.textPrimary, paddingVertical: 4 },
  divider: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 16 },
  saveBtn: {
    height: 54, backgroundColor: Colors.brandPrimary, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.4 },
});
