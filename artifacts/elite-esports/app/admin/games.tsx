import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, TextInput, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGames } from '@/features/games/hooks/useGames';
import { useAdminGames } from '@/features/admin/hooks/useAdminGames';
import { Game } from '@/utils/types';

export default function AdminGamesScreen() {
  const insets = useSafeAreaInsets();
  const { games, loading, refresh } = useGames();
  const { addGame, deleteGame, pickBanner, uploading } = useAdminGames();

  const [showAdd, setShowAdd] = useState(false);
  const [gameName, setGameName] = useState('');
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [bannerFileName, setBannerFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePickBanner = async () => {
    const result = await pickBanner();
    if (result) {
      setBannerUri(result.uri);
      setBannerFileName(result.fileName);
    }
  };

  const handleAdd = async () => {
    const trimmed = gameName.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Please enter a game name.');
      return;
    }
    if (!bannerUri) {
      Alert.alert('Required', 'Please select a banner image (16:9).');
      return;
    }
    setSaving(true);
    const { error } = await addGame(trimmed, bannerUri, bannerFileName!);
    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowAdd(false);
      setGameName('');
      setBannerUri(null);
      setBannerFileName(null);
      refresh();
    }
  };

  const handleDelete = (game: Game) => {
    Alert.alert(
      'Delete Game',
      `Delete "${game.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteGame(game);
            if (error) Alert.alert('Error', error.message);
            else refresh();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Games"
        rightElement={
          <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addIconBtn} activeOpacity={0.8}>
            <Ionicons name="add" size={22} color={Colors.primary} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {games.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="game-controller-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.emptyText}>No games yet</Text>
              <Text style={styles.emptyHint}>Tap + to add the first game</Text>
            </View>
          ) : (
            games.map(game => (
              <View key={game.id} style={styles.gameCard}>
                {game.banner_url ? (
                  <Image source={{ uri: game.banner_url }} style={styles.banner} resizeMode="cover" />
                ) : (
                  <View style={[styles.banner, styles.bannerPlaceholder]}>
                    <Ionicons name="image-outline" size={28} color={Colors.text.muted} />
                  </View>
                )}
                <View style={styles.gameInfo}>
                  <Text style={styles.gameName}>{game.name}</Text>
                  <Text style={styles.gameDate}>
                    Added {new Date(game.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(game)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color={Colors.status.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Game</Text>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={styles.modalClose} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Game Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={gameName}
                onChangeText={setGameName}
                placeholder="e.g. BGMI, Free Fire, Valorant"
                placeholderTextColor={Colors.text.muted}
              />
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Banner (16:9)</Text>
            <TouchableOpacity onPress={handlePickBanner} style={styles.bannerPicker} activeOpacity={0.8}>
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.bannerPreview} resizeMode="cover" />
              ) : (
                <View style={styles.bannerPickerInner}>
                  <Ionicons name="image-outline" size={32} color={Colors.text.muted} />
                  <Text style={styles.bannerPickerText}>Tap to choose image</Text>
                  <Text style={styles.bannerPickerHint}>Recommended 1280 × 720 (16:9)</Text>
                </View>
              )}
            </TouchableOpacity>
            {bannerUri && (
              <TouchableOpacity onPress={handlePickBanner} style={styles.changeBannerBtn} activeOpacity={0.8}>
                <Text style={styles.changeBannerText}>Change Image</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, (saving || uploading) && styles.disabled]}
              onPress={handleAdd}
              disabled={saving || uploading}
              activeOpacity={0.85}
            >
              {saving || uploading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Add Game</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  addIconBtn: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(254,76,17,0.12)',
    borderRadius: 12,
  },
  scroll: { padding: 16 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 17, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  emptyHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },

  gameCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  banner: { width: '100%', aspectRatio: 16 / 9 },
  bannerPlaceholder: {
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: { padding: 14, flex: 1 },
  gameName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 3 },
  gameDate: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  deleteBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8, padding: 7,
  },

  modal: { flex: 1, backgroundColor: Colors.background.dark },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.text.primary },
  modalClose: { padding: 4 },
  modalBody: { padding: 20 },

  fieldLabel: {
    fontSize: 11, fontFamily: 'Inter_600SemiBold',
    color: Colors.text.muted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: Colors.background.card,
    borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: 14, height: 50, justifyContent: 'center',
  },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },

  bannerPicker: {
    width: '100%', aspectRatio: 16 / 9,
    backgroundColor: Colors.background.card,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  bannerPickerInner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  bannerPickerText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: Colors.text.secondary },
  bannerPickerHint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  bannerPreview: { width: '100%', height: '100%' },
  changeBannerBtn: { alignSelf: 'center', marginTop: 10 },
  changeBannerText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 32,
  },
  disabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
