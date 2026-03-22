import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/store/userStore';
import { Colors } from '@/src/theme/colors';

export default function EditGame() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { gameProfiles, updateGameProfile, removeGameProfile } = useUserStore();
  const profile = gameProfiles.find(g => g.id === id);

  const [ign, setIgn] = useState(profile?.ign || '');
  const [uid, setUid] = useState(profile?.uid || '');
  const [loading, setLoading] = useState(false);

  if (!profile) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Game profile not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = async () => {
    if (!ign.trim()) { Alert.alert('Enter IGN'); return; }
    if (!uid.trim()) { Alert.alert('Enter UID'); return; }
    setLoading(true);
    await updateGameProfile(id!, { ign: ign.trim(), uid: uid.trim() });
    setLoading(false);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Remove Game', `Remove ${profile.gameName} profile?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await removeGameProfile(id!); router.back(); } },
    ]);
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
        <Text style={styles.title}>Edit Game Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color={Colors.brandPrimary} size="small" /> : <Text style={styles.saveBtn}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.gameBadge}>
          <Ionicons name="game-controller" size={24} color={Colors.brandPrimary} />
          <Text style={styles.gameName}>{profile.gameName}</Text>
        </View>

        <Text style={styles.sectionLabel}>GAME DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>In-Game Name (IGN)</Text>
            <TextInput style={styles.input} value={ign} onChangeText={setIgn} placeholder="Your IGN" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>User ID</Text>
            <TextInput style={styles.input} value={uid} onChangeText={setUid} placeholder="Your UID" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />
          </View>
        </View>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash" size={16} color={Colors.brandLive} />
          <Text style={styles.deleteBtnText}>Remove Game Profile</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  notFound: { fontSize: 17, color: Colors.textSecondary, marginBottom: 16 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: Colors.brandPrimary, borderRadius: 12 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, borderBottomWidth: 1, borderBottomColor: Colors.appBorder },
  title: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  saveBtn: { fontSize: 17, color: Colors.brandPrimary, fontWeight: '500' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  gameBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: `${Colors.brandPrimary}15`, borderRadius: 14, padding: 16, marginBottom: 4 },
  gameName: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  sectionLabel: { fontSize: 13, color: Colors.textSecondary, letterSpacing: 0.06 },
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 6, fontWeight: '500' },
  input: { fontSize: 16, color: Colors.textPrimary, paddingVertical: 4 },
  divider: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 14, backgroundColor: `${Colors.brandLive}10`, borderRadius: 14, borderWidth: 1, borderColor: `${Colors.brandLive}30` },
  deleteBtnText: { fontSize: 15, fontWeight: '500', color: Colors.brandLive },
});
