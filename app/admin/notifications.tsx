import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/lib/supabase';
import { Colors } from '@/src/theme/colors';

const TYPES = ['general', 'match', 'win', 'wallet'];

export default function AdminNotifications() {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { Alert.alert('Fill title and message'); return; }
    setLoading(true);
    const { error } = await supabase.from('notifications').insert({
      title: title.trim(),
      body: body.trim(),
      type,
      target_user_id: null,
      read: false,
    });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Sent!', 'Notification sent to all users');
    setTitle('');
    setBody('');
    setType('general');
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
        <Text style={styles.title}>Send Notification</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Notification title" placeholderTextColor={Colors.textMuted} />
          </View>
          <View style={styles.divider} />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Message *</Text>
            <TextInput
              style={styles.textArea}
              value={body}
              onChangeText={setBody}
              placeholder="Write your message here..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Notification Type</Text>
            <View style={styles.typeRow}>
              {TYPES.map(t => (
                <TouchableOpacity key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                  <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.previewBox}>
            <View style={styles.previewHeader}>
              <Ionicons name="notifications" size={16} color={Colors.brandPrimary} />
              <Text style={styles.previewLabel}>Preview</Text>
            </View>
            <Text style={styles.previewTitle}>{title || 'Notification Title'}</Text>
            <Text style={styles.previewBody}>{body || 'Your message will appear here...'}</Text>
          </View>
        </View>

        <View style={styles.sendSection}>
          <View style={styles.audienceCard}>
            <Ionicons name="people" size={20} color={Colors.brandPrimary} />
            <Text style={styles.audienceText}>This will be sent to ALL users</Text>
          </View>
          <TouchableOpacity style={[styles.sendBtn, loading && styles.disabled]} onPress={handleSend} disabled={loading}>
            {loading ? <ActivityIndicator color={Colors.white} /> : (
              <>
                <Ionicons name="send" size={18} color={Colors.white} />
                <Text style={styles.sendBtnText}>Send to All Users</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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
  card: { backgroundColor: Colors.appCard, borderRadius: 16, overflow: 'hidden' },
  field: { paddingHorizontal: 16, paddingVertical: 12 },
  fieldLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 8, fontWeight: '500' },
  input: { fontSize: 16, color: Colors.textPrimary, paddingVertical: 4 },
  textArea: { fontSize: 16, color: Colors.textPrimary, minHeight: 100, paddingVertical: 4 },
  divider: { height: 1, backgroundColor: Colors.appBorder, marginLeft: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 4 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.appElevated, borderRadius: 20 },
  typeChipActive: { backgroundColor: Colors.brandPrimary },
  typeChipText: { fontSize: 14, color: Colors.textSecondary, textTransform: 'capitalize' },
  typeChipTextActive: { color: Colors.white },
  previewBox: { padding: 16, gap: 8 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  previewLabel: { fontSize: 12, color: Colors.brandPrimary, fontWeight: '600' },
  previewTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  previewBody: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  sendSection: { gap: 10 },
  audienceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: `${Colors.brandPrimary}12`, borderRadius: 14, padding: 14 },
  audienceText: { fontSize: 14, color: Colors.textPrimary },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, backgroundColor: Colors.brandPrimary, borderRadius: 14 },
  sendBtnText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  disabled: { opacity: 0.4 },
});
