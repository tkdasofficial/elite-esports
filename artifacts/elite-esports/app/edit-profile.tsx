import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Modal, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SkeletonBar } from '@/components/SkeletonBar';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/store/ThemeContext';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AvatarSVG, AVATAR_NAMES, AVATAR_COUNT } from '@/components/AvatarSVG';
import { useProfileCtx } from '@/store/ProfileContext';
import { AddGameModal } from '@/features/profile/components/AddGameModal';
import type { AppColors } from '@/utils/colors';

const AVATAR_SIZE = 68;
const AVATAR_GAP = 10;

type LinkedGame = { game_id?: string; game: string; uid: string; inGameName?: string };

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, loading, fetchError, save } = useProfileCtx();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [games, setGames] = useState<LinkedGame[]>([]);
  const [saving, setSaving] = useState(false);
  const [showAddGame, setShowAddGame] = useState(false);

  // Edit game modal state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editIGN, setEditIGN] = useState('');
  const [editUID, setEditUID] = useState('');
  const editUIDRef = useRef<TextInput>(null);

  const initialized = useRef(false);
  useEffect(() => {
    if (loading || initialized.current || !profile.id) return;
    initialized.current = true;
    setName(profile.full_name ?? '');
    setUsername(profile.username ?? '');
    setAvatarIndex(profile.avatar_index ?? 0);
    setGames(Array.isArray(profile.games) ? profile.games : []);
  }, [loading, profile.id]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedUsername = username.trim().replace(/^@/, '');

    if (!trimmedName) {
      Alert.alert('Required', 'Please enter your display name.'); return;
    }
    if (trimmedUsername && !/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
      Alert.alert('Invalid username', 'Username must be 3–20 characters: lowercase letters, numbers, underscores only.');
      return;
    }

    setSaving(true);
    const { error } = await save({
      full_name: trimmedName,
      username: trimmedUsername || null,
      avatar_index: avatarIndex,
      games,
    });
    setSaving(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('username')) {
        Alert.alert('Username taken', 'That username is already in use. Please choose another.');
      } else {
        Alert.alert('Save failed', error.message ?? 'Something went wrong. Please try again.');
      }
    } else {
      Alert.alert('Saved!', 'Your profile has been updated.');
      router.back();
    }
  };

  const handleAddGame = (game_id: string, game: string, uid: string, inGameName: string) => {
    setGames(prev => [...prev, { game_id, game, uid, inGameName }]);
  };

  // Open the edit modal for a game
  const openEditGame = (index: number) => {
    const g = games[index];
    setEditingIndex(index);
    setEditIGN(g.inGameName ?? '');
    setEditUID(g.uid);
  };

  // Save edits from the modal
  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    const trimIGN = editIGN.trim();
    const trimUID = editUID.trim();
    if (!trimUID) return;
    setGames(prev => prev.map((g, i) =>
      i === editingIndex ? { ...g, inGameName: trimIGN || undefined, uid: trimUID } : g
    ));
    setEditingIndex(null);
  };

  // Remove from the edit modal — no Alert needed
  const handleRemoveGame = () => {
    if (editingIndex === null) return;
    setGames(prev => prev.filter((_, i) => i !== editingIndex));
    setEditingIndex(null);
  };

  const editingGame = editingIndex !== null ? games[editingIndex] : null;
  const editCanSave = editUID.trim().length > 0;

  const columns = Array.from({ length: Math.ceil(AVATAR_COUNT / 2) }, (_, col) =>
    [col * 2, col * 2 + 1].filter(i => i < AVATAR_COUNT)
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Edit Profile" />
        <View style={{ padding: 16, gap: 14 }}>
          <SkeletonBar width={80} height={80} radius={40} style={{ alignSelf: 'center' }} />
          <SkeletonBar width="100%" height={52} radius={12} />
          <SkeletonBar width="100%" height={52} radius={12} />
          <SkeletonBar width="100%" height={52} radius={12} />
          <SkeletonBar width="40%" height={44} radius={10} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Edit Profile" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar Picker ── */}
        <Text style={styles.sectionLabel}>Choose Avatar</Text>
        <View style={styles.previewRow}>
          <View style={styles.previewCircle}>
            <AvatarSVG index={avatarIndex} size={72} />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>{AVATAR_NAMES[avatarIndex]}</Text>
            <Text style={styles.previewHint}>Scroll left/right to see all {AVATAR_COUNT} avatars</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarScrollContent}
          style={styles.avatarScroll}
        >
          {columns.map((col, colIdx) => (
            <View
              key={colIdx}
              style={[styles.avatarColumn, { marginRight: colIdx < columns.length - 1 ? AVATAR_GAP : 0 }]}
            >
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
            placeholderTextColor={colors.text.muted}
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        {/* ── Username ── */}
        <Text style={styles.sectionLabel}>Username</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.inputRow}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={username.replace(/^@/, '')}
              onChangeText={v => setUsername(v.toLowerCase().replace(/\s/g, ''))}
              placeholder="your_username"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        </View>
        <Text style={styles.inputHint}>3–20 chars · lowercase · letters, numbers, underscores</Text>

        {/* ── Game IDs ── */}
        <View style={styles.gamesHeader}>
          <Text style={styles.sectionLabel}>Game IDs</Text>
          <TouchableOpacity
            onPress={() => setShowAddGame(true)}
            style={styles.addBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={15} color={colors.primary} />
            <Text style={styles.addBtnText}>Add Game</Text>
          </TouchableOpacity>
        </View>

        {games.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyGames}
            onPress={() => setShowAddGame(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="game-controller-outline" size={28} color={colors.text.muted} />
            <Text style={styles.emptyGamesText}>No games added yet</Text>
            <Text style={styles.emptyGamesHint}>Tap here to link your game accounts</Text>
          </TouchableOpacity>
        ) : (
          <>
            {games.map((g, i) => (
              <TouchableOpacity
                key={`${g.game}-${i}`}
                style={styles.gameRow}
                onPress={() => openEditGame(i)}
                activeOpacity={0.75}
              >
                <View style={styles.gameIconBox}>
                  <Ionicons name="game-controller-outline" size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gameName}>{g.game}</Text>
                  {g.inGameName ? (
                    <>
                      <Text style={styles.gameUID} numberOfLines={1}>IGN: {g.inGameName}</Text>
                      <Text style={styles.gameUID} numberOfLines={1}>UID: {g.uid}</Text>
                    </>
                  ) : (
                    <Text style={styles.gameUID} numberOfLines={1}>UID: {g.uid}</Text>
                  )}
                </View>
                <View style={styles.editChip}>
                  <Feather name="edit-2" size={12} color={colors.primary} />
                  <Text style={styles.editChipText}>Edit</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowAddGame(true)}
              style={styles.addMoreBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.addMoreBtnText}>Add Another Game</Text>
            </TouchableOpacity>
          </>
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
            : (
              <>
                <Ionicons name="checkmark-circle-outline" size={19} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Add Game Modal ── */}
      <AddGameModal
        visible={showAddGame}
        existingGames={games}
        onClose={() => setShowAddGame(false)}
        onAdd={handleAddGame}
      />

      {/* ── Edit Game Modal ── */}
      <Modal
        visible={editingIndex !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingIndex(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setEditingIndex(null)}>
          <Pressable style={styles.editSheet} onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              {/* Handle bar */}
              <View style={styles.sheetHandle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderIcon}>
                  <Ionicons name="game-controller-outline" size={18} color={colors.primary} />
                </View>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  {editingGame?.game ?? ''}
                </Text>
                <TouchableOpacity
                  onPress={() => setEditingIndex(null)}
                  style={styles.sheetClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x" size={17} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* In-game Name */}
              <Text style={styles.fieldLabel}>In-game Name</Text>
              <View style={styles.fieldInput}>
                <Ionicons name="person-outline" size={16} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.fieldInputText}
                  value={editIGN}
                  onChangeText={setEditIGN}
                  placeholder="Your in-game username / gamertag"
                  placeholderTextColor={colors.text.muted}
                  autoFocus
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => editUIDRef.current?.focus()}
                />
              </View>

              {/* Player UID */}
              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Player UID</Text>
              <View style={styles.fieldInput}>
                <Ionicons name="key-outline" size={16} color={colors.text.muted} style={{ marginRight: 10 }} />
                <TextInput
                  ref={editUIDRef}
                  style={styles.fieldInputText}
                  value={editUID}
                  onChangeText={setEditUID}
                  placeholder="Your unique player ID"
                  placeholderTextColor={colors.text.muted}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveEdit}
                />
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveEditBtn, !editCanSave && styles.disabled]}
                onPress={handleSaveEdit}
                disabled={!editCanSave}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveEditBtnText}>Save Changes</Text>
              </TouchableOpacity>

              {/* Remove button */}
              <TouchableOpacity
                style={styles.removeGameBtn}
                onPress={handleRemoveGame}
                activeOpacity={0.85}
              >
                <Ionicons name="trash-outline" size={16} color={colors.status.error} />
                <Text style={styles.removeGameBtnText}>Remove Game</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },
    scroll: { padding: 20 },

    sectionLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 10, marginTop: 24,
    },

    previewRow: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      backgroundColor: colors.background.card,
      borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: colors.border.default, marginBottom: 14,
    },
    previewCircle: {
      width: 80, height: 80, borderRadius: 40, overflow: 'hidden',
      borderWidth: 2.5, borderColor: colors.primary,
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center',
    },
    previewInfo: { flex: 1 },
    previewName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text.primary, marginBottom: 3 },
    previewHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    avatarScroll: { marginHorizontal: -20 },
    avatarScrollContent: { paddingHorizontal: 20, paddingVertical: 4 },
    avatarColumn: { flexDirection: 'column', gap: AVATAR_GAP },
    avatarItem: {
      width: AVATAR_SIZE + 8, height: AVATAR_SIZE + 8,
      borderRadius: 18, overflow: 'hidden',
      borderWidth: 2.5, borderColor: colors.border.default,
      backgroundColor: colors.background.card,
      alignItems: 'center', justifyContent: 'center', position: 'relative',
    },
    avatarItemSelected: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 8, elevation: 8,
    },
    checkBadge: {
      position: 'absolute', bottom: 4, right: 4,
      width: 18, height: 18, borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: 'center', justifyContent: 'center',
    },

    inputWrapper: {
      backgroundColor: colors.background.card,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: 14, height: 50, justifyContent: 'center',
    },
    inputRow: { flexDirection: 'row', alignItems: 'center' },
    atSign: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text.muted, marginRight: 2 },
    input: { color: colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
    inputHint: {
      fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text.muted,
      marginTop: 6, marginLeft: 4,
    },

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
    addBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    emptyGames: {
      alignItems: 'center', gap: 6, padding: 28,
      backgroundColor: colors.background.card,
      borderRadius: 14, borderWidth: 1, borderColor: colors.border.default,
      borderStyle: 'dashed',
    },
    emptyGamesText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.text.secondary },
    emptyGamesHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.muted, textAlign: 'center' },

    gameRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.background.card,
      borderRadius: 12, padding: 14, marginBottom: 8,
      borderWidth: 1, borderColor: colors.border.default,
    },
    gameIconBox: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: 'rgba(254,76,17,0.1)',
      alignItems: 'center', justifyContent: 'center',
    },
    gameName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    gameUID: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text.secondary, marginTop: 2 },
    editChip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.primary + '15',
      borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
      borderWidth: 1, borderColor: colors.primary + '30',
    },
    editChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    addMoreBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, paddingVertical: 12,
      borderWidth: 1, borderColor: 'rgba(254,76,17,0.2)',
      borderStyle: 'dashed', borderRadius: 12, marginTop: 2,
    },
    addMoreBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primary },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: colors.primary,
      borderRadius: 14, height: 54, marginTop: 32,
    },
    disabled: { opacity: 0.45 },
    saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

    // Edit game modal
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    editSheet: {
      backgroundColor: colors.background.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8,
      borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border.default,
    },
    sheetHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.border.default,
      alignSelf: 'center', marginBottom: 16,
    },
    sheetHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 22,
    },
    sheetHeaderIcon: {
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: colors.primary + '1F',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    sheetTitle: {
      flex: 1, fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.text.primary,
    },
    sheetClose: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },

    fieldLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 8,
    },
    fieldInput: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.elevated,
      borderRadius: 12, borderWidth: 1, borderColor: colors.border.default,
      paddingHorizontal: 14, height: 52,
    },
    fieldInputText: {
      flex: 1, color: colors.text.primary,
      fontSize: 15, fontFamily: 'Inter_400Regular',
    },

    saveEditBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: colors.primary,
      borderRadius: 14, height: 52, marginTop: 24,
    },
    saveEditBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

    removeGameBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, height: 48, marginTop: 10,
      borderRadius: 14, borderWidth: 1,
      borderColor: colors.status.error + '40',
      backgroundColor: colors.status.error + '10',
    },
    removeGameBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.status.error },
  });
}
