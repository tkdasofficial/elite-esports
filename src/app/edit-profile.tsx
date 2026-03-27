import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

const AVATARS = ['🎮', '⚡', '🔥', '💀', '🎯', '🛡️', '⚔️', '🏆'];
const GAMES = ['BGMI', 'Free Fire', 'COD Mobile', 'Valorant', 'PUBG PC'];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { profile, loading, save } = useProfile(user?.id);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [games, setGames] = useState<{ game: string; uid: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      setName(profile.full_name || '');
      setUsername(profile.username || '');
      setAvatarIndex(profile.avatar_index ?? 0);
      setGames(profile.games || []);
      setInitialized(true);
    }
  }, [loading, initialized]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Display name cannot be empty'); return; }
    if (!username.trim()) { Alert.alert('Required', 'Username cannot be empty'); return; }
    setSaving(true);
    const { error } = await save({ full_name: name.trim(), username: username.trim().toLowerCase(), avatar_index: avatarIndex, games });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Saved!', 'Profile updated successfully'); router.back(); }
  };

  const addGame = () => {
    const nextGame = GAMES[games.length % GAMES.length] || '';
    setGames(prev => [...prev, { game: nextGame, uid: '' }]);
  };

  if (loading) {
    return <View style={[styles.centered, { backgroundColor: Colors.background.dark }]}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Avatar</Text>
        <View style={styles.avatarGrid}>
          {AVATARS.map((emoji, i) => (
            <TouchableOpacity key={i} style={[styles.avatarOption, avatarIndex === i && styles.avatarSelected]} onPress={() => setAvatarIndex(i)} activeOpacity={0.8}>
              <Text style={styles.avatarEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Display Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={Colors.text.muted} autoCapitalize="words" />
        </View>

        <Text style={styles.sectionLabel}>Username</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="@username" placeholderTextColor={Colors.text.muted} autoCapitalize="none" />
        </View>

        <View style={styles.gamesHeader}>
          <Text style={styles.sectionLabel}>Game IDs</Text>
          <TouchableOpacity onPress={addGame} style={styles.addBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
        {games.map((g, i) => (
          <View key={i} style={styles.gameRow}>
            <View style={styles.gameInputs}>
              <View style={[styles.inputWrapper, { flex: 0.45 }]}>
                <TextInput style={styles.input} value={g.game} onChangeText={v => setGames(prev => prev.map((item, idx) => idx === i ? { ...item, game: v } : item))} placeholder="Game" placeholderTextColor={Colors.text.muted} />
              </View>
              <View style={[styles.inputWrapper, { flex: 0.55 }]}>
                <TextInput style={styles.input} value={g.uid} onChangeText={v => setGames(prev => prev.map((item, idx) => idx === i ? { ...item, uid: v } : item))} placeholder="UID" placeholderTextColor={Colors.text.muted} />
              </View>
            </View>
            <TouchableOpacity onPress={() => setGames(prev => prev.filter((_, idx) => idx !== i))} style={{ padding: 2 }} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={22} color={Colors.status.error} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 20 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  avatarOption: { width: 60, height: 60, borderRadius: 16, backgroundColor: Colors.background.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.border.default },
  avatarSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(254,76,17,0.1)' },
  avatarEmoji: { fontSize: 28 },
  inputWrapper: { backgroundColor: Colors.background.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: 14, height: 50, justifyContent: 'center' },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  gamesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(254,76,17,0.1)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  gameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  gameInputs: { flex: 1, flexDirection: 'row', gap: 8 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
