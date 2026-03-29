import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/utils/colors';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { supabase } from '@/services/supabase';

type Tab = 'compose' | 'history';

interface SentNotification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export default function AdminBroadcastScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('compose');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, title, message, created_at')
      .order('created_at', { ascending: false })
      .limit(30);
    setHistory(data ?? []);
    setLoadingHistory(false);
  }, []);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Required', 'Please fill in both title and message.'); return;
    }
    Alert.alert('Send Broadcast', `Send "${title}" to all users?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send', onPress: async () => {
          setSending(true);
          const { data: users } = await supabase.from('users').select('id');
          if (!users || users.length === 0) {
            setSending(false); Alert.alert('Info', 'No users to broadcast to.'); return;
          }
          const notifications = users.map(u => ({
            user_id: u.id, title: title.trim(), message: message.trim(), is_read: false,
          }));
          let hasError = false;
          for (let i = 0; i < notifications.length; i += 50) {
            const { error } = await supabase.from('notifications').insert(notifications.slice(i, i + 50));
            if (error) { hasError = true; break; }
          }
          setSending(false);
          if (hasError) {
            Alert.alert('Error', 'Some notifications could not be sent.');
          } else {
            Alert.alert('Sent!', `Broadcast sent to ${users.length} users.`);
            setTitle(''); setMessage('');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <AdminHeader title="Broadcast" />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['compose', 'history'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t} style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)} activeOpacity={0.8}
          >
            <Ionicons
              name={t === 'compose' ? 'create-outline' : 'time-outline'}
              size={15}
              color={tab === t ? Colors.primary : Colors.text.muted}
            />
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'compose' ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.status.info} />
            <Text style={styles.infoText}>
              Broadcasts are delivered as in-app notifications to all registered users instantly.
            </Text>
          </View>

          <Text style={styles.fieldLabel}>Notification Title</Text>
          <View style={[styles.inputWrap, title.length > 0 && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. New Tournament Live!"
              placeholderTextColor={Colors.text.muted}
              maxLength={80}
            />
          </View>
          <Text style={styles.charCount}>{title.length}/80</Text>

          <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Message</Text>
          <View style={[styles.inputWrap, styles.textArea, message.length > 0 && styles.inputWrapFocused]}>
            <TextInput
              style={[styles.input, { textAlignVertical: 'top', height: 100 }]}
              value={message}
              onChangeText={setMessage}
              placeholder="Write your broadcast message here…"
              placeholderTextColor={Colors.text.muted}
              multiline
              maxLength={300}
            />
          </View>
          <Text style={styles.charCount}>{message.length}/300</Text>

          {title.trim() && message.trim() && (
            <View style={styles.preview}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewCard}>
                <View style={styles.previewIcon}>
                  <Ionicons name="notifications" size={16} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>{title}</Text>
                  <Text style={styles.previewMsg} numberOfLines={2}>{message}</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.sendBtn, (!title.trim() || !message.trim() || sending) && styles.disabled]}
            onPress={handleSend}
            disabled={!title.trim() || !message.trim() || sending}
            activeOpacity={0.85}
          >
            {sending ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="send" size={17} color="#fff" />
                <Text style={styles.sendBtnText}>Send to All Users</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        loadingHistory ? (
          <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="megaphone-outline" size={52} color={Colors.text.muted} />
                <Text style={styles.emptyTitle}>No broadcasts yet</Text>
                <Text style={styles.emptyHint}>Sent broadcasts appear here</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.histCard}>
                <View style={styles.histTop}>
                  <View style={styles.histIcon}>
                    <Ionicons name="notifications-outline" size={16} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.histTitle}>{item.title}</Text>
                    <Text style={styles.histDate}>
                      {new Date(item.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.histMsg}>{item.message}</Text>
              </View>
            )}
          />
        )
      )}
    </View>
  );
}

const C = { card: '#111111', border: '#2A2A2A', elevated: '#1A1A1A' };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background.dark },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: 'rgba(254,76,17,0.12)', borderColor: Colors.primary + '60' },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted },
  tabTextActive: { color: Colors.primary },
  scroll: { padding: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 20 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  inputWrap: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, minHeight: 50, justifyContent: 'center' },
  inputWrapFocused: { borderColor: Colors.primary + '60' },
  textArea: { justifyContent: 'flex-start', paddingVertical: 12 },
  input: { color: Colors.text.primary, fontSize: 15, fontFamily: 'Inter_400Regular' },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted, textAlign: 'right', marginTop: 4 },
  preview: { marginTop: 20, marginBottom: 8 },
  previewLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.text.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  previewCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.elevated, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border },
  previewIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(254,76,17,0.15)', alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.text.primary, marginBottom: 2 },
  previewMsg: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, height: 54, marginTop: 24 },
  disabled: { opacity: 0.5 },
  sendBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text.secondary },
  emptyHint: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  histCard: { backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  histTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  histIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(254,76,17,0.12)', alignItems: 'center', justifyContent: 'center' },
  histTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.text.primary },
  histDate: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.text.muted },
  histMsg: { fontSize: 13, fontFamily: 'Inter_400Regular', color: Colors.text.secondary, lineHeight: 19 },
});
