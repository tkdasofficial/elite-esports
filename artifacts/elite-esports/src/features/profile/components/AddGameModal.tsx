import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  Image, TextInput, ScrollView, ActivityIndicator, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';
import { useGames } from '@/features/games/hooks/useGames';
import { Game } from '@/utils/types';

interface AddGameModalProps {
  visible: boolean;
  existingGames: { game: string; uid: string }[];
  onClose: () => void;
  onAdd: (game: string, uid: string) => void;
}

type Step = 'select' | 'uid';

export function AddGameModal({ visible, existingGames, onClose, onAdd }: AddGameModalProps) {
  const { games, loading } = useGames();
  const [step, setStep] = useState<Step>('select');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [uid, setUid] = useState('');

  const existingNames = existingGames.map(g => g.game.toLowerCase());

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setUid('');
    setStep('uid');
  };

  const handleAdd = () => {
    if (!selectedGame || !uid.trim()) return;
    onAdd(selectedGame.name, uid.trim());
    reset();
    onClose();
  };

  const reset = () => {
    setStep('select');
    setSelectedGame(null);
    setUid('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          {step === 'uid' ? (
            <TouchableOpacity onPress={() => setStep('select')} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <Text style={styles.title}>{step === 'select' ? 'Select Game' : 'Enter Your UID'}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {step === 'select' ? (
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : games.length === 0 ? (
            <View style={styles.centered}>
              <Ionicons name="game-controller-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.emptyText}>No games available</Text>
              <Text style={styles.emptyHint}>Ask the admin to add games first</Text>
            </View>
          ) : (
            <FlatList
              data={games}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
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
                      <Image source={{ uri: item.banner_url }} style={styles.banner} resizeMode="cover" />
                    ) : (
                      <View style={[styles.banner, styles.bannerPlaceholder]}>
                        <Ionicons name="game-controller-outline" size={28} color={Colors.text.muted} />
                      </View>
                    )}
                    <View style={styles.gameInfo}>
                      <Text style={[styles.gameName, alreadyAdded && styles.textMuted]}>{item.name}</Text>
                      {alreadyAdded && (
                        <View style={styles.addedBadge}>
                          <Ionicons name="checkmark-circle" size={12} color={Colors.status.success} />
                          <Text style={styles.addedText}>Already added</Text>
                        </View>
                      )}
                    </View>
                    {!alreadyAdded && (
                      <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )
        ) : (
          <ScrollView contentContainerStyle={styles.uidBody} showsVerticalScrollIndicator={false}>
            {selectedGame && (
              <>
                {selectedGame.banner_url ? (
                  <Image source={{ uri: selectedGame.banner_url }} style={styles.bigBanner} resizeMode="cover" />
                ) : (
                  <View style={[styles.bigBanner, styles.bannerPlaceholder]}>
                    <Ionicons name="game-controller-outline" size={40} color={Colors.text.muted} />
                  </View>
                )}
                <Text style={styles.selectedGameName}>{selectedGame.name}</Text>
              </>
            )}
            <Text style={styles.fieldLabel}>Your Player UID</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={uid}
                onChangeText={setUid}
                placeholder="Enter your in-game UID"
                placeholderTextColor={Colors.text.muted}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
            </View>
            <Text style={styles.hint}>
              Your UID is your unique player ID found in the game's profile or settings screen.
            </Text>
            <TouchableOpacity
              style={[styles.addBtn, !uid.trim() && styles.disabled]}
              onPress={handleAdd}
              disabled={!uid.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>Add Game</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  emptyHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },

  list: { padding: 16, gap: 10 },
  gameCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.background.card,
    borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border.default,
    paddingRight: 14,
  },
  gameCardDisabled: { opacity: 0.5 },
  banner: { width: 80, aspectRatio: 16 / 9, height: 50 },
  bannerPlaceholder: {
    backgroundColor: Colors.background.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  gameInfo: { flex: 1 },
  gameName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  textMuted: { color: Colors.text.muted },
  addedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  addedText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.status.success },

  uidBody: { padding: 20 },
  bigBanner: {
    width: '100%', aspectRatio: 16 / 9,
    borderRadius: 14, overflow: 'hidden', marginBottom: 14,
  },
  selectedGameName: {
    fontSize: 20, fontFamily: 'Inter_700Bold',
    color: Colors.text.primary, marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: Colors.background.card,
    borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: 14, height: 52, justifyContent: 'center',
  },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  hint: {
    fontSize: 12, fontFamily: 'Inter_400Regular',
    color: Colors.text.muted, marginTop: 10, lineHeight: 18,
  },
  addBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 32,
  },
  disabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
