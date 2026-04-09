import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Image, TextInput, ScrollView, ActivityIndicator,
  FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/store/ThemeContext';
import { useGames } from '@/features/games/hooks/useGames';
import { Game } from '@/utils/types';
import type { AppColors } from '@/utils/colors';

interface AddGameModalProps {
  visible: boolean;
  existingGames: { game: string; uid: string }[];
  onClose: () => void;
  onAdd: (game_id: string, game: string, uid: string, inGameName: string) => void;
}

type Step = 'select' | 'details';

export function AddGameModal({ visible, existingGames, onClose, onAdd }: AddGameModalProps) {
  const { games, loading } = useGames();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState<Step>('select');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [inGameName, setInGameName] = useState('');
  const [uid, setUid] = useState('');

  const uidRef = useRef<TextInput>(null);
  const existingNames = existingGames.map(g => g.game.toLowerCase());

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setInGameName('');
    setUid('');
    setStep('details');
  };

  const canAdd = inGameName.trim().length > 0 && uid.trim().length > 0;

  const handleAdd = () => {
    if (!selectedGame || !canAdd) return;
    onAdd(selectedGame.id, selectedGame.name, uid.trim(), inGameName.trim());
    reset();
    onClose();
  };

  const reset = () => {
    setStep('select');
    setSelectedGame(null);
    setInGameName('');
    setUid('');
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>

        {/* ── Header ── */}
        <View style={styles.header}>
          {step === 'details' ? (
            <TouchableOpacity onPress={() => setStep('select')} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.navBtn} />
          )}
          <Text style={styles.headerTitle}>
            {step === 'select' ? 'Select Game' : 'Game Details'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Step indicator ── */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step === 'select' && styles.stepDotActive]} />
          <View style={styles.stepLine} />
          <View style={[styles.stepDot, step === 'details' && styles.stepDotActive]} />
        </View>

        {/* ── Step 1: Select game ── */}
        {step === 'select' && (
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : games.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="game-controller-outline" size={48} color={colors.text.muted} />
              <Text style={styles.emptyTitle}>No games available</Text>
              <Text style={styles.emptyHint}>No games available yet. Check back soon.</Text>
            </View>
          ) : (
            <FlatList
              data={games}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.gameList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const alreadyAdded = existingNames.includes(item.name.toLowerCase());
                return (
                  <TouchableOpacity
                    style={[styles.gameCard, alreadyAdded && styles.gameCardDisabled]}
                    onPress={() => !alreadyAdded && handleSelectGame(item)}
                    activeOpacity={alreadyAdded ? 1 : 0.8}
                    disabled={alreadyAdded}
                  >
                    {item.banner_url ? (
                      <Image source={{ uri: item.banner_url }} style={styles.gameBanner} resizeMode="cover" />
                    ) : (
                      <View style={[styles.gameBanner, styles.gameBannerPlaceholder]}>
                        <Ionicons name="game-controller-outline" size={28} color={colors.text.muted} />
                      </View>
                    )}
                    <View style={styles.gameInfo}>
                      <Text style={[styles.gameName, alreadyAdded && styles.textMuted]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {alreadyAdded && (
                        <View style={styles.addedBadge}>
                          <Ionicons name="checkmark-circle" size={27} color={colors.status.success} />
                          <Text style={styles.addedText}>Already added</Text>
                        </View>
                      )}
                    </View>
                    {!alreadyAdded && (
                      <Ionicons name="chevron-forward" size={23} color={colors.text.muted} style={{ marginRight: 4 }} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )
        )}

        {/* ── Step 2: Enter details ── */}
        {step === 'details' && selectedGame && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={20}
          >
            <ScrollView
              contentContainerStyle={styles.detailsBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.selectedGameChip}>
                {selectedGame.banner_url ? (
                  <Image source={{ uri: selectedGame.banner_url }} style={styles.chipBanner} resizeMode="cover" />
                ) : (
                  <View style={[styles.chipBanner, styles.gameBannerPlaceholder]}>
                    <Ionicons name="game-controller-outline" size={27} color={colors.text.muted} />
                  </View>
                )}
                <Text style={styles.chipName} numberOfLines={1}>{selectedGame.name}</Text>
                <TouchableOpacity
                  onPress={() => setStep('select')}
                  style={styles.chipChange}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipChangeText}>Change</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>In-game Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={27} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={inGameName}
                  onChangeText={setInGameName}
                  placeholder="Your username / gamertag"
                  placeholderTextColor={colors.text.muted}
                  autoFocus
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => uidRef.current?.focus()}
                />
              </View>
              <Text style={styles.fieldHint}>The name other players see in-game</Text>

              <Text style={[styles.fieldLabel, { marginTop: 22 }]}>Player UID</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="key-outline" size={27} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  ref={uidRef}
                  style={styles.input}
                  value={uid}
                  onChangeText={setUid}
                  placeholder="Your unique player ID"
                  placeholderTextColor={colors.text.muted}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
              </View>
              <Text style={styles.fieldHint}>Find this in the game's profile or settings screen</Text>

              <TouchableOpacity
                style={[styles.addBtn, !canAdd && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!canAdd}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={30} color="#fff" />
                <Text style={styles.addBtnText}>Add Game</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.dark },

    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingTop: 18, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border.default,
    },
    navBtn: {
      width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.text.primary,
    },

    stepIndicator: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', paddingVertical: 14, gap: 0,
    },
    stepDot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: colors.border.default,
    },
    stepDotActive: { backgroundColor: colors.primary, width: 20, borderRadius: 4 },
    stepLine: {
      width: 40, height: 2,
      backgroundColor: colors.border.default,
      marginHorizontal: 6,
    },

    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
    emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.text.secondary },
    emptyHint:  { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text.muted },

    gameList: { padding: 16, gap: 10 },
    gameCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 14, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border.default,
      paddingRight: 10,
    },
    gameCardDisabled: { opacity: 0.45 },
    gameBanner: { width: 76, height: 52 },
    gameBannerPlaceholder: {
      backgroundColor: colors.background.elevated,
      alignItems: 'center', justifyContent: 'center',
    },
    gameInfo: { flex: 1, paddingHorizontal: 12 },
    gameName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text.primary },
    textMuted: { color: colors.text.muted },
    addedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    addedText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.status.success },

    detailsBody: { padding: 20, paddingBottom: 48 },

    selectedGameChip: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: colors.border.default,
      marginBottom: 24,
    },
    chipBanner: { width: 56, height: 38 },
    chipName: {
      flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold',
      color: colors.text.primary, paddingHorizontal: 12,
    },
    chipChange: {
      paddingHorizontal: 14, paddingVertical: 10,
    },
    chipChangeText: {
      fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.primary,
    },

    fieldLabel: {
      fontSize: 11, fontFamily: 'Inter_600SemiBold',
      color: colors.text.muted, textTransform: 'uppercase',
      letterSpacing: 1, marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.background.card,
      borderRadius: 12, borderWidth: 1,
      borderColor: colors.border.default,
      paddingHorizontal: 14, height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: {
      flex: 1, color: colors.text.primary,
      fontSize: 15, fontFamily: 'Inter_400Regular',
    },
    fieldHint: {
      fontSize: 11, fontFamily: 'Inter_400Regular',
      color: colors.text.muted, marginTop: 6, marginLeft: 2,
    },

    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, backgroundColor: colors.primary,
      borderRadius: 14, height: 54, marginTop: 32,
    },
    addBtnDisabled: { opacity: 0.45 },
    addBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  });
}
