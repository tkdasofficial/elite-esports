import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { WEB_BOTTOM_INSET } from '@/utils/webInsets';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AvatarSVG, AVATAR_NAMES, AVATAR_COUNT } from '@/components/AvatarSVG';
import { useAuth } from '@/store/AuthContext';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { AddGameModal } from '@/features/profile/components/AddGameModal';

const AVATAR_SIZE = 68;
const AVATAR_GAP = 10;

export default function EditProfileScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { profile, loading, save } = useProfile(user?.id);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [games, setGames] = useState<{ game: string; uid: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);

  useEffect(() => {
    if (!loading) {
      setName(profile.full_name || '');
      setUsername(profile.username || '');
      setAvatarIndex(profile.avatar_index || 0);
      setGames(profile.games || []);
    }
  }, [loading]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await save({ full_name: name, username, avatar_index: avatarIndex, games });
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else { Alert.alert('Saved!', 'Profile updated successfully'); router.back(); }
  };

  const handleAddGame = (game: string, uid: string) => {
    setGames(prev => [...prev, { game, uid }]);
  };

  const handleRemoveGame = (index: number) => {
    setGames(prev => prev.filter((_, i) => i !== index));
  };

  const columns = Array.from({ length: Math.ceil(AVATAR_COUNT / 2) }, (_, col) => [
    col * 2,
    col * 2 + 1,
  ].filter(i => i < AVATAR_COUNT));

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: Colors.background.dark }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Profile" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + WEB_BOTTOM_INSET + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar Picker ── */}
        <Text style={styles.sectionLabel}>Choose Avatar</Text>
        <View style={styles.previewRow}>
          <View style={styles.previewCircle}>
            <AvatarSVG index={avatarIndex} size={72} />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>{AVATAR_NAMES[avatarIndex]}</Text>
            <Text style={styles.previewHint}>Scroll to see all {AVATAR_COUNT} avatars</Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarScrollContent}
          style={styles.avatarScroll}
        >
          {columns.map((col, colIdx) => (
            <View key={colIdx} style={[styles.avatarColumn, { marginRight: colIdx < columns.length - 1 ? AVATAR_GAP : 0 }]}>
              {col.map(idx => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setAvatarIndex(idx)}
                  activeOpacity={0.8}
                  style={[styles.avatarItem, avatarIndex === idx && styles.avatarItemSelected]}
                >
                  <AvatarSVG index={idx} size={AVATAR_SIZE} />
                  {avatarIndex === idx && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* ── Display Name ── */}
        <Text style={styles.sectionLabel}>Display Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.text.muted}
          />
        </View>

        {/* ── Username ── */}
        <Text style={styles.sectionLabel}>Username</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            placeholderTextColor={Colors.text.muted}
            autoCapitalize="none"
          />
        </View>

        {/* ── Game IDs ── */}
        <View style={styles.gamesHeader}>
          <Text style={styles.sectionLabel}>Game IDs</Text>
          <TouchableOpacity
            onPress={() => setShowAddGame(true)}
            style={styles.addBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={15} color={Colors.primary} />
            <Text style={styles.addBtnText}>Add Game</Text>
          </TouchableOpacity>
        </View>

        {games.length === 0 ? (
          <View style={styles.emptyGames}>
            <Ionicons name="game-controller-outline" size={28} color={Colors.text.muted} />
            <Text style={styles.emptyGamesText}>No games added yet</Text>
            <Text style={styles.emptyGamesHint}>Tap "Add Game" to link your game accounts</Text>
          </View>
        ) : (
          games.map((g, i) => (
            <View key={i} style={styles.gameRow}>
              <View style={styles.gameIconBox}>
                <Ionicons name="game-controller-outline" size={17} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gameName}>{g.game}</Text>
                <Text style={styles.gameUID}>UID: {g.uid}</Text>
              </View>
              <TouchableOpacity onPress={() => handleRemoveGame(i)} style={styles.removeBtn} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={22} color={Colors.status.error} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ── Save ── */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>

      <AddGameModal
        visible={showAddGame}
        existingGames={games}
        onClose={() => setShowAddGame(false)}
        onAdd={handleAddGame}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },

  sectionLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 10, marginTop: 24,
  },

  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: Colors.border.default, marginBottom: 14,
  },
  previewCircle: {
    width: 80, height: 80, borderRadius: 40, overflow: 'hidden',
    borderWidth: 2.5, borderColor: Colors.primary,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  previewInfo: { flex: 1 },
  previewName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 3 },
  previewHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },

  avatarScroll: { marginHorizontal: -20 },
  avatarScrollContent: { paddingHorizontal: 20, paddingVertical: 4 },
  avatarColumn: { flexDirection: 'column', gap: AVATAR_GAP },
  avatarItem: {
    width: AVATAR_SIZE + 8, height: AVATAR_SIZE + 8,
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 2.5, borderColor: Colors.border.default,
    backgroundColor: Colors.background.card,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarItemSelected: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 8,
  },
  checkBadge: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  inputWrapper: {
    backgroundColor: Colors.background.card,
    borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: 14, height: 50, justifyContent: 'center',
  },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },

  gamesHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24, marginBottom: 10,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(254,76,17,0.1)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7,
  },
  addBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  emptyGames: {
    alignItems: 'center', gap: 6, padding: 28,
    backgroundColor: Colors.background.card,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border.default,
    borderStyle: 'dashed',
  },
  emptyGamesText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  emptyGamesHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'center' },

  gameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.background.card,
    borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  gameIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(254,76,17,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  gameName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  gameUID: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, marginTop: 2 },
  removeBtn: { padding: 2 },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 32,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
